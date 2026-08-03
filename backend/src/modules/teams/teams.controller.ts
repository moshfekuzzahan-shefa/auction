import { Request, Response, NextFunction } from 'express';
import { TeamsService } from './teams.service';
import { sendSuccessResponse, sendErrorResponse } from '../../utils/apiResponse';
import { AuthRequest } from '../../middleware/auth.middleware';

export class TeamsController {
  static async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'TEAM_MANAGER') {
        return sendErrorResponse({ res, statusCode: 403, message: 'Access restricted to Team Managers' });
      }

      const data = await TeamsService.getTeamDashboardData(req.user.id);
      return sendSuccessResponse({ res, data });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async markNotificationsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'TEAM_MANAGER') {
        return sendErrorResponse({ res, statusCode: 403, message: 'Access restricted to Team Managers' });
      }

      const dashboard = await TeamsService.getTeamDashboardData(req.user.id);
      await TeamsService.markNotificationsRead(dashboard.teamInfo.id);
      
      return sendSuccessResponse({ res, message: 'Notifications marked as read' });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async registerTeam(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Team logo is required' });
      }
      const team = await TeamsService.registerTeam(req.body, req.file.buffer);
      return sendSuccessResponse({ res, statusCode: 201, message: 'Team registered successfully', data: team });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async getTeams(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const teams = await TeamsService.getTeams();
      return sendSuccessResponse({ res, data: teams });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 500, message: error.message });
    }
  }

  static async requestTeam(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendErrorResponse({ res, statusCode: 401, message: 'Unauthorized' });
      const fileBuffer = req.file?.buffer;
      const team = await TeamsService.requestTeam(req.user.id, req.body, fileBuffer);
      return sendSuccessResponse({ res, statusCode: 201, message: 'Team creation request submitted! Awaiting admin verification.', data: team });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async getPendingRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const requests = await TeamsService.getPendingRequests();
      return sendSuccessResponse({ res, data: requests });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 500, message: error.message });
    }
  }

  static async verifyTeamRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { action } = req.body;
      const result = await TeamsService.verifyTeamRequest(id, action);
      return sendSuccessResponse({ res, message: `Team request ${action.toLowerCase()}d successfully`, data: result });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }
}
