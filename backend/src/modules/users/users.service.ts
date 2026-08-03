import bcrypt from 'bcryptjs';
import prisma from '../../config/db';

export class UsersService {
  static async createAdmin(email: string, name: string, passwordString: string, role: 'PODIUM_ADMIN' | 'SUPER_ADMIN') {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(passwordString, 10);
    return prisma.user.create({
      data: { email, name, password: hashedPassword, role },
      select: { id: true, name: true, email: true, role: true }
    });
  }

  static async createTeamManager(email: string, name: string, passwordString: string, teamName: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('User with this email already exists');

    const existingTeam = await prisma.team.findUnique({ where: { name: teamName } });
    if (existingTeam) throw new Error('Team name is already taken');

    const hashedPassword = await bcrypt.hash(passwordString, 10);

    // Use transaction to create manager and their team
    const result = await prisma.$transaction(async (tx) => {
      const manager = await tx.user.create({
        data: { email, name, password: hashedPassword, role: 'TEAM_MANAGER' },
        select: { id: true, name: true, email: true, role: true }
      });

      const team = await tx.team.create({
        data: { name: teamName, managerId: manager.id }
      });

      return { manager, team };
    });

    return result;
  }
}
