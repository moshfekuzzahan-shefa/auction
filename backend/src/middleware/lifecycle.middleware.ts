import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendErrorResponse } from '../utils/apiResponse';

export const requirePhase = (...allowedPhases: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const state = await prisma.systemState.findFirst();
      if (!state) {
        return sendErrorResponse({ res, statusCode: 500, message: 'System state is not initialized' });
      }

      if (!allowedPhases.includes(state.currentPhase)) {
        return sendErrorResponse({ 
          res, 
          statusCode: 403, 
          message: `This action is only allowed during the following phases: ${allowedPhases.join(', ')}. Current phase is: ${state.currentPhase}` 
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
