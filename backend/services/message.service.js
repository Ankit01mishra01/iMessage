import messageModel from '../models/message.model.js';
import mongoose from 'mongoose';

export async function saveMessage({ projectId, senderId, senderType = 'user', message }) {
    return messageModel.create({
        project: projectId,
        sender: senderType === 'user' ? senderId : null,
        senderType,
        message,
    });
}

export async function getProjectMessages({ projectId, limit = 50, before }) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid projectId');
    }

    const query = { project: projectId };
    if (before) {
        query.createdAt = { $lt: new Date(before) };
    }

    const messages = await messageModel
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('sender', 'email');

    return messages.reverse();
}

export function formatMessageForClient(doc) {
    if (doc.senderType === 'ai') {
        return {
            message: doc.message,
            sender: {
                _id: 'ai',
                email: 'AI',
            },
            createdAt: doc.createdAt,
        };
    }

    return {
        message: doc.message,
        sender: {
            _id: doc.sender?._id?.toString() || doc.sender,
            email: doc.sender?.email || 'Unknown',
        },
        createdAt: doc.createdAt,
    };
}
