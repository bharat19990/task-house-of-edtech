import mongoose from 'mongoose';
import logger from '@/lib/logger';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  namespace NodeJS {
    interface Global {
      mongooseCache: MongooseCache;
    }
  }
}

const globalWithMongoose = global as typeof global & {
  mongooseCache: MongooseCache;
};

if (!globalWithMongoose.mongooseCache) {
  globalWithMongoose.mongooseCache = { conn: null, promise: null };
}

const cached = globalWithMongoose.mongooseCache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/collab-editor';

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      autoIndex: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      logger.info({ uri: MONGODB_URI.replace(/\/\/.*@/, '//***@') }, 'MongoDB connected');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    logger.error({ error }, 'MongoDB connection failed');
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;
