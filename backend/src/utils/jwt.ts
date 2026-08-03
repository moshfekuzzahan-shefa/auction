import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export const generateAccessToken = (userId: string, role: string) => {
  return jwt.sign({ id: userId, role }, JWT_SECRET as string, {
    expiresIn: '15m', // Short lived access token
  });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ id: userId }, JWT_SECRET as string, {
    expiresIn: '7d', // Long lived refresh token
  });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; role?: string };
  } catch (error) {
    return null;
  }
};
