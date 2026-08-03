import { Request, Response, NextFunction } from 'express';
import { ConfigService } from './config.service';
import { sendSuccessResponse, sendErrorResponse } from '../../utils/apiResponse';

export class ConfigController {
  // --- Categories ---
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await ConfigService.getCategories();
      return sendSuccessResponse({ res, data: categories });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 500, message: error.message });
    }
  }
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, basePrice } = req.body;
      if (!name || basePrice === undefined) return sendErrorResponse({ res, message: 'Missing name or basePrice' });
      const category = await ConfigService.createCategory(name, Number(basePrice));
      return sendSuccessResponse({ res, statusCode: 201, data: category });
    } catch (error: any) {
      return sendErrorResponse({ res, message: error.message });
    }
  }
  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      await ConfigService.deleteCategory(req.params.id as string);
      return sendSuccessResponse({ res, message: 'Deleted successfully' });
    } catch (error: any) {
      return sendErrorResponse({ res, message: error.message });
    }
  }

  // --- Positions ---
  static async getPositions(req: Request, res: Response, next: NextFunction) {
    try {
      const positions = await ConfigService.getPositions();
      return sendSuccessResponse({ res, data: positions });
    } catch (error: any) {
      return sendErrorResponse({ res, message: error.message });
    }
  }
  static async createPosition(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, name } = req.body;
      if (!code || !name) return sendErrorResponse({ res, message: 'Missing code or name' });
      const position = await ConfigService.createPosition(code, name);
      return sendSuccessResponse({ res, statusCode: 201, data: position });
    } catch (error: any) {
      return sendErrorResponse({ res, message: error.message });
    }
  }
  static async deletePosition(req: Request, res: Response, next: NextFunction) {
    try {
      await ConfigService.deletePosition(req.params.id as string);
      return sendSuccessResponse({ res, message: 'Deleted successfully' });
    } catch (error: any) {
      return sendErrorResponse({ res, message: error.message });
    }
  }

  // --- Sessions ---
  static async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const sessions = await ConfigService.getSessions();
      return sendSuccessResponse({ res, data: sessions });
    } catch (error: any) {
      return sendErrorResponse({ res, message: error.message });
    }
  }
  static async createSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      if (!name) return sendErrorResponse({ res, message: 'Missing name' });
      const session = await ConfigService.createSession(name);
      return sendSuccessResponse({ res, statusCode: 201, data: session });
    } catch (error: any) {
      return sendErrorResponse({ res, message: error.message });
    }
  }
  static async deleteSession(req: Request, res: Response, next: NextFunction) {
    try {
      await ConfigService.deleteSession(req.params.id as string);
      return sendSuccessResponse({ res, message: 'Deleted successfully' });
    } catch (error: any) {
      return sendErrorResponse({ res, message: error.message });
    }
  }

  // --- Bid Raise Rules ---
  static async getBidRaiseRules(req: Request, res: Response, next: NextFunction) {
    try {
      const rules = await ConfigService.getBidRaiseRules();
      return sendSuccessResponse({ res, data: rules });
    } catch (error: any) {
      return sendErrorResponse({ res, message: error.message });
    }
  }
  static async createBidRaiseRule(req: Request, res: Response, next: NextFunction) {
    try {
      const { minPercent, maxPercent, raisePercent } = req.body;
      if (minPercent === undefined || maxPercent === undefined || raisePercent === undefined) {
        return sendErrorResponse({ res, message: 'Missing minPercent, maxPercent, or raisePercent' });
      }
      const rule = await ConfigService.createBidRaiseRule(Number(minPercent), Number(maxPercent), Number(raisePercent));
      return sendSuccessResponse({ res, statusCode: 201, data: rule });
    } catch (error: any) {
      return sendErrorResponse({ res, message: error.message });
    }
  }
  static async deleteBidRaiseRule(req: Request, res: Response, next: NextFunction) {
    try {
      await ConfigService.deleteBidRaiseRule(req.params.id as string);
      return sendSuccessResponse({ res, message: 'Deleted successfully' });
    } catch (error: any) {
      return sendErrorResponse({ res, message: error.message });
    }
  }
}
