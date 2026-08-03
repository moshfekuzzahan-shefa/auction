import { Request, Response, NextFunction } from 'express';
import { PlayerService } from './player.service';
import { sendSuccessResponse, sendErrorResponse } from '../../utils/apiResponse';
import { AuthRequest } from '../../middleware/auth.middleware';
import { AuditService } from '../../services/audit.service';

export class PlayerController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Profile image is required' });
      }

      const { name, email, password, studentId, session, jerseyName, primaryPos, secondaryPos, categoryId } = req.body;

      if (!name || !email || !password) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Name, email, and password are required.' });
      }

      if (!primaryPos) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Exactly one primary position is required.' });
      }

      // secondaryPos could be a string or array of strings depending on FormData
      const parsedSecondaryPos = Array.isArray(secondaryPos) 
        ? secondaryPos 
        : (secondaryPos ? secondaryPos.split(',') : []);

      const data = {
        name,
        email,
        password,
        studentId,
        session,
        jerseyName,
        primaryPos,
        secondaryPos: parsedSecondaryPos,
        categoryId
      };

      const profile = await PlayerService.registerProfile(data, req.file.buffer);
      
      await AuditService.log({
        userId: profile.userId,
        action: 'PLAYER_REGISTERED',
        resource: 'PlayerProfile',
        ipAddress: req.ip
      });

      return sendSuccessResponse({ res, statusCode: 201, message: 'Registration successful', data: profile });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'PLAYER') {
        return sendErrorResponse({ res, statusCode: 403, message: 'Only players can update their profile.' });
      }

      const { studentId, session, jerseyName, primaryPos, secondaryPos } = req.body;

      const parsedSecondaryPos = Array.isArray(secondaryPos) 
        ? secondaryPos 
        : (secondaryPos ? secondaryPos.split(',') : undefined);

      const data = {
        studentId,
        session,
        jerseyName,
        primaryPos,
        ...(parsedSecondaryPos !== undefined && { secondaryPos: parsedSecondaryPos })
      };

      const profile = await PlayerService.updateProfile(req.user.id, data, req.file?.buffer);
      return sendSuccessResponse({ res, message: 'Profile updated successfully', data: profile });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async withdraw(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'PLAYER') {
        return sendErrorResponse({ res, statusCode: 403, message: 'Only players can withdraw.' });
      }

      await PlayerService.withdrawRegistration(req.user.id);
      return sendSuccessResponse({ res, message: 'Registration withdrawn successfully' });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return sendErrorResponse({ res, statusCode: 401, message: 'Unauthorized' });
      }
      const profile = await PlayerService.getProfile(req.user.id);
      return sendSuccessResponse({ res, data: profile });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async getUnsoldPlayers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Typically used by AUCTION phase or SUPER_ADMIN
      const players = await PlayerService.getUnsoldPlayers();
      return sendSuccessResponse({ res, data: players });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 500, message: error.message });
    }
  }

  static async getAllPlayers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const players = await PlayerService.getAllPlayers();
      return sendSuccessResponse({ res, data: players });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 500, message: error.message });
    }
  }

  static async adminUpdate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const profile = await PlayerService.adminUpdateProfile(id as string, req.body);
      return sendSuccessResponse({ res, data: profile, message: 'Player profile updated by Admin' });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }
}
