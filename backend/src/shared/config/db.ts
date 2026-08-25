import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export async function connectMongo(uri: string = env.MONGODB_URI): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });
  logger.info({ uri: uri.replace(/\/\/[^@]*@/, '//***@') }, 'mongo connected');
  return mongoose;
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
  logger.info('mongo disconnected');
}
