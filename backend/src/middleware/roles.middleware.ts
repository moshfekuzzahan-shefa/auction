import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { sendErrorResponse } from '../utils/apiResponse';

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendErrorResponse({
        res,
        statusCode: 403,
        message: 'You do not have permission to perform this action'
      });
    }

    // SUPER_ADMIN inherently possesses all permissions of all roles
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return sendErrorResponse({
        res,
        statusCode: 403,
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};
