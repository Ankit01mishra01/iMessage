import * as projectService from '../services/project.service.js';
import * as messageService from '../services/message.service.js';
import userModel from '../models/user.model.js';
import { validationResult } from 'express-validator';

export const createProject = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name } = req.body;
        const loggedInUser = await userModel.findById(req.user._id);
        const newProject = await projectService.createProject({ name, userId: loggedInUser._id });

        res.status(201).json(newProject);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};

export const getAllProject = async (req, res) => {
    try {
        const loggedInUser = await userModel.findById(req.user._id);
        const allUserProjects = await projectService.getAllProjectByUserId({
            userId: loggedInUser._id,
        });

        return res.status(200).json({ projects: allUserProjects });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};

export const addUserToProject = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId, users, role } = req.body;
        const loggedInUser = await userModel.findById(req.user._id);

        const project = await projectService.inviteUsersToProject({
            projectId,
            users,
            userId: loggedInUser._id,
            role: role || 'collaborator',
        });

        return res.status(200).json({ project });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};

export const respondInvite = async (req, res) => {
    try {
        const { projectId, action } = req.body;
        const loggedInUser = await userModel.findById(req.user._id);

        const project = await projectService.respondToInvite({
            projectId,
            userId: loggedInUser._id,
            action,
        });

        return res.status(200).json({ project });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};

export const removeMember = async (req, res) => {
    try {
        const { projectId, userId: targetUserId } = req.body;
        const loggedInUser = await userModel.findById(req.user._id);

        const project = await projectService.removeUserFromProject({
            projectId,
            targetUserId,
            userId: loggedInUser._id,
        });

        return res.status(200).json({ project });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};

export const getPendingInvites = async (req, res) => {
    try {
        const loggedInUser = await userModel.findById(req.user._id);
        const invites = await projectService.getPendingInvitesForUser({ userId: loggedInUser._id });
        return res.status(200).json({ invites });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};

export const getProjectById = async (req, res) => {
    const { projectId } = req.params;

    try {
        const loggedInUser = await userModel.findById(req.user._id);
        const project = await projectService.getProjectById({
            projectId,
            userId: loggedInUser._id,
            globalRole: loggedInUser.role,
        });

        return res.status(200).json({ project });
    } catch (err) {
        console.error(err);
        res.status(err.message === 'Forbidden' ? 403 : 400).json({ error: err.message });
    }
};

export const updateFileTree = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId, fileTree } = req.body;
        const loggedInUser = await userModel.findById(req.user._id);

        const project = await projectService.updateFileTree({
            projectId,
            fileTree,
            userId: loggedInUser._id,
            globalRole: loggedInUser.role,
        });

        return res.status(200).json({ project });
    } catch (err) {
        console.error(err);
        res.status(err.message === 'Forbidden' ? 403 : 400).json({ error: err.message });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { limit, before } = req.query;
        const loggedInUser = await userModel.findById(req.user._id);

        await projectService.getProjectById({
            projectId,
            userId: loggedInUser._id,
            globalRole: loggedInUser.role,
        });

        const messages = await messageService.getProjectMessages({
            projectId,
            limit: limit ? Number(limit) : 50,
            before,
        });

        return res.status(200).json({
            messages: messages.map(messageService.formatMessageForClient),
        });
    } catch (err) {
        console.error(err);
        res.status(err.message === 'Forbidden' ? 403 : 400).json({ error: err.message });
    }
};
