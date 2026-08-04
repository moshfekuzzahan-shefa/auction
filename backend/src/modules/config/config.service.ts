import prisma from '../../config/db';

export class ConfigService {
  // --- Player Categories ---
  static async getCategories() {
    return prisma.playerCategory.findMany();
  }
  static async createCategory(name: string, basePrice: number) {
    return prisma.playerCategory.create({ data: { name, basePrice } });
  }
  static async deleteCategory(id: string) {
    return prisma.playerCategory.delete({ where: { id } });
  }

  // --- Player Positions ---
  static async getPositions() {
    return prisma.playerPosition.findMany();
  }
  static async createPosition(code: string, name: string) {
    return prisma.playerPosition.create({ data: { code, name } });
  }
  static async deletePosition(id: string) {
    return prisma.playerPosition.delete({ where: { id } });
  }

  // --- Academic Sessions ---
  static async getSessions() {
    return prisma.academicSession.findMany();
  }
  static async createSession(name: string) {
    return prisma.academicSession.create({ data: { name } });
  }
  static async deleteSession(id: string) {
    return prisma.academicSession.delete({ where: { id } });
  }

  // --- Bid Raise Rules ---
  static async getBidRaiseRules() {
    return prisma.bidRaiseRule.findMany({ include: { category: true }, orderBy: { minPrice: 'asc' } });
  }
  static async createBidRaiseRule(minPrice: number, maxPrice: number, incrementType: 'PERCENT' | 'FIXED' = 'PERCENT', incrementValue: number = 10, categoryId?: string | null) {
    return prisma.bidRaiseRule.create({
      data: { minPrice, maxPrice, incrementType: incrementType as any, incrementValue, categoryId: categoryId || null },
      include: { category: true }
    });
  }
  static async deleteBidRaiseRule(id: string) {
    return prisma.bidRaiseRule.delete({ where: { id } });
  }
}
