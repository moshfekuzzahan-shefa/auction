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
        { minBudgetPercent: 0.0, maxBudgetPercent: 0.03, raisePercent: 0.0015 },
        { minBudgetPercent: 0.03, maxBudgetPercent: 1.0, raisePercent: 0.005 },
      ];
      await prisma.bidRaiseRule.createMany({
        data: defaultRules
      });
      logger.info('Bid Raise Rules seeded successfully');
    }
  } catch (error) {
    logger.error('Error seeding database', error);
  }
};
