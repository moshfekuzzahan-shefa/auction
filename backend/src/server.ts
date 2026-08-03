import 'dotenv/config';
import http from 'http';
import app from './app';
import { setupSockets } from './sockets';
import logger from './utils/logger';
import { seedSuperAdmin } from './utils/seed';

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io
setupSockets(server);

// Start Server
server.listen(PORT, async () => {
  await seedSuperAdmin();
  logger.info(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
  console.error('UNHANDLED REJECTION:', err);
  if (logger) logger.error(`Unhandled Rejection: ${err?.message || err}`);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err: any) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});
