import mongoose from 'mongoose';
import { assertEnv, env } from './config/env.js';
import { connectDB } from './config/db.js';
import { verifyEmailSetup } from './services/email/index.js';

assertEnv();
const { createApp } = await import('./app.js');

await connectDB();
verifyEmailSetup(); // logs only; never blocks startup
const app = createApp();
const server = app.listen(env.port, () => {
  console.log(`[server] Al Noor Books API listening on http://localhost:${env.port} (${env.isProd ? 'production' : 'development'})`);
});

async function shutdown(signal) {
  console.log(`[server] ${signal} received, shutting down...`);
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
