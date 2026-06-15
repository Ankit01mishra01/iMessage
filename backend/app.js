import express from 'express';
import morgan from 'morgan';
import { pingMongo } from './db/db.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { getCorsOrigin, validateEnv } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { pingRedis } from './services/redis.service.js';

if (process.env.NODE_ENV !== 'test') {
    validateEnv({ strict: process.env.NODE_ENV === 'production' });
}

const app = express();
const corsOrigins = getCorsOrigin();

app.use(
    cors({
        origin: corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        optionsSuccessStatus: 200,
    })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', async (req, res) => {
    const mongoOk = await pingMongo();
    let redisOk = false;
    try {
        redisOk = await pingRedis();
    } catch {
        redisOk = false;
    }

    res.status(200).json({
        status: mongoOk ? 'ok' : 'degraded',
        services: {
            mongo: mongoOk ? 'up' : 'down',
            redis: redisOk ? 'up' : 'down',
        },
        timestamp: new Date().toISOString(),
    });
});

app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/ai', aiRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'SOEN API', health: '/health' });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;