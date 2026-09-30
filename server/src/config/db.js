import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  const uri = env.mongodbUri;
console.log('[db] type:', typeof uri, '| length:', uri?.length);
console.log('[db] starts with:', JSON.stringify(uri?.slice(0, 12)));
  await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 10000 });
  console.log('[db] MongoDB connected');
}
