"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = rateLimiter;
exports.authRateLimiter = authRateLimiter;
const redis_1 = require("../config/redis");
const publicConfig = { windowMs: 60 * 1000, maxRequests: 30 };
const authConfig = { windowMs: 60 * 1000, maxRequests: 5 };
const apiConfig = { windowMs: 60 * 1000, maxRequests: 100 };
function getClientKey(req) {
    return req.user?.userId || req.ip || 'anonymous';
}
function getConfig(path) {
    if (path.startsWith('/api/v1/auth/login'))
        return authConfig;
    if (path.startsWith('/api/v1/'))
        return apiConfig;
    return publicConfig;
}
function rateLimiter(req, res, next) {
    const config = getConfig(req.path);
    const key = `ratelimit:${getClientKey(req)}:${req.path}`;
    const redis = (0, redis_1.getRedis)();
    redis.multi()
        .incr(key)
        .pttl(key)
        .exec((err, results) => {
        if (err)
            return next();
        const count = results?.[0]?.[1];
        const ttl = results?.[1]?.[1];
        if (count === 1 && (ttl === -1 || ttl === null)) {
            redis.pexpire(key, config.windowMs).catch(() => { });
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
function authRateLimiter(req, res, next) {
    const config = { windowMs: 60 * 1000, maxRequests: 10 };
    const key = `ratelimit:${getClientKey(req)}:auth:${req.path}`;
    const redis = (0, redis_1.getRedis)();
    redis.multi()
        .incr(key)
        .pttl(key)
        .exec((err, results) => {
        if (err)
            return next();
        const count = results?.[0]?.[1];
        const ttl = results?.[1]?.[1];
        if (count === 1 && (ttl === -1 || ttl === null)) {
            redis.pexpire(key, config.windowMs).catch(() => { });
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
