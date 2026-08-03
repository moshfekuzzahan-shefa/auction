import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendErrorResponse } from '../utils/apiResponse';
import prisma from '../config/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return sendErrorResponse({ res, statusCode: 401, message: 'Not authorized to access this route' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return sendErrorResponse({ res, statusCode: 401, message: 'Invalid or expired token' });
    }

    // Check if user still exists
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!currentUser) {
      return sendErrorResponse({ res, statusCode: 401, message: 'The user belonging to this token no longer exists.' });
    }

    // Grant access to protected route
    req.user = { id: currentUser.id, role: currentUser.role };
    next();
  } catch (error) {
    next(error);
  }
};
