import prisma from '../../config/db';
import { CloudinaryService } from '../../services/cloudinary.service';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';

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

        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id);

        await tx.user.update({
          where: { id: user.id },
          data: { refreshToken }
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
          },
          include: {
            category: true
          }
        });

        return {
          profile,
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
          accessToken,
          refreshToken
        };
      });

      return result;
    } catch (error) {
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
      if (publicId) {
        await CloudinaryService.deleteImage(publicId);
      }
      
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

  static async getMyProfile(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true, email: true, role: true } },
        team: { select: { id: true, name: true, logoUrl: true } },
        category: true
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

  static async getAllProfiles() {
    return prisma.profile.findMany({
      include: {
        user: { select: { name: true, email: true, role: true } },
        team: { select: { id: true, name: true } },
        category: true
      },
      orderBy: { isSold: 'asc' }
    });
  }

  static async getUnassignedProfiles() {
    return prisma.profile.findMany({
      where: { categoryId: null },
      include: {
        user: { select: { name: true, email: true } }
      }
    });
  }

  static async adminUpdateProfile(profileId: string, data: any) {
    if (!profileId) throw new Error('Profile ID is required.');

    // 1. Resolve Profile by id or userId
    let profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) {
      profile = await prisma.profile.findUnique({ where: { userId: profileId } });
    }
    if (!profile) throw new Error('Player profile not found.');

    const targetProfileId = profile.id;

    let categoryRecord: any = null;
    let basePrice: number | null | undefined = undefined;

    // 2. Parse & Sanitize Category parameter via PlayerCategory lookup
    if (data.categoryId !== undefined) {
      const rawCat = data.categoryId;
      if (!rawCat || rawCat === 'null' || rawCat === 'unassigned' || rawCat === '') {
        categoryRecord = null;
        basePrice = null;
      } else {
        let categoryInput = String(rawCat).trim();
        if (categoryInput.includes('(')) {
          categoryInput = categoryInput.split('(')[0].trim();
        }
        if (categoryInput.toLowerCase().endsWith('tier')) {
          categoryInput = categoryInput.replace(/tier/i, '').trim();
        }

        categoryRecord = await prisma.playerCategory.findFirst({
          where: {
            OR: [
              { id: categoryInput },
              { name: { equals: categoryInput, mode: 'insensitive' } }
            ]
          }
        });

        if (!categoryRecord) {
          throw new Error(`Invalid category specified: "${data.categoryId}". Category tier does not exist in database.`);
        }

        basePrice = categoryRecord.basePrice;
      }
    } else if (data.basePrice !== undefined) {
      basePrice = Number(data.basePrice);
    }

    const changeMsg = categoryRecord 
      ? `Your Category Tier was updated to ${categoryRecord.name} ($${categoryRecord.basePrice})` 
      : (data.categoryId !== undefined ? 'Your Category Tier was reset to Unassigned Tier.' : 'Admin updated your profile details.');

    // 3. Build Prisma Update Payload using nested relation connect/disconnect
    const updateData: any = {
      hasUnreadAdminUpdates: true,
      lastAdminChange: changeMsg,
    };

    if (data.categoryId !== undefined) {
      if (categoryRecord) {
        updateData.category = {
          connect: { id: categoryRecord.id }
        };
        updateData.basePrice = categoryRecord.basePrice;
      } else {
        updateData.category = {
          disconnect: true
        };
        updateData.basePrice = null;
      }
    }

    if (basePrice !== undefined) {
      updateData.basePrice = basePrice;
    }

    if (data.primaryPos) {
      updateData.primaryPos = String(data.primaryPos).trim();
    }

    if (data.secondaryPos !== undefined) {
      updateData.secondaryPos = Array.isArray(data.secondaryPos) 
        ? data.secondaryPos 
        : String(data.secondaryPos).split(',').map((s: string) => s.trim());
    }

    if (data.studentId) {
      updateData.studentId = String(data.studentId).trim();
    }

    if (data.session) {
      updateData.session = String(data.session).trim();
    }

    if (data.jerseyName) {
      updateData.jerseyName = String(data.jerseyName).trim();
    }

    // 4. Safe DB Update in try-catch using nested relation syntax
    try {
      return await prisma.profile.update({
        where: { id: targetProfileId },
        data: updateData,
        include: {
          user: { select: { name: true, email: true } },
          category: true,
          team: { select: { name: true } }
        }
      });
    } catch (dbError: any) {
      console.error('Failed in prisma.profile.update with connect/disconnect relation syntax:', dbError);
      throw new Error(`Database error updating category: ${dbError.message}`);
    }
  }

  static async markAdminUpdatesAsRead(userId: string) {
    return prisma.profile.update({
      where: { userId },
      data: {
        hasUnreadAdminUpdates: false
      }
    });
  }
}
