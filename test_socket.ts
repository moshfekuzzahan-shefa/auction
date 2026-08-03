import { io } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

async function run() {
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!admin) return console.log("No super admin found");
  
  const token = jwt.sign({ id: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: '1h' });
  
  const socket = io('http://localhost:5000', {
    auth: { token },
    transports: ['websocket']
  });

  socket.on('connect', async () => {
    console.log('Connected to socket, getting first unsold player...');
    const player = await prisma.profile.findFirst({ where: { isSold: false } });
    if (!player) {
      console.log("No unsold players");
      process.exit(0);
    }
    
    console.log(`Pulling player ${player.userId} to podium...`);
    socket.emit('PODIUM_PULL_PLAYER', {
      playerId: player.userId,
      mode: 'NORMAL',
      basePrice: player.basePrice || 100
    });
  });

  socket.on('AUCTION_STATE', (state) => {
    console.log('Received AUCTION_STATE:', state.status, state.currentPlayer?.user?.name);
    if (state.status === 'ACTIVE') {
      console.log('SUCCESS!');
      setTimeout(() => process.exit(0), 1000);
    }
  });

  socket.on('ERROR', (err) => {
    console.log('Socket Error:', err);
    process.exit(1);
  });
}

run();
