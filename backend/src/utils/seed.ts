import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import logger from './logger';

export const seedSuperAdmin = async () => {
  try {
    const superAdminExists = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (!superAdminExists) {
      const email = process.env.SUPER_ADMIN_EMAIL || 'admin@football.com';
      const password = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.create({
        data: {
          name: 'Super Admin',
          email,
          password: hashedPassword,
          role: 'SUPER_ADMIN'
        }
      });
      logger.info('Super Admin seeded successfully');
    }

    const systemStateExists = await prisma.systemState.findFirst();
    if (!systemStateExists) {
      await prisma.systemState.create({
        data: {
          currentPhase: 'SETUP',
          totalBudget: 10000,
          minRoster: 11
        }
      });
      logger.info('System State seeded successfully');
    }

    // Seed Default Academic Sessions if empty
    const sessionsCount = await prisma.academicSession.count();
    if (sessionsCount === 0) {
      const defaultSessions = ['2020-2021', '2021-2022', '2022-2023', '2023-2024', '2024-2025', '2025-2026'];
      await prisma.academicSession.createMany({
        data: defaultSessions.map(name => ({ name })),
        skipDuplicates: true
      });
      logger.info('Academic Sessions seeded successfully');
    }

    // Seed Default Player Positions if empty
    const positionsCount = await prisma.playerPosition.count();
    if (positionsCount === 0) {
      const defaultPositions = [
        { code: 'GK', name: 'Goalkeeper' },
        { code: 'CB', name: 'Center Back' },
        { code: 'LB', name: 'Left Back' },
        { code: 'RB', name: 'Right Back' },
        { code: 'CM', name: 'Central Midfielder' },
        { code: 'CAM', name: 'Attacking Midfielder' },
        { code: 'LW', name: 'Left Wing' },
        { code: 'RW', name: 'Right Wing' },
        { code: 'ST', name: 'Striker' },
      ];
      await prisma.playerPosition.createMany({
        data: defaultPositions,
        skipDuplicates: true
      });
      logger.info('Player Positions seeded successfully');
    }

    // Seed Default Player Categories if empty
    const categoriesCount = await prisma.playerCategory.count();
    if (categoriesCount === 0) {
      const defaultCategories = [
        { name: 'Platinum', basePrice: 1000 },
        { name: 'Gold', basePrice: 750 },
        { name: 'Silver', basePrice: 500 },
        { name: 'Bronze', basePrice: 250 },
      ];
      await prisma.playerCategory.createMany({
        data: defaultCategories,
        skipDuplicates: true
      });
      logger.info('Player Categories seeded successfully');
    }

    // Seed Default Bid Rules if empty
    const rulesCount = await prisma.bidRaiseRule.count();
    if (rulesCount === 0) {
      const defaultRules = [
        { minPrice: 0, maxPrice: 1000, incrementType: 'PERCENT' as const, incrementValue: 10 },
        { minPrice: 1001, maxPrice: 5000, incrementType: 'PERCENT' as const, incrementValue: 5 },
        { minPrice: 5001, maxPrice: 100000, incrementType: 'FIXED' as const, incrementValue: 500 },
      ];
      await prisma.bidRaiseRule.createMany({
        data: defaultRules
      });
      logger.info('Bid Raise Rules seeded successfully');
    }

    // Seed Podium Admin if not exists
    const podiumAdminExists = await prisma.user.findFirst({
      where: { role: 'PODIUM_ADMIN' }
    });

    if (!podiumAdminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          name: 'The Auctioneer',
          email: 'podium@football.com',
          password: hashedPassword,
          role: 'PODIUM_ADMIN'
        }
      });
      logger.info('Podium Admin seeded successfully');
    }

    // Seed Default Franchises (Teams) & Team Managers
    const teamsCount = await prisma.team.count();
    if (teamsCount === 0) {
      const defaultTeams = [
        { name: 'Strikers FC', managerName: 'Manager One', email: 'manager1@football.com' },
        { name: 'Thunderbolts', managerName: 'Manager Two', email: 'manager2@football.com' },
        { name: 'Titans XI', managerName: 'Manager Three', email: 'manager3@football.com' },
        { name: 'Galacticos', managerName: 'Manager Four', email: 'manager4@football.com' },
      ];

      const hashedPassword = await bcrypt.hash('admin123', 10);

      for (const t of defaultTeams) {
        const manager = await prisma.user.create({
          data: {
            name: t.managerName,
            email: t.email,
            password: hashedPassword,
            role: 'TEAM_MANAGER'
          }
        });

        await prisma.team.create({
          data: {
            name: t.name,
            budget: 10000,
            managerId: manager.id
          }
        });
      }
      logger.info('Sample Teams & Team Managers seeded successfully');
    }

    // Seed Sample Unsold Players for Auction Pool
    const playersCount = await prisma.profile.count();
    if (playersCount === 0) {
      const categories = await prisma.playerCategory.findMany();
      const catMap = new Map(categories.map(c => [c.name, c.id]));

      const samplePlayers = [
        { name: 'Lionel Messi', email: 'messi@university.edu', studentId: '2021-1-01', session: '2021-2022', jerseyName: 'MESSI', primaryPos: 'ST', secondaryPos: ['RW', 'CAM'], catName: 'Platinum' },
        { name: 'Cristiano Ronaldo', email: 'ronaldo@university.edu', studentId: '2021-1-02', session: '2021-2022', jerseyName: 'RONALDO', primaryPos: 'ST', secondaryPos: ['LW'], catName: 'Platinum' },
        { name: 'Kylian Mbappe', email: 'mbappe@university.edu', studentId: '2022-1-03', session: '2022-2023', jerseyName: 'MBAPPE', primaryPos: 'LW', secondaryPos: ['ST'], catName: 'Platinum' },
        { name: 'Erling Haaland', email: 'haaland@university.edu', studentId: '2022-1-04', session: '2022-2023', jerseyName: 'HAALAND', primaryPos: 'ST', secondaryPos: [], catName: 'Platinum' },
        { name: 'Luka Modric', email: 'modric@university.edu', studentId: '2020-1-05', session: '2020-2021', jerseyName: 'MODRIC', primaryPos: 'CM', secondaryPos: ['CAM'], catName: 'Gold' },
        { name: 'Kevin De Bruyne', email: 'debruyne@university.edu', studentId: '2020-1-06', session: '2020-2021', jerseyName: 'DE BRUYNE', primaryPos: 'CAM', secondaryPos: ['CM'], catName: 'Gold' },
        { name: 'Jude Bellingham', email: 'bellingham@university.edu', studentId: '2023-1-07', session: '2023-2024', jerseyName: 'BELLINGHAM', primaryPos: 'CAM', secondaryPos: ['CM'], catName: 'Gold' },
        { name: 'Lamine Yamal', email: 'yamal@university.edu', studentId: '2024-1-08', session: '2024-2025', jerseyName: 'YAMAL', primaryPos: 'RW', secondaryPos: ['LW'], catName: 'Gold' },
        { name: 'Virgil van Dijk', email: 'vandijk@university.edu', studentId: '2021-1-09', session: '2021-2022', jerseyName: 'VAN DIJK', primaryPos: 'CB', secondaryPos: [], catName: 'Silver' },
        { name: 'Thibaut Courtois', email: 'courtois@university.edu', studentId: '2021-1-10', session: '2021-2022', jerseyName: 'COURTOIS', primaryPos: 'GK', secondaryPos: [], catName: 'Silver' },
        { name: 'Pedri Gonzalez', email: 'pedri@university.edu', studentId: '2023-1-11', session: '2023-2024', jerseyName: 'PEDRI', primaryPos: 'CM', secondaryPos: ['CAM'], catName: 'Silver' },
        { name: 'Manuel Neuer', email: 'neuer@university.edu', studentId: '2020-1-12', session: '2020-2021', jerseyName: 'NEUER', primaryPos: 'GK', secondaryPos: [], catName: 'Silver' },
      ];

      const defaultPassword = await bcrypt.hash('player123', 10);

      for (const p of samplePlayers) {
        const catId = catMap.get(p.catName) || categories[0]?.id;
        const catObj = categories.find(c => c.id === catId);

        const user = await prisma.user.create({
          data: {
            name: p.name,
            email: p.email,
            password: defaultPassword,
            role: 'PLAYER'
          }
        });

        await prisma.profile.create({
          data: {
            userId: user.id,
            studentId: p.studentId,
            session: p.session,
            jerseyName: p.jerseyName,
            primaryPos: p.primaryPos,
            secondaryPos: p.secondaryPos,
            categoryId: catId,
            basePrice: catObj ? catObj.basePrice : 500,
            isSold: false
          }
        });
      }
      logger.info('Sample Unsold Players seeded successfully');
    }
  } catch (error) {
    logger.error('Error seeding database', error);
  }
};
