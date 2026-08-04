import { Request, Response, NextFunction } from 'express';
import { TournamentService } from './tournament.service';
import { sendSuccessResponse, sendErrorResponse } from '../../utils/apiResponse';

export class TournamentController {
  static async createFixture(req: Request, res: Response, next: NextFunction) {
    try {
      const { homeTeamId, awayTeamId, type, round, scheduledTime, venue } = req.body;
      if (!homeTeamId || !awayTeamId || !type || !round) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Missing required fields.' });
      }

      const result = await TournamentService.createFixture({ homeTeamId, awayTeamId, type, round, scheduledTime, venue });
      return sendSuccessResponse({ res, statusCode: 201, message: 'Fixture created', data: result });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async generateAutoFixtures(req: Request, res: Response, next: NextFunction) {
    try {
      const fixtures = await TournamentService.generateAutoFixtures();
      return sendSuccessResponse({ res, statusCode: 201, message: 'Tournament fixtures generated successfully', data: fixtures });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async deleteFixture(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await TournamentService.deleteFixture(id as string);
      return sendSuccessResponse({ res, message: 'Fixture deleted successfully' });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async getFixtures(req: Request, res: Response, next: NextFunction) {
    try {
      const fixtures = await TournamentService.getFixtures();
      return sendSuccessResponse({ res, data: fixtures });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async logEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { type, playerId, assistId, minute } = req.body;
      
      if (!type || !playerId || minute === undefined) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Missing required event fields.' });
      }

      const event = await TournamentService.logEvent(id as string, { type, playerId, assistId, minute });
      return sendSuccessResponse({ res, statusCode: 201, message: 'Event logged', data: event });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Status is required' });
      }
      
      const match = await TournamentService.updateStatus(id as string, status);
      return sendSuccessResponse({ res, message: `Match status updated to ${status}`, data: match });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async getStandings(req: Request, res: Response, next: NextFunction) {
    try {
      const standings = await TournamentService.getStandings();
      return sendSuccessResponse({ res, data: standings });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async getPlayerStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await TournamentService.getPlayerStats();
      return sendSuccessResponse({ res, data: stats });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }
}
