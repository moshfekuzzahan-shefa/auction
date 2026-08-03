import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { AuctionEngine } from '../modules/auction/auction.engine';
import { verifyToken } from '../utils/jwt';
import logger from '../utils/logger';
import { setSocketIo } from './socketStore';

let auctionEngine: AuctionEngine;

export const setupSockets = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    connectTimeout: 10000,
  });

  const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  const subClient = pubClient.duplicate();

  pubClient.on('error', (err) => logger.error('Socket Redis Pub Error', err));
  subClient.on('error', (err) => logger.error('Socket Redis Sub Error', err));

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter connected');
  }).catch(err => {
    logger.error('Failed to connect Socket.IO Redis adapter', err);
  });

  setSocketIo(io);
  auctionEngine = new AuctionEngine(io);

  // Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.token;
    if (!token) return next(new Error('Authentication error: Token missing'));

    const decoded = verifyToken(token as string);
    if (!decoded) return next(new Error('Authentication error: Invalid token'));

    socket.data.user = decoded;
    next();
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected to auction namespace: ${socket.id}`);
    
    // Join team specific room for private alerts
    if (socket.data.user.role === 'TEAM_MANAGER') {
      const teamId = socket.data.user.teamId; // Assuming teamId is encoded in JWT or fetched
      if (teamId) socket.join(`team_${teamId}`);
    }

    // Send current state on connect
    auctionEngine.broadcastState();

    // --- Admin Events ---
    socket.on('PODIUM_PULL_PLAYER', (data) => {
      logger.info(`Received PODIUM_PULL_PLAYER from ${socket.id}, role: ${socket.data.user.role}, data: ${JSON.stringify(data)}`);
      if (socket.data.user.role === 'PODIUM_ADMIN' || socket.data.user.role === 'SUPER_ADMIN') {
        auctionEngine.startAuction(data.playerId, data.mode, data.basePrice).catch(err => {
          logger.error('Error starting auction:', err);
          socket.emit('ERROR', err.message);
        });
      }
    });

    socket.on('OVERRIDE_PAUSE', () => {
      if (socket.data.user.role === 'PODIUM_ADMIN' || socket.data.user.role === 'SUPER_ADMIN') {
        auctionEngine.pause();
      }
    });

    socket.on('OVERRIDE_RESUME', () => {
      if (socket.data.user.role === 'PODIUM_ADMIN' || socket.data.user.role === 'SUPER_ADMIN') {
        auctionEngine.resume();
      }
    });

    socket.on('OVERRIDE_CANCEL', () => {
      if (socket.data.user.role === 'PODIUM_ADMIN' || socket.data.user.role === 'SUPER_ADMIN') {
        auctionEngine.cancel();
      }
    });

    socket.on('OVERRIDE_ROLLBACK', async (data) => {
      if (socket.data.user.role === 'PODIUM_ADMIN' || socket.data.user.role === 'SUPER_ADMIN') {
        try {
          await auctionEngine.rollback(data.ledgerId);
          socket.emit('SUCCESS', 'Rollback complete');
        } catch (err: any) {
          socket.emit('ERROR', err.message);
        }
      }
    });

    socket.on('TOGGLE_BID_MODE', (data) => {
       if (socket.data.user.role === 'PODIUM_ADMIN' || socket.data.user.role === 'SUPER_ADMIN') {
         // Optionally change mode mid-auction or before pulling. Let engine handle it.
         auctionEngine.toggleBidMode(data.mode);
       }
    });

    // --- Team Manager Events ---
    socket.on('PLACE_BID', (data) => {
      if (socket.data.user.role === 'TEAM_MANAGER') {
        // Here we ideally fetch teamId from socket.data.user or DB. We assume it's passed or derived.
        const teamId = socket.data.user.teamId || data.teamId;
        auctionEngine.placeBid(teamId, data.amount);
      }
    });

    socket.on('JOIN_AUCTION_ROOM', () => {
      socket.join('auction_spectators');
      auctionEngine.broadcastState(socket);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });
};
