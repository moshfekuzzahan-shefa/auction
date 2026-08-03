import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { sendSuccessResponse, sendErrorResponse } from '../../utils/apiResponse';

export class UsersController {
  static async createPodiumAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, name, password } = req.body;
      if (!email || !name || !password) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Missing required fields' });
      }

      const admin = await UsersService.createAdmin(email, name, password, 'PODIUM_ADMIN');
      return sendSuccessResponse({ res, statusCode: 201, message: 'Podium Admin created successfully', data: admin });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async createTeamManager(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, name, password, teamName } = req.body;
      if (!email || !name || !password || !teamName) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Missing required fields' });
      }

      const result = await UsersService.createTeamManager(email, name, password, teamName);
      return sendSuccessResponse({ res, statusCode: 201, message: 'Team Manager created successfully', data: result });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }
}
