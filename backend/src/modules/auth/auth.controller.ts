import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccessResponse, sendErrorResponse } from '../../utils/apiResponse';
import { AuthRequest } from '../../middleware/auth.middleware';
import { AuditService } from '../../services/audit.service';
import { verifyToken } from '../../utils/jwt';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Please provide email and password' });
      }

      const { user, accessToken, refreshToken } = await AuthService.login(email, password);

      // Set cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 mins
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      await AuditService.log({
        userId: user.id,
        action: 'USER_LOGIN',
        resource: 'Authentication',
        ipAddress: req.ip
      });

      return sendSuccessResponse({
        res,
        message: 'Login successful',
        data: { user, accessToken }
      });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 401, message: error.message });
    }
  }

  static async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        await AuthService.logout(req.user.id);
        
        await AuditService.log({
          userId: req.user.id,
          action: 'USER_LOGOUT',
          resource: 'Authentication',
          ipAddress: req.ip
        });
      }
      
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return sendSuccessResponse({ res, message: 'Logout successful' });
    } catch (error: any) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Please provide a valid registered email address.' });
      }

      const result = await AuthService.forgotPassword(email);
      return sendSuccessResponse({ res, message: result.message, data: result });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, resetToken, newPassword } = req.body;
      if (!email || !resetToken || !newPassword) {
        return sendErrorResponse({ res, statusCode: 400, message: 'Email, reset code, and new password are required.' });
      }

      if (newPassword.length < 6) {
        return sendErrorResponse({ res, statusCode: 400, message: 'New password must be at least 6 characters long.' });
      }

      const result = await AuthService.resetPassword(email, resetToken, newPassword);
      return sendSuccessResponse({ res, message: result.message });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 400, message: error.message });
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) {
        return sendErrorResponse({ res, statusCode: 401, message: 'No refresh token provided' });
      }

      const decoded = verifyToken(token);
      if (!decoded || !decoded.id) {
        return sendErrorResponse({ res, statusCode: 401, message: 'Invalid refresh token' });
      }

      const accessToken = await AuthService.refreshAuthToken(token, decoded.id);

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 mins
      });

      return sendSuccessResponse({ res, message: 'Token refreshed', data: { accessToken } });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 401, message: error.message });
    }
  }

  static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return sendErrorResponse({ res, statusCode: 401, message: 'Not authenticated' });
      }

      const user = await AuthService.getUserById(req.user.id);
      if (!user) {
        return sendErrorResponse({ res, statusCode: 404, message: 'User not found' });
      }

      return sendSuccessResponse({ res, data: { user } });
    } catch (error: any) {
      return sendErrorResponse({ res, statusCode: 500, message: error.message });
    }
  }
}
