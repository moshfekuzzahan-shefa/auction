import { Request, Response, NextFunction } from 'express';
import { SystemService } from './system.service';
import { sendSuccessResponse, sendErrorResponse } from '../../utils/apiResponse';

export class SystemController {
  static async getState(req: Request, res: Response, next: NextFunction) {
    try {
      const state = await SystemService.getSystemState();
      return sendSuccessResponse({ res, message: 'System state retrieved', data: state });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 500, message: error.message });
    }
  }

  static async setPhase(req: Request, res: Response, next: NextFunction) {
    try {
      const { phase } = req.body;
      const validPhases = ['SETUP', 'REGISTRATION', 'AUCTION', 'TOURNAMENT'];
      
      if (!validPhases.includes(phase)) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Invalid phase' });
      }

      const updatedState = await SystemService.updatePhase(phase as any);
      return sendSuccessResponse({ res, message: 'Phase updated successfully', data: updatedState });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 500, message: error.message });
    }
  }

  static async setConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { totalBudget, minRoster } = req.body;
      if (totalBudget === undefined || minRoster === undefined) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Provide totalBudget and minRoster' });
      }

      const updatedState = await SystemService.updateConfig(totalBudget, minRoster);
      return sendSuccessResponse({ res, message: 'Configuration updated successfully', data: updatedState });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 500, message: error.message });
    }
  }

  static async setSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const schedule = req.body;
      const updatedState = await SystemService.updateSchedule(schedule);
      return sendSuccessResponse({ res, message: 'Schedule updated successfully', data: updatedState });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 500, message: error.message });
    }
  }

  static async updateCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const { categories } = req.body;
      if (!Array.isArray(categories)) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Provide an array of categories' });
      }

      const updated = await SystemService.updateCategories(categories);
      return sendSuccessResponse({ res, message: 'Categories updated successfully', data: updated });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 500, message: error.message });
    }
  }

  static async updateRules(req: Request, res: Response, next: NextFunction) {
    try {
      const { rules } = req.body;
      if (!Array.isArray(rules)) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Provide an array of rules' });
      }

      const updated = await SystemService.updateRules(rules);
      return sendSuccessResponse({ res, message: 'Rules updated successfully', data: updated });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 500, message: error.message });
    }
  }
}
