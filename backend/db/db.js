import { setServers } from 'dns';
setServers(['8.8.8.8', '8.8.4.4']); // ← sabse pehle


// Sirf local development me override karo
if (process.env.NODE_ENV !== 'production') {
    setServers(['8.8.8.8', '8.8.4.4']);
}

import mongoose from 'mongoose';

let isConnected = false;

async function connect() {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        isConnected = false;
    }

    mongoose.set('strictQuery', true);
    console.log(JSON.stringify(process.env.MONGODB_URI));

    await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 30000,
        family: 4
    });

    isConnected = true;
    console.log('Connected to MongoDB');
    return mongoose.connection;
}

export async function pingMongo() {
    if (!isConnected) {
        return false;
    }
    return mongoose.connection.readyState === 1;
}

export default connect;