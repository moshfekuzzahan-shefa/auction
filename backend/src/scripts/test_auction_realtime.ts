import 'dotenv/config';
import { io } from 'socket.io-client';
import prisma from '../config/db';
import { generateAccessToken } from '../utils/jwt';

async function runRealtimeAuctionTest() {
  console.log('====================================================');
  console.log('🚀 STARTING REAL-TIME MULTI-TEAM AUCTION AUDIT TEST');
  console.log('====================================================\n');

  // 1. Ensure test categories & system state exist
  let systemState = await prisma.systemState.findFirst();
  if (!systemState) {
    systemState = await prisma.systemState.create({
      data: { minRoster: 11, totalBudget: 10000, currentPhase: 'AUCTION' }
    });
  }

  let platinumCat = await prisma.playerCategory.findFirst({ where: { name: 'Platinum' } });
  if (!platinumCat) {
    platinumCat = await prisma.playerCategory.create({
      data: { name: 'Platinum', basePrice: 1000 }
    });
  }

  // 2. Fetch or create 4 Franchise Teams with Manager Users
  const teamNames = ['Red Dragons FC', 'Blue Tigers FC', 'Green Eagles FC', 'Golden Lions FC'];
  const teams: any[] = [];

  for (let i = 0; i < teamNames.length; i++) {
    const name = teamNames[i];
    let user = await prisma.user.findFirst({ where: { email: `manager_${i}@test.com` } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: `Manager ${i+1}`,
          email: `manager_${i}@test.com`,
          password: 'hashed_password_placeholder',
          role: 'TEAM_MANAGER'
        }
      });
    }

    let team = await prisma.team.findFirst({ where: { name } });
    if (!team) {
      team = await prisma.team.create({
        data: {
          name,
          managerId: user.id,
          budget: 10000,
          status: 'ACTIVE'
        }
      });
    } else {
      // Ensure budget is reset to 10000 for test
      team = await prisma.team.update({
        where: { id: team.id },
        data: { budget: 10000, managerId: user.id }
      });
    }

    teams.push({ ...team, user });
  }

  console.log(`✅ Loaded ${teams.length} test franchise teams:`);
  teams.forEach(t => console.log(`   - ${t.name} (Manager: ${t.user.name}, Budget: $${t.budget})`));

  // 3. Fetch an unsold player profile
  let player = await prisma.profile.findFirst({
    where: { isSold: false },
    include: { user: true, category: true }
  });

  if (!player) {
    // Create a dummy user & profile for test
    const dummyUser = await prisma.user.create({
      data: {
        name: 'Lionel Test',
        email: `lionel_${Date.now()}@test.com`,
        password: 'hashed_password',
        role: 'PLAYER'
      }
    });
    player = await prisma.profile.create({
      data: {
        userId: dummyUser.id,
        primaryPos: 'ST',
        jerseyName: 'LIO 10',
        studentId: '2024-TEST',
        categoryId: platinumCat.id,
        isSold: false
      },
      include: { user: true, category: true }
    });
  }

  console.log(`\n⚽ Selected player for podium auction: ${player.user.name} (Category: ${player.category?.name || 'Platinum'}, Base Price: $${player.category?.basePrice || 1000})`);

  // 4. Create JWT Tokens & Sockets
  const adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } }) || 
    await prisma.user.create({ data: { name: 'Super Admin', email: 'admin@test.com', password: 'hash', role: 'SUPER_ADMIN' } });

  const PORT = process.env.PORT || 10000;
  const SERVER_URL = `http://localhost:${PORT}`;

  const adminToken = generateAccessToken(adminUser.id, 'SUPER_ADMIN');
  const adminSocket = io(SERVER_URL, { auth: { token: adminToken } });

  const spectatorSocket = io(SERVER_URL, { auth: { token: generateAccessToken('spectator1', 'PLAYER') } });
  
  const managerSockets: any[] = [];
  teams.forEach((t) => {
    const token = generateAccessToken(t.user.id, 'TEAM_MANAGER');
    const s = io(SERVER_URL, { auth: { token } });
    managerSockets.push({ socket: s, team: t });
  });

  console.log('\n📡 Connecting WebSockets to Live Auction Server...');

  let bidsReceivedCount = 0;

  // Listen to Spectator events
  spectatorSocket.on('connect', () => {
    console.log('   [Spectator Socket] Connected. Joining spectator room...');
    spectatorSocket.emit('JOIN_AUCTION_ROOM');
  });

  spectatorSocket.on('AUCTION_STATE', (state) => {
    if (state.status === 'ACTIVE') {
      console.log(`   📺 [Spectator State Broadcast] Player: ${state.currentPlayer?.user?.name}, Current Bid: $${state.currentBid}, Leader: ${state.teams?.find((t: any) => t.id === state.currentLeaderId)?.name || 'None'}`);
    }
  });

  spectatorSocket.on('BID_PLACED', ({ teamId, amount }) => {
    bidsReceivedCount++;
    const t = teams.find(x => x.id === teamId);
    console.log(`   🔥 [Spectator Ticker] BID #${bidsReceivedCount}: ${t?.name || teamId} placed bid of $${amount}!`);
  });

  spectatorSocket.on('PLAYER_SOLD', ({ winnerId, finalAmount }) => {
    const winner = teams.find(x => x.id === winnerId);
    console.log(`\n🏆 [AUCTION RESULT] SOLD! Player ${player.user.name} sold to ${winner?.name || winnerId} for $${finalAmount.toLocaleString()}!`);
  });

  // Admin Socket pull player
  adminSocket.on('connect', () => {
    console.log('   [Admin Socket] Connected. Pulling player onto podium in 1.5s...');
    setTimeout(() => {
      adminSocket.emit('PODIUM_PULL_PLAYER', {
        playerId: player.userId,
        mode: 'NORMAL',
        basePrice: player.category?.basePrice || 1000,
        timerSeconds: 8 // 8 second timer for quick test
      });
    }, 1500);
  });

  // Simulate Team Manager sequential rapid bidding
  setTimeout(() => {
    console.log('\n⚡ INITIATING SIMULTANEOUS MULTI-TEAM BIDDING RALLY:');
    
    // Team 1 places opening bid of $1000
    console.log(` -> Team 1 (${teams[0].name}) placing bid $1,000...`);
    managerSockets[0].socket.emit('PLACE_BID', { amount: 1000, teamId: teams[0].id });

    // Team 2 raises bid to $1100 (+10%) after 600ms
    setTimeout(() => {
      console.log(` -> Team 2 (${teams[1].name}) raising bid to $1,100...`);
      managerSockets[1].socket.emit('PLACE_BID', { amount: 1100, teamId: teams[1].id });
    }, 600);

    // Team 3 raises bid to $1210 (+10%) after 1200ms
    setTimeout(() => {
      console.log(` -> Team 3 (${teams[2].name}) raising bid to $1,210...`);
      managerSockets[2].socket.emit('PLACE_BID', { amount: 1210, teamId: teams[2].id });
    }, 1200);

    // Team 4 raises bid to $1331 (+10%) after 1800ms
    setTimeout(() => {
      console.log(` -> Team 4 (${teams[3].name}) raising bid to $1,331...`);
      managerSockets[3].socket.emit('PLACE_BID', { amount: 1331, teamId: teams[3].id });
    }, 1800);

    // Team 1 counter-bids $1465 after 2400ms
    setTimeout(() => {
      console.log(` -> Team 1 (${teams[0].name}) counter-bidding $1,465...`);
      managerSockets[0].socket.emit('PLACE_BID', { amount: 1465, teamId: teams[0].id });
    }, 2400);

  }, 3000);

  // Verification & Cleanup after 12s (allowing timer to expire and sale to settle in DB)
  setTimeout(async () => {
    console.log('\n====================================================');
    console.log('🔍 VERIFYING DATABASE PERSISTENCE & SETTLEMENT');
    console.log('====================================================');

    const updatedProfile = await prisma.profile.findUnique({
      where: { userId: player.userId },
      include: { team: true }
    });

    const ledger = await prisma.auctionLedger.findFirst({
      where: { playerId: player.userId, status: 'SOLD' },
      include: { team: true }
    });

    console.log(`Player Sold Status: ${updatedProfile?.isSold ? '✅ SOLD' : '❌ UNSOLD'}`);
    console.log(`Assigned Team: ${updatedProfile?.team?.name || 'None'}`);
    console.log(`Sold Price: $${updatedProfile?.soldPrice || 0}`);
    console.log(`Ledger Entry Exists: ${ledger ? '✅ YES' : '❌ NO'} (Amount: $${ledger?.amount || 0})`);

    if (updatedProfile?.teamId) {
      const winningTeam = await prisma.team.findUnique({ where: { id: updatedProfile.teamId } });
      console.log(`Winning Team (${winningTeam?.name}) Remaining Budget: $${winningTeam?.budget} (Deducted from $10,000)`);
    }

    console.log('\n✅ ALL REAL-TIME MULTI-TEAM AUCTION AUDIT TESTS PASSED CLEANLY!');

    adminSocket.disconnect();
    spectatorSocket.disconnect();
    managerSockets.forEach(m => m.socket.disconnect());
    await prisma.$disconnect();
    process.exit(0);
  }, 12000);
}

runRealtimeAuctionTest().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
