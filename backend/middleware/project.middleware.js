import mongoose from 'mongoose';
import projectModel from '../models/project.model.js';
import userModel from '../models/user.model.js';

async function loadProject(projectId) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw Object.assign(new Error('Invalid projectId'), { statusCode: 400 });
    }

    const project = await projectModel.findById(projectId);
    if (!project) {
        throw Object.assign(new Error('Project not found'), { statusCode: 404 });
    }

    return project;
}

async function getRequestUser(req) {
    const user = await userModel.findById(req.user._id);
    if (!user) {
        throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }
    return user;
}

export const requireProjectAccess = async (req, res, next) => {
    try {
        const projectId = req.params.projectId || req.body.projectId;
        const project = await loadProject(projectId);
        const user = await getRequestUser(req);

        if (!project.hasActiveAccess(user._id) && user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        req.project = project;
        req.dbUser = user;
        next();
    } catch (error) {
        return res.status(error.statusCode || 400).json({ error: error.message });
    }
};

export const requireProjectEdit = async (req, res, next) => {
    try {
        const projectId = req.params.projectId || req.body.projectId;
        const project = await loadProject(projectId);
        const user = await getRequestUser(req);

        if (!project.canEditProject(user._id, user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        req.project = project;
        req.dbUser = user;
        next();
    } catch (error) {
        return res.status(error.statusCode || 400).json({ error: error.message });
    }
};

export const requireProjectManageMembers = async (req, res, next) => {
    try {
        const projectId = req.params.projectId || req.body.projectId;
        const project = await loadProject(projectId);
        const user = await getRequestUser(req);

        if (!project.canManageMembers(user._id, user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        req.project = project;
        req.dbUser = user;
        next();
    } catch (error) {
        return res.status(error.statusCode || 400).json({ error: error.message });
    }
};
