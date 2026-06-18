import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';
import net from 'net';
import os from 'os';
import { correlationMiddleware } from './middleware/correlation';
import { loggerMiddleware } from './middleware/logger';
import { rateLimiter, authRateLimiter } from './middleware/rate-limiter';
import { errorHandler } from './middleware/error';
import { sanitizeBody } from './middleware/sanitize';
import { requireApiKey } from './middleware/api-key';
import { env } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import customerRoutes from './modules/customer/customer.routes';
import productRoutes from './modules/product/product.routes';
import cylinderRoutes from './modules/cylinder/cylinder.routes';
import inkRoutes from './modules/ink/ink.routes';
import orderRoutes from './modules/order/order.routes';
import jobRoutes from './modules/job/job.routes';
import qcRoutes from './modules/qc/qc.routes';
import auditRoutes from './modules/audit/audit.routes';
import queueRoutes from './modules/queue/queue.routes';
import notificationRoutes from './modules/notification/notification.routes';
import storageRoutes from './modules/storage/storage.routes';
import aiRoutes from './modules/ai/ai.routes';
import iotRoutes from './modules/iot/iot.routes';
import permissionRoutes from './modules/permission/permission.routes';
import workflowRoutes from './modules/workflow/workflow.routes';
import layoutRoutes from './modules/layouts/layouts.routes';
import settingRoutes from './modules/setting/setting.routes';
import searchRoutes from './modules/search/search.routes';
import masterDataRoutes from './modules/master-data/masterData.routes';
import { initQueueWorker } from './modules/queue/queue.service';
import { prisma } from './config/database';
import { getRedis } from './config/redis';
import { metricsMiddleware, metricsHandler, setActiveUsers, setDbConnections, setOrdersByStatus, setJobsByStatus, setInkBatchesByStatus, setCylindersByStatus } from './middleware/metrics';

const app = express();

// Security headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: { maxAge: env.HSTS_MAX_AGE, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' },
  xssFilter: true,
}));

// CORS whitelist
const corsOrigins = env.CORS_ORIGINS.split(',').map(s => s.trim());
app.use(cors({
  origin: corsOrigins.length > 0 ? corsOrigins : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(sanitizeBody);
app.use(correlationMiddleware);
app.use(loggerMiddleware);
app.use(metricsMiddleware);
app.use(rateLimiter);

// Swagger API Documentation
const openapiPath = path.join(__dirname, 'docs', 'openapi.yaml');
const openapiFile = fs.readFileSync(openapiPath, 'utf8');
const swaggerDocument = YAML.parse(openapiFile);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Redis TCP Connectivity Helper
const checkRedisHealth = (): Promise<'connected' | 'disconnected'> => {
  return new Promise((resolve) => {
    const redisUrl = env.REDIS_URL;
    let host = 'redis';
    let port = 6379;
    try {
      const parsed = new URL(redisUrl);
      host = parsed.hostname || host;
      port = parsed.port ? parseInt(parsed.port, 10) : port;
    } catch (e) {
      // ignore parsing errors and fallback to defaults
    }

    const socket = net.connect({ host, port, timeout: 1000 }, () => {
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
const getDiskUsage = (): { total: number; free: number; used: number; usagePercent: number } | null => {
  try {
    const disk = process.platform === 'win32'
      ? { total: 0, free: 0 }
      : { total: 0, free: 0 };
    // Use os.freemem / os.totalmem as proxy when direct disk isn't available
    return {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      usagePercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
    };
  } catch {
    return null;
  }
};

// Container status via env (set by Docker Compose)
const getContainerStatus = () => {
  const services = ['postgres', 'redis', 'backend', 'frontend'];
  const statuses: Record<string, string> = {};
  for (const svc of services) {
    const envKey = `${svc.toUpperCase()}_STATUS`;
    statuses[svc] = process.env[envKey] || 'unknown';
  }
  return statuses;
};

// Prometheus metrics
app.get('/metrics', metricsHandler);

// Enhanced Health Check Route
app.get('/health', async (req, res): Promise<any> => {
  try {
    // Check Database connection
    let dbStatus: 'connected' | 'disconnected' = 'connected';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = 'disconnected';
    }

    // Check Redis connection via TCP
    const redisStatus = await checkRedisHealth();

    // Check Redis client health
    let redisClientOk = false;
    try {
      const redis = getRedis();
      const ping = await redis.ping();
      redisClientOk = ping === 'PONG';
    } catch {
      redisClientOk = false;
    }

    const uptime = process.uptime();
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();
    const disk = getDiskUsage();
    const loadAvg = os.loadavg();

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
        freeMemory: os.freemem(),
        totalMemory: os.totalmem(),
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
  } catch (error) {
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
app.use('/api/v1/auth', authRateLimiter, authRoutes);
app.use('/api/v1/permissions', permissionRoutes);
app.use('/api/v1/workflows', requireApiKey, workflowRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cylinders', cylinderRoutes);
app.use('/api/v1/inks', inkRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/qc', qcRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/queue', queueRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/storage', storageRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/iot', iotRoutes);
app.use('/api/v1/layouts', layoutRoutes);
app.use('/api/v1/settings', settingRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/master-data', masterDataRoutes);

// Initialize background worker
initQueueWorker();

// Periodic gauge updates for active users and DB connections
setInterval(async () => {
  try {
    // Count active sessions (users with non-expired, non-revoked refresh tokens)
    const activeCount = await prisma.refreshToken.count({
      where: { revoked: false, expiresAt: { gt: new Date() } },
    });
    setActiveUsers(activeCount);

    // Count database connections from pg_stat_activity
    const result: any = await prisma.$queryRaw`SELECT count(*)::int as cnt FROM pg_stat_activity WHERE datname = current_database()`;
    const dbCount = Array.isArray(result) ? (result[0]?.cnt || 0) : 0;
    setDbConnections(dbCount);

    // Business KPI metrics
    const ordersRaw: any[] = await prisma.$queryRaw`SELECT status, count(*)::int as cnt FROM sales.sales_orders GROUP BY status`;
    const ordersByStatus: Record<string, number> = {};
    for (const r of ordersRaw) ordersByStatus[r.status] = r.cnt;
    setOrdersByStatus(ordersByStatus);

    const jobsRaw: any[] = await prisma.$queryRaw`SELECT status, count(*)::int as cnt FROM production.production_jobs GROUP BY status`;
    const jobsByStatus: Record<string, number> = {};
    for (const r of jobsRaw) jobsByStatus[r.status] = r.cnt;
    setJobsByStatus(jobsByStatus);

    const inkRaw: any[] = await prisma.$queryRaw`SELECT status, count(*)::int as cnt FROM inventory.ink_batches GROUP BY status`;
    const inkByStatus: Record<string, number> = {};
    for (const r of inkRaw) inkByStatus[r.status] = r.cnt;
    setInkBatchesByStatus(inkByStatus);

    const cylRaw: any[] = await prisma.$queryRaw`SELECT status, count(*)::int as cnt FROM inventory.cylinders GROUP BY status`;
    const cylByStatus: Record<string, number> = {};
    for (const r of cylRaw) cylByStatus[r.status] = r.cnt;
    setCylindersByStatus(cylByStatus);
  } catch {
    // silently retry next interval
  }
}, 30000); // every 30 seconds

// Global Error Handler
app.use(errorHandler);

export default app;
