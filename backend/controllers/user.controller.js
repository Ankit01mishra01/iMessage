import userModel from '../models/user.model.js';
import * as userService from '../services/user.service.js';
import * as authService from '../services/auth.service.js';
import { validationResult } from 'express-validator';
import { getTokenFromRequest } from '../utils/jwt.utils.js';

function sanitizeUser(user) {
    const plain = user.toObject ? user.toObject() : user;
    delete plain.password;
    return plain;
}

export const createUserController = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await userService.createUser(req.body);
        const { accessToken, refreshToken } = await authService.issueAuthTokens(user);

        res.status(201).json({
            user: sanitizeUser(user),
            token: accessToken,
            refreshToken,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const loginController = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await user.isValidPassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const { accessToken, refreshToken } = await authService.issueAuthTokens(user);

        res.status(200).json({
            user: sanitizeUser(user),
            token: accessToken,
            refreshToken,
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};

export const profileController = async (req, res) => {
    try {
        const user = await userModel.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ user: sanitizeUser(user) });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const refreshTokenController = async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        const tokens = await authService.rotateRefreshToken(refreshToken);
        res.status(200).json({
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

export const logoutController = async (req, res) => {
    try {
        const accessToken = getTokenFromRequest(req);
        const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

        await authService.revokeSession(accessToken, refreshToken);

        res.clearCookie('token');
        res.clearCookie('refreshToken');
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};

export const getAllUsersController = async (req, res) => {
    try {
        const loggedInUser = await userModel.findById(req.user._id);
        const allUsers = await userService.getAllUsers({ userId: loggedInUser._id });

        return res.status(200).json({ users: allUsers });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};
