import mongoose from 'mongoose';
import { generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils.js';
import {
    blacklistAccessToken,
    isRefreshTokenValid,
    revokeRefreshToken,
    storeRefreshToken,
} from './redis.service.js';

export async function issueAuthTokens(user) {
    const accessToken = user.generateJWT();
    const { token: refreshToken, tokenId } = generateRefreshToken(user);
    await storeRefreshToken(user._id.toString(), tokenId);
    return { accessToken, refreshToken };
}

export async function rotateRefreshToken(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    const isValid = await isRefreshTokenValid(decoded._id, decoded.tokenId);

    if (!isValid) {
        throw new Error('Invalid refresh token');
    }

    await revokeRefreshToken(decoded._id, decoded.tokenId);

    const userModel = (await import('../models/user.model.js')).default;
    const user = await userModel.findById(decoded._id);

    if (!user) {
        throw new Error('User not found');
    }

    return issueAuthTokens(user);
}

export async function revokeSession(accessToken, refreshToken) {
    if (accessToken) {
        await blacklistAccessToken(accessToken);
    }

    if (refreshToken) {
        try {
            const decoded = verifyRefreshToken(refreshToken);
            await revokeRefreshToken(decoded._id, decoded.tokenId);
        } catch {
            // ignore invalid refresh token on logout
        }
    }
}
