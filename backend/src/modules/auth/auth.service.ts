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
}
