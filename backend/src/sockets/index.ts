import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { AuctionEngine } from '../modules/auction/auction.engine';
import { verifyToken } from '../utils/jwt';
import logger from '../utils/logger';
import { setSocketIo } from './socketStore';
import prisma from '../config/db';

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
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.token;
      if (!token) return next(new Error('Authentication error: Token missing'));

      const decoded = verifyToken(token as string);
      if (!decoded) return next(new Error('Authentication error: Invalid token'));

      socket.data.user = decoded;

      // Dynamically resolve teamId if not present in JWT payload
      if (decoded.id) {
        const team = await prisma.team.findFirst({
          where: { managerId: decoded.id }
        });
        if (team) {
          socket.data.user.teamId = team.id;
        }
      }

      next();
    } catch (err: any) {
      logger.error('Socket auth middleware error:', err);
      next(new Error('Authentication error: ' + (err.message || 'Unauthorized')));
    }
  });

  io.on('connection', async (socket: Socket) => {
    logger.info(`Client connected to auction namespace: ${socket.id}, user: ${socket.data.user?.id}, role: ${socket.data.user?.role}`);
    
    // Join team-specific room so error toasts and private alerts are delivered reliably
    if (socket.data.user?.teamId) {
      socket.join(`team_${socket.data.user.teamId}`);
      logger.info(`Socket ${socket.id} joined room team_${socket.data.user.teamId}`);
    }

    // Join general spectators room
    socket.join('auction_spectators');

    // Send current state on connect
    auctionEngine.broadcastState(socket);

    // --- Admin Events ---
    socket.on('PODIUM_PULL_PLAYER', (data) => {
      logger.info(`Received PODIUM_PULL_PLAYER from ${socket.id}, role: ${socket.data.user?.role}, data: ${JSON.stringify(data)}`);
      if (socket.data.user?.role === 'PODIUM_ADMIN' || socket.data.user?.role === 'SUPER_ADMIN') {
        auctionEngine.startAuction(data.playerId, data.mode, data.basePrice, data.timerSeconds).catch(err => {
          logger.error('Error starting auction:', err);
          socket.emit('ERROR', err.message);
        });
      }
    });

    socket.on('EXTEND_TIMER', (data) => {
      if (socket.data.user?.role === 'PODIUM_ADMIN' || socket.data.user?.role === 'SUPER_ADMIN') {
        auctionEngine.extendTimer(Number(data?.seconds) || 10);
      }
    });

    socket.on('OVERRIDE_PAUSE', () => {
      if (socket.data.user?.role === 'PODIUM_ADMIN' || socket.data.user?.role === 'SUPER_ADMIN') {
        auctionEngine.pause();
      }
    });

    socket.on('OVERRIDE_RESUME', () => {
      if (socket.data.user?.role === 'PODIUM_ADMIN' || socket.data.user?.role === 'SUPER_ADMIN') {
        auctionEngine.resume();
      }
    });

    socket.on('OVERRIDE_CANCEL', () => {
      if (socket.data.user?.role === 'PODIUM_ADMIN' || socket.data.user?.role === 'SUPER_ADMIN') {
        auctionEngine.cancel();
      }
    });

    socket.on('OVERRIDE_ROLLBACK', async (data) => {
      if (socket.data.user?.role === 'PODIUM_ADMIN' || socket.data.user?.role === 'SUPER_ADMIN') {
        try {
          await auctionEngine.rollback(data.ledgerId);
          socket.emit('SUCCESS', 'Rollback complete');
        } catch (err: any) {
          socket.emit('ERROR', err.message);
        }
      }
    });

    socket.on('TOGGLE_BID_MODE', (data) => {
       if (socket.data.user?.role === 'PODIUM_ADMIN' || socket.data.user?.role === 'SUPER_ADMIN') {
         auctionEngine.toggleBidMode(data.mode);
       }
    });

    // --- Team Manager Bidding Event ---
    socket.on('PLACE_BID', async (data) => {
      try {
        let teamId = socket.data.user?.teamId || data?.teamId;

        // Dynamic fallback lookup if teamId was not resolved on handshake
        if (!teamId && socket.data.user?.id) {
          const userTeam = await prisma.team.findFirst({
            where: { managerId: socket.data.user.id }
          });
          if (userTeam) {
            teamId = userTeam.id;
            socket.data.user.teamId = teamId;
            socket.join(`team_${teamId}`);
          }
        }

        if (!teamId) {
          socket.emit('ERROR', 'No franchise team is assigned to your manager account!');
          return;
        }

        const amount = Number(data?.amount);
        if (!amount || isNaN(amount) || amount <= 0) {
          socket.emit('ERROR', 'Invalid bid amount specified');
          return;
        }

        auctionEngine.placeBid(teamId, amount, socket);
      } catch (err: any) {
        socket.emit('ERROR', err.message || 'Failed to place bid');
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
