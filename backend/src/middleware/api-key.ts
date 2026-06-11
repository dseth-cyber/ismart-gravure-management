import { Response, NextFunction } from 'express';
import { env } from '../config/env';
import { AppError } from './error';
import { AuthenticatedRequest } from './auth';

export function requireApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!env.API_KEY_ENABLED) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return next(new AppError('API key required (X-API-Key header)', 401));
  }

  if (!env.API_KEYS.includes(apiKey)) {
    return next(new AppError('Invalid API key', 401));
  }

  next();
}
