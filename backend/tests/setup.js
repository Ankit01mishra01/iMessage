import 'dotenv/config';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_with_minimum_32_characters';
process.env.REFRESH_TOKEN_SECRET =
    process.env.REFRESH_TOKEN_SECRET || 'test_refresh_secret_with_minimum_32_characters';
process.env.GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || 'test_key';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

let mongoServer;

if (!globalThis.__SOEN_TEST_MONGO_URI__) {
    mongoServer = await MongoMemoryServer.create();
    globalThis.__SOEN_TEST_MONGO_URI__ = mongoServer.getUri('soen_test');
}

process.env.MONGODB_URI = globalThis.__SOEN_TEST_MONGO_URI__;

export { mongoServer };
