"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const yaml_1 = __importDefault(require("yaml"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const net_1 = __importDefault(require("net"));
const os_1 = __importDefault(require("os"));
const correlation_1 = require("./middleware/correlation");
const logger_1 = require("./middleware/logger");
const rate_limiter_1 = require("./middleware/rate-limiter");
const error_1 = require("./middleware/error");
const api_key_1 = require("./middleware/api-key");
const env_1 = require("./config/env");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const customer_routes_1 = __importDefault(require("./modules/customer/customer.routes"));
const product_routes_1 = __importDefault(require("./modules/product/product.routes"));
const cylinder_routes_1 = __importDefault(require("./modules/cylinder/cylinder.routes"));
const ink_routes_1 = __importDefault(require("./modules/ink/ink.routes"));
const order_routes_1 = __importDefault(require("./modules/order/order.routes"));
const job_routes_1 = __importDefault(require("./modules/job/job.routes"));
const qc_routes_1 = __importDefault(require("./modules/qc/qc.routes"));
const audit_routes_1 = __importDefault(require("./modules/audit/audit.routes"));
const queue_routes_1 = __importDefault(require("./modules/queue/queue.routes"));
const notification_routes_1 = __importDefault(require("./modules/notification/notification.routes"));
const storage_routes_1 = __importDefault(require("./modules/storage/storage.routes"));
const ai_routes_1 = __importDefault(require("./modules/ai/ai.routes"));
const iot_routes_1 = __importDefault(require("./modules/iot/iot.routes"));
const permission_routes_1 = __importDefault(require("./modules/permission/permission.routes"));
const workflow_routes_1 = __importDefault(require("./modules/workflow/workflow.routes"));
const queue_service_1 = require("./modules/queue/queue.service");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const metrics_1 = require("./middleware/metrics");
const app = (0, express_1.default)();
// Security headers (Helmet)
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
        },
    },
    hsts: { maxAge: env_1.env.HSTS_MAX_AGE, includeSubDomains: true, preload: true },
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'same-origin' },
    xssFilter: true,
}));
// CORS whitelist
const corsOrigins = env_1.env.CORS_ORIGINS.split(',').map(s => s.trim());
app.use((0, cors_1.default)({
    origin: corsOrigins.length > 0 ? corsOrigins : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
}));
app.use(express_1.default.json({ limit: '1mb' }));
app.use(correlation_1.correlationMiddleware);
app.use(logger_1.loggerMiddleware);
app.use(metrics_1.metricsMiddleware);
app.use(rate_limiter_1.rateLimiter);
// Swagger API Documentation
const openapiPath = path_1.default.join(__dirname, 'docs', 'openapi.yaml');
const openapiFile = fs_1.default.readFileSync(openapiPath, 'utf8');
const swaggerDocument = yaml_1.default.parse(openapiFile);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
// Redis TCP Connectivity Helper
const checkRedisHealth = () => {
    return new Promise((resolve) => {
        const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
        let host = 'redis';
        let port = 6379;
        try {
            const parsed = new URL(redisUrl);
            host = parsed.hostname || host;
            port = parsed.port ? parseInt(parsed.port, 10) : port;
        }
        catch (e) {
            // ignore parsing errors and fallback to defaults
        }
        const socket = net_1.default.connect({ host, port, timeout: 1000 }, () => {
            socket.end();
            resolve('connected');
        });
        socket.on('error', () => {
            resolve('disconnected');
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve('disconnected');
        });
    });
};
// Disk usage helper
const getDiskUsage = () => {
    try {
        const disk = process.platform === 'win32'
            ? { total: 0, free: 0 }
            : { total: 0, free: 0 };
        // Use os.freemem / os.totalmem as proxy when direct disk isn't available
        return {
            total: os_1.default.totalmem(),
            free: os_1.default.freemem(),
            used: os_1.default.totalmem() - os_1.default.freemem(),
            usagePercent: Math.round(((os_1.default.totalmem() - os_1.default.freemem()) / os_1.default.totalmem()) * 100),
        };
    }
    catch {
        return null;
    }
};
// Container status via env (set by Docker Compose)
const getContainerStatus = () => {
    const services = ['postgres', 'redis', 'backend', 'frontend'];
    const statuses = {};
    for (const svc of services) {
        const envKey = `${svc.toUpperCase()}_STATUS`;
        statuses[svc] = process.env[envKey] || 'unknown';
    }
    return statuses;
};
// Prometheus metrics
app.get('/metrics', metrics_1.metricsHandler);
// Enhanced Health Check Route
app.get('/health', async (req, res) => {
    try {
        // Check Database connection
        let dbStatus = 'connected';
        try {
            await database_1.prisma.$queryRaw `SELECT 1`;
        }
        catch (error) {
            dbStatus = 'disconnected';
        }
        // Check Redis connection via TCP
        const redisStatus = await checkRedisHealth();
        // Check Redis client health
        let redisClientOk = false;
        try {
            const redis = (0, redis_1.getRedis)();
            const ping = await redis.ping();
            redisClientOk = ping === 'PONG';
        }
        catch {
            redisClientOk = false;
        }
        const uptime = process.uptime();
        const cpuUsage = process.cpuUsage();
        const memoryUsage = process.memoryUsage();
        const disk = getDiskUsage();
        const loadAvg = os_1.default.loadavg();
        const isHealthy = dbStatus === 'connected' && redisStatus === 'connected';
        const payload = {
            status: isHealthy ? 'healthy' : 'unhealthy',
            version: process.env.npm_package_version || '1.0.0',
            database: dbStatus,
            redis: redisStatus,
            redisClient: redisClientOk ? 'connected' : 'disconnected',
            uptime: Math.floor(uptime),
            cpuUsage: {
                system: cpuUsage.system,
                user: cpuUsage.user,
                loadAverage: loadAvg.slice(0, 3),
            },
            memoryUsage: {
                rss: memoryUsage.rss,
                heapTotal: memoryUsage.heapTotal,
                heapUsed: memoryUsage.heapUsed,
                external: memoryUsage.external,
                freeMemory: os_1.default.freemem(),
                totalMemory: os_1.default.totalmem(),
            },
            disk: disk ? {
                totalBytes: disk.total,
                freeBytes: disk.free,
                usedBytes: disk.used,
                usagePercent: disk.usagePercent,
            } : null,
            containers: getContainerStatus(),
            timestamp: new Date().toISOString(),
        };
        if (!isHealthy) {
            return res.status(500).json(payload);
        }
        return res.status(200).json(payload);
    }
    catch (error) {
        return res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            redis: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    }
});
// API Routes
app.use('/api/v1/auth', rate_limiter_1.authRateLimiter, auth_routes_1.default);
app.use('/api/v1/permissions', api_key_1.requireApiKey, permission_routes_1.default);
app.use('/api/v1/workflows', api_key_1.requireApiKey, workflow_routes_1.default);
app.use('/api/v1/customers', customer_routes_1.default);
app.use('/api/v1/products', product_routes_1.default);
app.use('/api/v1/cylinders', cylinder_routes_1.default);
app.use('/api/v1/inks', ink_routes_1.default);
app.use('/api/v1/orders', order_routes_1.default);
app.use('/api/v1/jobs', job_routes_1.default);
app.use('/api/v1/qc', qc_routes_1.default);
app.use('/api/v1/audit', audit_routes_1.default);
app.use('/api/v1/queue', queue_routes_1.default);
app.use('/api/v1/notifications', notification_routes_1.default);
app.use('/api/v1/storage', storage_routes_1.default);
app.use('/api/v1/ai', ai_routes_1.default);
app.use('/api/v1/iot', iot_routes_1.default);
// Initialize background worker
(0, queue_service_1.initQueueWorker)();
// Global Error Handler
app.use(error_1.errorHandler);
exports.default = app;
