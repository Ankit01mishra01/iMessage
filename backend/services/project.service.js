import projectModel from '../models/project.model.js';
import userModel from '../models/user.model.js';
import mongoose from 'mongoose';

export const createProject = async ({ name, userId }) => {
    if (!name) {
        throw new Error('Name is required');
    }
    if (!userId) {
        throw new Error('UserId is required');
    }

    try {
        return await projectModel.create({
            name,
            owner: userId,
            users: [userId],
            members: [
                {
                    user: userId,
                    role: 'owner',
                    status: 'active',
                },
            ],
        });
    } catch (error) {
        if (error.code === 11000) {
            throw new Error('Project name already exists');
        }
        throw error;
    }
};

export const getAllProjectByUserId = async ({ userId }) => {
    if (!userId) {
        throw new Error('UserId is required');
    }

    return projectModel
        .find({
            $or: [{ users: userId }, { owner: userId }],
        })
        .sort({ updatedAt: -1 });
};

export const inviteUsersToProject = async ({ projectId, users, userId, role = 'collaborator' }) => {
    if (!projectId) {
        throw new Error('projectId is required');
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid projectId');
    }

    if (!users || !Array.isArray(users) || users.length === 0) {
        throw new Error('users are required');
    }

    if (users.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
        throw new Error('Invalid userId(s) in users array');
    }

    // Verify that all user IDs correspond to existing users in the database
    const existingUsers = await userModel.find({ _id: { $in: users } }).select('_id');
    if (existingUsers.length !== users.length) {
        throw new Error('One or more users do not exist');
    }

    const project = await projectModel.findOne({
        _id: projectId,
        $or: [{ owner: userId }, { users: userId }],
    });

    if (!project) {
        throw new Error('User does not belong to this project');
    }

    if (!project.canManageMembers(userId)) {
        throw new Error('Forbidden');
    }

    const inviteEntries = users
        .filter((id) => id.toString() !== userId.toString())
        .map((id) => ({
            user: id,
            role,
            status: 'pending',
            invitedBy: userId,
        }));

    for (const entry of inviteEntries) {
        const existingMember = project.members.find((member) => member.user.toString() === entry.user.toString());

        if (existingMember) {
            existingMember.status = 'pending';
            existingMember.role = role;
            existingMember.invitedBy = userId;
        } else {
            project.members.push(entry);
        }
    }

    await project.save();
    return project.populate('members.user', 'email');
};

export const respondToInvite = async ({ projectId, userId, action }) => {
    const project = await projectModel.findById(projectId);
    if (!project) {
        throw new Error('Project not found');
    }

    const member = project.members.find((entry) => entry.user.toString() === userId.toString());
    if (!member || member.status !== 'pending') {
        throw new Error('No pending invite found');
    }

    if (action === 'accept') {
        member.status = 'active';
        await projectModel.updateOne(
            { _id: projectId },
            {
                $addToSet: { users: userId },
            }
        );
    } else if (action === 'reject') {
        member.status = 'rejected';
    } else {
        throw new Error('Invalid action');
    }

    await project.save();
    return project.populate(['members.user', 'users']);
};

export const removeUserFromProject = async ({ projectId, targetUserId, userId }) => {
    const project = await projectModel.findById(projectId);
    if (!project) {
        throw new Error('Project not found');
    }

    if (!project.canManageMembers(userId)) {
        throw new Error('Forbidden');
    }

    if (project.owner.toString() === targetUserId.toString()) {
        throw new Error('Cannot remove project owner');
    }

    project.users = project.users.filter((id) => id.toString() !== targetUserId.toString());
    project.members = project.members.filter((member) => member.user.toString() !== targetUserId.toString());
    await project.save();

    return project.populate('users', 'email');
};

export const getProjectById = async ({ projectId, userId, globalRole }) => {
    if (!projectId) {
        throw new Error('projectId is required');
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid projectId');
    }

    const project = await projectModel.findById(projectId).populate('users', 'email').populate('members.user', 'email');

    if (!project) {
        throw new Error('Project not found');
    }

    if (!project.hasActiveAccess(userId) && globalRole !== 'admin') {
        throw new Error('Forbidden');
    }

    return project;
};

export const updateFileTree = async ({ projectId, fileTree, userId, globalRole }) => {
    if (!projectId) {
        throw new Error('projectId is required');
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid projectId');
    }

    if (!fileTree) {
        throw new Error('fileTree is required');
    }

    const project = await projectModel.findById(projectId);
    if (!project) {
        throw new Error('Project not found');
    }

    if (!project.canEditProject(userId, globalRole)) {
        throw new Error('Forbidden');
    }

    project.fileTree = fileTree;
    await project.save();
    return project;
};

export const getPendingInvitesForUser = async ({ userId }) => {
    return projectModel
        .find({
            members: {
                $elemMatch: {
                    user: userId,
                    status: 'pending',
                },
            },
        })
        .select('name owner members')
        .populate('owner', 'email')
        .populate('members.user', 'email');
};
