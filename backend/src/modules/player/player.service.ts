import prisma from '../../config/db';
import { CloudinaryService } from '../../services/cloudinary.service';

import bcrypt from 'bcryptjs';

export class PlayerService {
  static async registerProfile(data: any, fileBuffer: Buffer) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new Error('Email is already registered.');

    const uploadResult = await CloudinaryService.uploadImage(fileBuffer, 'football_platform/players');
    
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: 'PLAYER',
          }
        });

        const profile = await tx.profile.create({
          data: {
            userId: user.id,
            studentId: data.studentId,
            session: data.session,
            jerseyName: data.jerseyName,
            primaryPos: data.primaryPos,
            secondaryPos: data.secondaryPos || [],
            categoryId: data.categoryId || null,
            imageUrl: uploadResult.url,
            publicId: uploadResult.publicId,
          }
        });

        return profile;
      });

      return result;
    } catch (error) {
      // Cleanup Cloudinary image if DB transaction fails
      if (uploadResult.publicId) {
        await CloudinaryService.deleteImage(uploadResult.publicId);
      }
      throw error;
    }
  }

  static async updateProfile(userId: string, data: any, fileBuffer?: Buffer) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new Error('Profile not found.');

    let imageUrl = profile.imageUrl;
    let publicId = profile.publicId;

    if (fileBuffer) {
      // Delete old image using publicId if available, else try parsing url
      if (publicId) {
        await CloudinaryService.deleteImage(publicId);
      }
      
      // Upload new image
      const uploadResult = await CloudinaryService.uploadImage(fileBuffer, 'football_platform/players');
      imageUrl = uploadResult.url;
      publicId = uploadResult.publicId;
    }

    return prisma.profile.update({
      where: { userId },
      data: {
        studentId: data.studentId ?? profile.studentId,
        session: data.session ?? profile.session,
        jerseyName: data.jerseyName ?? profile.jerseyName,
        primaryPos: data.primaryPos ?? profile.primaryPos,
        secondaryPos: data.secondaryPos ?? profile.secondaryPos,
        imageUrl,
        publicId,
      },
    });
  }

  static async withdrawRegistration(userId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new Error('Profile not found.');

    if (profile.publicId) {
      await CloudinaryService.deleteImage(profile.publicId);
    }

    return prisma.profile.delete({ where: { userId } });
  }

  static async getProfile(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true, email: true } },
        category: true,
        team: {
          include: {
            homeMatches: { include: { homeTeam: true, awayTeam: true } },
            awayMatches: { include: { homeTeam: true, awayTeam: true } }
          }
        },
        playerEvents: true,
        assistEvents: true,
      }
    });
    if (!profile) throw new Error('Profile not found.');
    return profile;
  }

  static async getUnsoldPlayers() {
    return prisma.profile.findMany({
      where: { isSold: false },
      include: {
        user: { select: { name: true } },
        category: true
      },
      orderBy: { user: { createdAt: 'asc' } }
    });
  }

  static async adminUpdateProfile(profileId: string, data: any) {
    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) throw new Error('Player profile not found.');

    let basePrice = data.basePrice;
    if (data.categoryId) {
      const category = await prisma.playerCategory.findUnique({ where: { id: data.categoryId } });
      if (category) {
        basePrice = category.basePrice;
      }
    }

    return prisma.profile.update({
      where: { id: profileId },
      data: {
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId || null } : {}),
        ...(basePrice !== undefined ? { basePrice } : {}),
        ...(data.primaryPos ? { primaryPos: data.primaryPos } : {}),
        ...(data.secondaryPos !== undefined ? { secondaryPos: Array.isArray(data.secondaryPos) ? data.secondaryPos : data.secondaryPos.split(',') } : {}),
        ...(data.studentId ? { studentId: data.studentId } : {}),
        ...(data.session ? { session: data.session } : {}),
        ...(data.jerseyName ? { jerseyName: data.jerseyName } : {}),
      },
      include: {
        user: { select: { name: true, email: true } },
        category: true
      }
    });
  }

  static async getAllPlayers() {
    return prisma.profile.findMany({
      include: {
        user: { select: { name: true, email: true } },
        category: true,
        team: { select: { name: true } }
      },
      orderBy: { user: { createdAt: 'desc' } }
    });
  }
}
