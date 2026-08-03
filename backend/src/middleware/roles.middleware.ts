import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { sendErrorResponse } from '../utils/apiResponse';

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendErrorResponse({
        res,
        statusCode: 403,
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};
