import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        role: {
            type: String,
            enum: ['owner', 'collaborator', 'member'],
            default: 'member',
        },
        status: {
            type: String,
            enum: ['active', 'pending', 'rejected'],
            default: 'active',
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
        },
    },
    { _id: false }
);

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            lowercase: true,
            required: true,
            trim: true,
            unique: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        users: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user',
            },
        ],
        members: [memberSchema],
        fileTree: {
            type: Object,
            default: {},
        },
    },
    { timestamps: true }
);

projectSchema.index({ users: 1 });
projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });

function normalizeId(value) {
    if (!value) {
        return null;
    }
    if (typeof value === 'string') {
        return value;
    }
    if (value._id) {
        return value._id.toString();
    }
    return value.toString();
}

projectSchema.methods.getMemberRole = function (userId) {
    const id = normalizeId(userId);
    if (normalizeId(this.owner) === id) {
        return 'owner';
    }

    const member = this.members?.find(
        (entry) => normalizeId(entry.user) === id && entry.status === 'active'
    );
    return member?.role || null;
};

projectSchema.methods.hasActiveAccess = function (userId) {
    const id = normalizeId(userId);
    if (normalizeId(this.owner) === id) {
        return true;
    }

    return this.users.some((user) => normalizeId(user) === id);
};

projectSchema.methods.canManageMembers = function (userId, globalRole) {
    if (globalRole === 'admin') {
        return true;
    }
    return this.getMemberRole(userId) === 'owner';
};

projectSchema.methods.canEditProject = function (userId, globalRole) {
    if (globalRole === 'admin') {
        return true;
    }
    const role = this.getMemberRole(userId);
    return role === 'owner' || role === 'collaborator';
};

const Project = mongoose.model('project', projectSchema);

export default Project;
