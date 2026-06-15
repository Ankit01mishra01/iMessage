const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_PASSWORD',
    'GOOGLE_AI_KEY',
];

const optionalEnvVars = [
    'PORT',
    'MONGODB_DBNAME',
    'NODE_ENV',
    'CORS_ORIGIN',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
];

export function validateEnv({ strict = true } = {}) {
    const missing = requiredEnvVars.filter((key) => !process.env[key]?.trim());

    if (strict && missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}. See REQUIRED_ENVIRONMENT_VARIABLES.md`
        );
    }

    return { missing, optional: optionalEnvVars };
}

export function getCorsOrigin() {
    const origin = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174';
    return origin
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
}
