import 'dotenv/config';
import http from 'http';
import app from './app.js';
import connect from './db/db.js';
import { Server } from 'socket.io';
import { authSocket, verifySocketProjectAccess } from './middleware/auth.middleware.js';
import { generateResult } from './services/ai.service.js';
import { saveMessage } from './services/message.service.js';
import userModel from './models/user.model.js';
import { getCorsOrigin } from './config/env.js';

const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: getCorsOrigin(),
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
});

io.use(authSocket);
io.use(verifySocketProjectAccess);

io.on('connection', (socket) => {
    socket.roomId = socket.project._id.toString();
    console.log(`User ${socket.user.email} connected to project ${socket.roomId}`);

    socket.join(socket.roomId);

    socket.on('project-message', async (data) => {
        try {
            const messageText = data?.message?.trim();
            if (!messageText) return;

            const senderUser = await userModel.findById(socket.user._id);
            const payload = {
                message: messageText,
                sender: {
                    _id: senderUser._id.toString(),
                    email: senderUser.email,
                },
            };

            await saveMessage({
                projectId: socket.roomId,
                senderId: senderUser._id,
                senderType: 'user',
                message: messageText,
            });

            socket.broadcast.to(socket.roomId).emit('project-message', payload);

            if (messageText.includes('@ai')) {
                const prompt = messageText.replace('@ai', '').trim();

                try {
                    const result = await generateResult(prompt || 'Hello');
                    const aiPayload = {
                        message: result,
                        sender: { _id: 'ai', email: 'AI' },
                    };

                    await saveMessage({
                        projectId: socket.roomId,
                        senderType: 'ai',
                        message: result,
                    });

                    io.to(socket.roomId).emit('project-message', aiPayload);
                } catch (error) {
                    io.to(socket.roomId).emit('project-message', {
                        message: JSON.stringify({ text: `AI error: ${error.message}` }),
                        sender: { _id: 'ai', email: 'AI' },
                    });
                }
            }
        } catch (error) {
            console.error('Socket message error:', error);
            socket.emit('project-error', { error: error.message });
        }
    });

    socket.on('typing', (data) => {
        socket.broadcast.to(socket.roomId).emit('typing', {
            user: socket.user,
            isTyping: Boolean(data?.isTyping),
        });
    });

    socket.on('messages:read', async () => {
        socket.broadcast.to(socket.roomId).emit('messages:read', {
            userId: socket.user._id,
            readAt: new Date().toISOString(),
        });
    });

    socket.on('disconnect', () => {
        console.log(`User ${socket.user.email} disconnected`);
        socket.leave(socket.roomId);
    });
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

await connect();

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export { app, server, io };