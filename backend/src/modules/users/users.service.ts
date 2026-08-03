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

  static async updateRole(userId: string, targetRole: 'PODIUM_ADMIN' | 'PLAYER' | 'TEAM_MANAGER' | 'SUPER_ADMIN') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found.');

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: targetRole },
      select: { id: true, name: true, email: true, role: true }
    });

    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (profile) {
      const msg = targetRole === 'PODIUM_ADMIN'
        ? '👑 YOU ARE NOW A PODIUM ADMIN! Access live player auctions from the Podium Control Panel in your sidebar.'
        : `Your account role was updated to ${targetRole}.`;
      await prisma.profile.update({
        where: { userId },
        data: {
          hasUnreadAdminUpdates: true,
          lastAdminChange: msg
        }
      });
    }

    return updatedUser;
  }

  static async applyPodiumAdmin(userId: string, data: { phone: string; availability: string; experience: string }) {
    const existing = await prisma.podiumAdminRequest.findFirst({
      where: { userId, status: 'PENDING_APPROVAL' }
    });
    if (existing) throw new Error('You already have a pending Podium Admin application.');

    return prisma.podiumAdminRequest.create({
      data: {
        userId,
        phone: data.phone,
        availability: data.availability,
        experience: data.experience,
        status: 'PENDING_APPROVAL'
      }
    });
  }

  static async getPendingPodiumAdminApplications() {
    return prisma.podiumAdminRequest.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async verifyPodiumAdminApplication(requestId: string, action: 'APPROVE' | 'REJECT') {
    const reqRecord = await prisma.podiumAdminRequest.findUnique({ where: { id: requestId } });
    if (!reqRecord) throw new Error('Application request not found.');

    if (action === 'REJECT') {
      const updated = await prisma.podiumAdminRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' }
      });

      await prisma.profile.updateMany({
        where: { userId: reqRecord.userId },
        data: {
          hasUnreadAdminUpdates: true,
          lastAdminChange: 'Your application for Podium Admin rights was declined by Super Admin.'
        }
      });

      return updated;
    }

    // APPROVE
    return prisma.$transaction(async (tx) => {
      const updatedReq = await tx.podiumAdminRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' }
      });

      await tx.user.update({
        where: { id: reqRecord.userId },
        data: { role: 'PODIUM_ADMIN' }
      });

      await tx.profile.updateMany({
        where: { userId: reqRecord.userId },
        data: {
          hasUnreadAdminUpdates: true,
          lastAdminChange: '👑 CONGRATULATIONS! Your Podium Admin Application has been APPROVED! You can now access the Podium Control Panel from your sidebar.'
        }
      });

      return updatedReq;
    });
  }
}
