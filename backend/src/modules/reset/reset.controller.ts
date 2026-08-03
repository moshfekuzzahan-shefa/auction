import { Request, Response, NextFunction } from 'express';
import { ResetService } from './reset.service';
import { sendSuccessResponse, sendErrorResponse } from '../../utils/apiResponse';
import { AuthRequest } from '../../middleware/auth.middleware';

export class ResetController {
  static async executeReset(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { level, confirmationString } = req.body;

      if (!level || ![1, 2, 3].includes(level)) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Invalid level. Must be 1, 2, or 3.' });
      }

      const expectedConfirmation = `CONFIRM_NUKE_LEVEL_${level}`;
      if (confirmationString !== expectedConfirmation) {
        return sendErrorResponse({ 
          res, 
          statusCode: 403, 
          message: `Safeguard triggered: Invalid confirmation string. Expected '${expectedConfirmation}'` 
        });
      }

      let report;
      switch (level) {
        case 1:
          report = await ResetService.executeLevel1();
          break;
        case 2:
          report = await ResetService.executeLevel2(req.user!.id);
          break;
        case 3:
          report = await ResetService.executeLevel3(req.user!.id);
          break;
      }

      return sendSuccessResponse({ res, message: `Lifecycle Reset Level ${level} executed successfully`, data: report });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 500, message: error.message });
    }
  }
}
