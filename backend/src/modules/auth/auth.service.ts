import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../middleware/error';

export class AuthService {
  static async login(username: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      throw new AppError('Invalid username or password', 400);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid username or password', 400);
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };
  }

  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
}
