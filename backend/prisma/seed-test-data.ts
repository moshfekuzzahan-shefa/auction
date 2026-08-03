import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test data...');

  // Hash a default password
  const passwordHash = await bcrypt.hash('password123', 10);

  // Clean up existing test data (optional but good for repeatable runs)
  // We won't delete everything to avoid destroying admin users, just these specific ones.

  const teamsData = [
    { name: 'Red Dragons', budget: 10000, managerEmail: 'reddragons@test.com' },
    { name: 'Blue Falcons', budget: 10000, managerEmail: 'bluefalcons@test.com' },
    { name: 'Green Griffins', budget: 10000, managerEmail: 'greengriffins@test.com' },
  ];

  for (const team of teamsData) {
    const managerUser = await prisma.user.upsert({
      where: { email: team.managerEmail },
      update: {},
      create: {
        name: `${team.name} Manager`,
        email: team.managerEmail,
        password: passwordHash,
        role: 'TEAM_MANAGER',
      },
    });

    await prisma.team.upsert({
      where: { name: team.name },
      update: { managerId: managerUser.id },
      create: {
        name: team.name,
        budget: team.budget,
        managerId: managerUser.id,
      },
    });
  }

  const playersData = [
    { name: 'Alice Smith', email: 'alice@test.com', primaryPos: 'Forward' },
    { name: 'Bob Jones', email: 'bob@test.com', primaryPos: 'Midfielder' },
    { name: 'Charlie Brown', email: 'charlie@test.com', primaryPos: 'Defender' },
    { name: 'David Lee', email: 'david@test.com', primaryPos: 'Goalkeeper' },
    { name: 'Eva Davis', email: 'eva@test.com', primaryPos: 'Forward' },
    { name: 'Frank Miller', email: 'frank@test.com', primaryPos: 'Midfielder' },
    { name: 'Grace Wilson', email: 'grace@test.com', primaryPos: 'Defender' },
    { name: 'Henry Moore', email: 'henry@test.com', primaryPos: 'Midfielder' },
  ];

  for (const player of playersData) {
    const user = await prisma.user.upsert({
      where: { email: player.email },
      update: {},
      create: {
        name: player.name,
        email: player.email,
        password: passwordHash,
        role: 'PLAYER',
      },
    });

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        jerseyName: player.name.split(' ')[0],
        primaryPos: player.primaryPos,
        basePrice: 100,
      },
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
