import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
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

  static async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id as string;
      const { role } = req.body;
      if (!role) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Role is required' });
      }

      const updated = await UsersService.updateRole(userId, role);
      return sendSuccessResponse({ res, message: `User role updated to ${role} successfully`, data: updated });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async applyPodiumAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendErrorResponse({ res, statusCode: 401, message: 'Unauthorized' });
      const { phone, availability, experience } = req.body;
      if (!phone || !availability) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Phone and availability are required.' });
      }

      const requestRecord = await UsersService.applyPodiumAdmin(req.user.id, { phone, availability, experience: experience || '' });
      return sendSuccessResponse({ res, statusCode: 201, message: 'Your application has been submitted to Super Admin for verification!', data: requestRecord });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async getPendingPodiumAdminApplications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const applications = await UsersService.getPendingPodiumAdminApplications();
      return sendSuccessResponse({ res, data: applications });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 500, message: error.message });
    }
  }

  static async verifyPodiumAdminApplication(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { action } = req.body; // "APPROVE" | "REJECT"
      const result = await UsersService.verifyPodiumAdminApplication(id, action);
      return sendSuccessResponse({ res, message: `Podium Admin application ${action.toLowerCase()}d successfully`, data: result });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }
}
