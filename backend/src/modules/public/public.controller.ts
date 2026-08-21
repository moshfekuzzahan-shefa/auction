import { Request, Response, NextFunction } from 'express';
import { PublicService } from './public.service';
import { sendSuccessResponse, sendErrorResponse } from '../../utils/apiResponse';

export class PublicController {
  static async getLandingData(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await PublicService.getLandingPageData();
      return sendSuccessResponse({ res, message: data.message, data });
    } catch (error: any) {
      const fallbackData = {
        phase: 'SETUP',
        message: 'System not initialized or data unavailable',
        announcement: 'Welcome to the platform',
        schedule: {
          registrationStart: null,
          registrationEnd: null,
          auctionStart: null,
          auctionEnd: null
        },
        data: {
          categories: [],
          positions: [],
          teams: []
        }
      };
      return sendSuccessResponse({ res, message: fallbackData.message, data: fallbackData });
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await PublicService.getCategories();
      return sendSuccessResponse({ res, data: categories });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 500, message: error.message });
    }
  }

  static async getNews(req: Request, res: Response, next: NextFunction) {
    try {
      const news = await PublicService.getNews();
      return sendSuccessResponse({ res, data: news });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 500, message: error.message });
    }
  }
}
