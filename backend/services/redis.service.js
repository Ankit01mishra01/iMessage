import Redis from 'ioredis';

const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        return Math.min(times * 200, 2000);
    },
});

redisClient.on('connect', () => {
    console.log('Redis connected');
});

redisClient.on('error', (error) => {
    console.error('Redis error:', error.message);
});

export const REFRESH_TOKEN_PREFIX = 'refresh:';
export const BLACKLIST_PREFIX = 'blacklist:';

export async function storeRefreshToken(userId, tokenId) {
    await redisClient.set(`${REFRESH_TOKEN_PREFIX}${userId}:${tokenId}`, '1', 'EX', 60 * 60 * 24 * 7);
}

export async function revokeRefreshToken(userId, tokenId) {
    await redisClient.del(`${REFRESH_TOKEN_PREFIX}${userId}:${tokenId}`);
}

export async function isRefreshTokenValid(userId, tokenId) {
    const value = await redisClient.get(`${REFRESH_TOKEN_PREFIX}${userId}:${tokenId}`);
    return Boolean(value);
}

export async function blacklistAccessToken(token, expiresInSeconds = 60 * 60 * 24) {
    await redisClient.set(`${BLACKLIST_PREFIX}${token}`, 'logout', 'EX', expiresInSeconds);
}

export async function isAccessTokenBlacklisted(token) {
    const value = await redisClient.get(`${BLACKLIST_PREFIX}${token}`);
    return Boolean(value);
}

export async function pingRedis() {
    const result = await redisClient.ping();
    return result === 'PONG';
}

export default redisClient;
