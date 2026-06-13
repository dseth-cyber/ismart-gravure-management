import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../config/redis';
import { env } from '../config/env';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const publicConfig: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 30 };
const authConfig: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 5 };
const apiConfig: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 100 };

function getClientKey(req: Request): string {
  return (req as any).user?.userId || req.ip || 'anonymous';
}

function getConfig(path: string): RateLimitConfig {
  if (path.startsWith('/api/v1/auth/login')) return authConfig;
  if (path.startsWith('/api/v1/')) return apiConfig;
  return publicConfig;
}

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const clientIp = req.ip || '';
  if (
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp === '::ffff:127.0.0.1' ||
    process.env.NODE_ENV === 'test'
  ) {
    return next();
  }

  const config = getConfig(req.path);
  const key = `ratelimit:${getClientKey(req)}:${req.path}`;
  const redis = getRedis();

  redis.multi()
    .incr(key)
    .pttl(key)
    .exec((err: any, results: any) => {
      if (err) return next();

      const count = results?.[0]?.[1] as number | undefined;
      const ttl = results?.[1]?.[1] as number | undefined;

      if (count === 1 && (ttl === -1 || ttl === null)) {
        redis.pexpire(key, config.windowMs).catch(() => {});
      }

      const remaining = Math.max(0, config.maxRequests - (count || 0));
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', ttl ? Math.ceil((Date.now() + ttl) / 1000) : Math.ceil((Date.now() + config.windowMs) / 1000));

      if (count && count > config.maxRequests) {
        res.setHeader('Retry-After', Math.ceil((ttl || config.windowMs) / 1000));
        res.status(429).json({
          status: 'error',
          statusCode: 429,
          message: `Too many requests. Try again in ${Math.ceil((ttl || config.windowMs) / 1000)} seconds.`,
        });
        return;
      }

      next();
    });
}

export function authRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const clientIp = req.ip || '';
  if (
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp === '::ffff:127.0.0.1' ||
    process.env.NODE_ENV === 'test'
  ) {
    return next();
  }

  const config = { windowMs: 60 * 1000, maxRequests: 10 };
  const key = `ratelimit:${getClientKey(req)}:auth:${req.path}`;
  const redis = getRedis();

  redis.multi()
    .incr(key)
    .pttl(key)
    .exec((err: any, results: any) => {
      if (err) return next();

      const count = results?.[0]?.[1] as number | undefined;
      const ttl = results?.[1]?.[1] as number | undefined;

      if (count === 1 && (ttl === -1 || ttl === null)) {
        redis.pexpire(key, config.windowMs).catch(() => {});
      }

      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - (count || 0)));

      if (count && count > config.maxRequests) {
        res.setHeader('Retry-After', Math.ceil((ttl || config.windowMs) / 1000));
        res.status(429).json({
          status: 'error',
          statusCode: 429,
          message: `Too many auth requests. Try again in ${Math.ceil((ttl || config.windowMs) / 1000)} seconds.`,
        });
        return;
      }

      next();
    });
}
