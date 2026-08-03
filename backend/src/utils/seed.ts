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
  } catch (error) {
    logger.error('Error seeding database', error);
  }
};
