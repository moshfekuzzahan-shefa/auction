import bcrypt from 'bcryptjs';
import prisma from '../../config/db';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';

export class AuthService {
  static async login(email: string, passwordString: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(passwordString, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    };
  }

  static async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  static async refreshAuthToken(token: string, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.refreshToken !== token) {
      throw new Error('Invalid refresh token');
    }
    const newAccessToken = generateAccessToken(user.id, user.role);
    return newAccessToken;
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return {
        message: 'If an account exists with that email, a password reset code has been created.',
        resetToken: null,
        email
      };
    }

    // Generate 6-digit OTP reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    return {
      message: 'Password reset code generated successfully.',
      resetToken,
      email: user.email
    };
  }

  static async resetPassword(email: string, resetToken: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid email address.');
    }

    if (!user.resetToken || user.resetToken !== resetToken) {
      throw new Error('Invalid reset token or code.');
    }

    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      throw new Error('Reset token has expired. Please request a new one.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return { message: 'Password has been reset successfully.' };
  }

  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });
    return user;
  }
}
