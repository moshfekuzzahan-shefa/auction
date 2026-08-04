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

    // Helper to send errors to client
    const sendError = (msg: string) => {
      socket.emit('ERROR', msg);
      socket.emit('error', msg);
    };

    // Helper to send success to client
    const sendSuccess = (msg: string) => {
      socket.emit('SUCCESS', msg);
      socket.emit('success', msg);
    };

    // --- Admin Event Handlers ---
    const handlePodiumPull = async (data: any) => {
      logger.info(`Received PODIUM_PULL_PLAYER from ${socket.id}, role: ${socket.data.user?.role}, data: ${JSON.stringify(data)}`);
      const role = socket.data.user?.role;
      if (role === 'PODIUM_ADMIN' || role === 'SUPER_ADMIN') {
        const system = await prisma.systemState.findFirst();
        if (system && system.currentPhase !== 'AUCTION') {
          sendError(`Auction phase is not active! Current phase is '${system.currentPhase}'. Please change phase to AUCTION in System Config.`);
          return;
        }
        auctionEngine.startAuction(data.playerId, data.mode, data.basePrice, data.timerSeconds).catch(err => {
          logger.error('Error starting auction:', err);
          sendError(err.message || 'Failed to start auction');
        });
      } else {
        sendError('Unauthorized: Only Podium Admins or Super Admins can pull players onto the stage.');
      }
    };

    const handleExtendTimer = (data: any) => {
      const role = socket.data.user?.role;
      if (role === 'PODIUM_ADMIN' || role === 'SUPER_ADMIN') {
        auctionEngine.extendTimer(Number(data?.seconds) || 10);
      }
    };

    const handlePause = () => {
      const role = socket.data.user?.role;
      if (role === 'PODIUM_ADMIN' || role === 'SUPER_ADMIN') {
        auctionEngine.pause();
      }
    };

    const handleResume = () => {
      const role = socket.data.user?.role;
      if (role === 'PODIUM_ADMIN' || role === 'SUPER_ADMIN') {
        auctionEngine.resume();
      }
    };

    const handleCancel = () => {
      const role = socket.data.user?.role;
      if (role === 'PODIUM_ADMIN' || role === 'SUPER_ADMIN') {
        auctionEngine.cancel();
      }
    };

    const handleRollback = async (data: any) => {
      const role = socket.data.user?.role;
      if (role === 'PODIUM_ADMIN' || role === 'SUPER_ADMIN') {
        try {
          await auctionEngine.rollback(data.ledgerId);
          sendSuccess('Rollback complete');
        } catch (err: any) {
          sendError(err.message || 'Rollback failed');
        }
      }
    };

    // --- Team Manager Bidding Event Handler ---
    const handlePlaceBid = async (data: any) => {
      try {
        // System Phase Check
        const system = await prisma.systemState.findFirst();
        if (system && system.currentPhase !== 'AUCTION') {
          sendError(`Live bidding is disabled! Current system phase is '${system.currentPhase}'.`);
          return;
        }

        // Authorization Role Check
        const role = socket.data.user?.role;
        if (role !== 'TEAM_MANAGER' && role !== 'SUPER_ADMIN' && role !== 'PODIUM_ADMIN') {
          sendError('Unauthorized! Only Team Managers can place bids in the auction.');
          return;
        }

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
          sendError('No franchise team is assigned to your manager account!');
          return;
        }

        const amount = Number(data?.amount);
        if (!amount || isNaN(amount) || amount <= 0) {
          sendError('Invalid bid amount specified');
          return;
        }

        auctionEngine.placeBid(teamId, amount, socket);
      } catch (err: any) {
        sendError(err.message || 'Failed to place bid');
      }
    };

    const handleJoinAuction = () => {
      socket.join('auction_spectators');
      auctionEngine.broadcastState(socket);
    };

    // Event Registration with Dual Event Names (UPPERCASE & snake_case)
    socket.on('PODIUM_PULL_PLAYER', handlePodiumPull);
    socket.on('podium_pull_player', handlePodiumPull);

    socket.on('EXTEND_TIMER', handleExtendTimer);
    socket.on('extend_timer', handleExtendTimer);

    socket.on('OVERRIDE_PAUSE', handlePause);
    socket.on('pause_auction', handlePause);

    socket.on('OVERRIDE_RESUME', handleResume);
    socket.on('resume_auction', handleResume);

    socket.on('OVERRIDE_CANCEL', handleCancel);
    socket.on('cancel_auction', handleCancel);

    socket.on('OVERRIDE_ROLLBACK', handleRollback);
    socket.on('rollback_auction', handleRollback);

    socket.on('PLACE_BID', handlePlaceBid);
    socket.on('place_bid', handlePlaceBid);

    socket.on('JOIN_AUCTION_ROOM', handleJoinAuction);
    socket.on('join_auction_room', handleJoinAuction);
    socket.on('join_auction', handleJoinAuction);

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });
};
