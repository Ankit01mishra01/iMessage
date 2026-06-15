import redisClient, { isAccessTokenBlacklisted } from '../services/redis.service.js';
import { getTokenFromRequest, verifyAccessToken } from '../utils/jwt.utils.js';

export const authUser = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized User' });
        }

        const isBlackListed = await isAccessTokenBlacklisted(token);

        if (isBlackListed) {
            res.clearCookie('token');
            return res.status(401).json({ error: 'Unauthorized User' });
        }

        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        return res.status(401).json({ error: 'Unauthorized User' });
    }
};

export const authAdmin = async (req, res, next) => {
    await authUser(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    });
};

export const authSocket = async (socket, next) => {
    try {
        const token =
            socket.handshake.auth?.token ||
            (socket.handshake.headers.authorization?.startsWith('Bearer ')
                ? socket.handshake.headers.authorization.slice(7)
                : null);

        if (!token) {
            return next(new Error('Authentication error'));
        }

        const isBlackListed = await isAccessTokenBlacklisted(token);
        if (isBlackListed) {
            return next(new Error('Authentication error'));
        }

        const decoded = verifyAccessToken(token);
        socket.user = decoded;
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
};

export const verifySocketProjectAccess = async (socket, next) => {
    try {
        const projectId = socket.handshake.query.projectId;

        if (!projectId) {
            return next(new Error('projectId is required'));
        }

        const mongoose = (await import('mongoose')).default;
        const projectModel = (await import('../models/project.model.js')).default;
        const userModel = (await import('../models/user.model.js')).default;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid projectId'));
        }

        const project = await projectModel.findById(projectId);
        if (!project) {
            return next(new Error('Project not found'));
        }

        const user = await userModel.findById(socket.user._id);
        const globalRole = user?.role || 'user';

        if (!project.hasActiveAccess(socket.user._id) && globalRole !== 'admin') {
            return next(new Error('Forbidden'));
        }

        socket.project = project;
        next();
    } catch (error) {
        next(error);
    }
};
