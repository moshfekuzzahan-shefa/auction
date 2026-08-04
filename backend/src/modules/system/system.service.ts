import prisma from '../../config/db';
import { Phase } from '@prisma/client';

export class SystemService {
  static async getSystemState() {
    const state = await prisma.systemState.findFirst();
    if (!state) throw new Error('System state not initialized');
    return state;
  }

  static async updatePhase(newPhase: Phase) {
    const state = await this.getSystemState();
    return prisma.systemState.update({
      where: { id: state.id },
      data: { currentPhase: newPhase }
    });
  }

  static async updateConfig(totalBudget: number, minRoster: number) {
    const state = await this.getSystemState();
    return prisma.systemState.update({
      where: { id: state.id },
      data: { totalBudget, minRoster }
    });
  }

  static async updateSchedule(schedule: { registrationStart?: string; registrationEnd?: string; auctionStart?: string; auctionEnd?: string }) {
    const state = await this.getSystemState();
    return prisma.systemState.update({
      where: { id: state.id },
      data: {
        registrationStart: schedule.registrationStart ? new Date(schedule.registrationStart) : null,
        registrationEnd: schedule.registrationEnd ? new Date(schedule.registrationEnd) : null,
        auctionStart: schedule.auctionStart ? new Date(schedule.auctionStart) : null,
        auctionEnd: schedule.auctionEnd ? new Date(schedule.auctionEnd) : null,
      }
    });
  }

  static async updateAnnouncement(announcement: string) {
    const state = await this.getSystemState();
    return prisma.systemState.update({
      where: { id: state.id },
      data: { announcement }
    });
  }

  static async updateCategories(categories: { id: string; basePrice: number }[]) {
    return prisma.$transaction(
      categories.map(cat => 
        prisma.playerCategory.update({
          where: { id: cat.id },
          data: { basePrice: cat.basePrice }
        })
      )
    );
  }

  static async updateRules(rules: { id?: string; minBudgetPercent: number; maxBudgetPercent: number; raisePercent: number }[]) {
    // Overwrite all rules: delete existing and create new
    return prisma.$transaction(async (tx) => {
      await tx.bidRaiseRule.deleteMany({});
      await tx.bidRaiseRule.createMany({
        data: rules.map(r => ({
          minBudgetPercent: r.minBudgetPercent,
          maxBudgetPercent: r.maxBudgetPercent,
          raisePercent: r.raisePercent
        }))
      });
      return tx.bidRaiseRule.findMany();
    });
  }
}
