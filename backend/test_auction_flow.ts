import { io } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

function createToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

async function runTest() {
  console.log('--- Starting Auction Flow Test ---');

  if (await prisma.playerCategory.count() === 0) {
    await prisma.playerCategory.create({ data: { name: 'A', basePrice: 100 } });
  }
  if (await prisma.bidRaiseRule.count() === 0) {
    await prisma.bidRaiseRule.create({ data: { minBudgetPercent: 0, maxBudgetPercent: 1, raisePercent: 0.05 } });
  }

  // Find a player to auction
  const player = await prisma.profile.findFirst({ where: { isSold: false }, include: { user: true } });
  if (!player) {
    console.log('No unsold player found. Aborting test.');
    return;
  }

  let team = await prisma.team.findFirst();
  if (!team) {
    team = await prisma.team.create({ data: { name: 'Test Team', budget: 100000, logoUrl: '' } });
  }

  const adminToken = createToken({ id: 'admin1', role: 'SUPER_ADMIN', email: 'admin@test.com' });
  const managerToken = createToken({ id: 'mgr1', role: 'TEAM_MANAGER', teamId: team.id, email: 'mgr@test.com' });
  const publicToken = createToken({ id: 'pub1', role: 'PLAYER', email: 'pub@test.com' }); 

  console.log('Connecting sockets...');

  const adminSocket = io('http://localhost:5000', { auth: { token: adminToken } });
  const mgrSocket = io('http://localhost:5000', { auth: { token: managerToken } });
  const pubSocket = io('http://localhost:5000', { auth: { token: publicToken } });

  pubSocket.on('connect', () => {
    console.log('Public socket connected. Joining room...');
    pubSocket.emit('JOIN_AUCTION_ROOM');
  });

  pubSocket.on('AUCTION_STATE', (state: any) => {
    console.log(`[Public] Received AUCTION_STATE: Status=${state.status}, Player=${state.currentPlayer?.user?.name}, Bid=${state.currentBid}, Timer=${state.timer}`);
  });

  pubSocket.on('BID_PLACED', (data: any) => {
    console.log(`[Public] Received BID_PLACED: Team=${data.teamId}, Amount=${data.amount}`);
  });

  pubSocket.on('PLAYER_SOLD', (data: any) => {
    console.log(`[Public] Received PLAYER_SOLD: Winner=${data.winnerId}, FinalAmount=${data.finalAmount}`);
  });

  adminSocket.on('connect', () => {
    console.log(`Admin socket connected. Pulling player ${player.user.name} (${player.userId}) to podium in 2s...`);
    setTimeout(() => {
      adminSocket.emit('PODIUM_PULL_PLAYER', { playerId: player.userId, mode: 'NORMAL', basePrice: 100 });
    }, 2000);
  });

  mgrSocket.on('connect', () => {
    console.log('Manager socket connected. Will place bid in 4s...');
    setTimeout(() => {
      mgrSocket.emit('PLACE_BID', { teamId: team!.id, amount: 600 });
    }, 4000);
  });

  mgrSocket.on('ERROR', (msg: any) => {
    console.log(`[Manager] Received ERROR: ${msg}`);
  });
  adminSocket.on('ERROR', (msg: any) => {
    console.log(`[Admin] Received ERROR: ${msg}`);
  });

  setTimeout(async () => {
    console.log('--- Test Complete, disconnecting... ---');
    adminSocket.disconnect();
    mgrSocket.disconnect();
    pubSocket.disconnect();
    await prisma.$disconnect();
    process.exit(0);
  }, 8000);
}

runTest().catch(console.error);
