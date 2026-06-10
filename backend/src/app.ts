import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';
import net from 'net';
import { correlationMiddleware } from './middleware/correlation';
import { loggerMiddleware } from './middleware/logger';
import { errorHandler } from './middleware/error';
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
import { initQueueWorker } from './modules/queue/queue.service';
import { prisma } from './config/database';

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(correlationMiddleware); // Set correlation ID on every request
app.use(loggerMiddleware);

// Swagger API Documentation
const openapiPath = path.join(__dirname, 'docs', 'openapi.yaml');
const openapiFile = fs.readFileSync(openapiPath, 'utf8');
const swaggerDocument = YAML.parse(openapiFile);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Redis TCP Connectivity Helper
const checkRedisHealth = (): Promise<'connected' | 'disconnected'> => {
  return new Promise((resolve) => {
    const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
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

// Advanced Health Check Route
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

    const uptime = process.uptime();
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();

    const isHealthy = dbStatus === 'connected' && redisStatus === 'connected';

    const payload = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      database: dbStatus,
      redis: redisStatus,
      uptime,
      cpuUsage: {
        system: cpuUsage.system,
        user: cpuUsage.user
      },
      memoryUsage: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external
      },
      timestamp: new Date().toISOString()
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
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cylinders', cylinderRoutes);
app.use('/api/v1/inks', inkRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/qc', qcRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/queue', queueRoutes);

// Initialize background worker
initQueueWorker();

// Global Error Handler
app.use(errorHandler);

export default app;
