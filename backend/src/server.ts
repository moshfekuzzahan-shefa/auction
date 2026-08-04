import 'dotenv/config';
import http from 'http';
import app from './app';
import { setupSockets } from './sockets';
import logger from './utils/logger';
import { seedSuperAdmin } from './utils/seed';

const PORT = parseInt(process.env.PORT || '10000', 10);

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io
setupSockets(server);

// Start Server - Bind explicitly to 0.0.0.0 for Render's reverse proxy routing
server.listen(PORT, '0.0.0.0', async () => {

  try {
    await seedSuperAdmin();
  } catch (err) {
    if (logger) logger.error('Initial database seeding warning:', err);
  }
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections gracefully without crashing Node process
process.on('unhandledRejection', (err: any) => {
  console.error('UNHANDLED REJECTION:', err);
  if (logger) logger.error(`Unhandled Rejection: ${err?.message || err}`);
});

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (err: any) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  if (logger) logger.error(`Uncaught Exception: ${err?.message || err}`);
});
