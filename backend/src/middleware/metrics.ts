import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [register],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const activeUsersGauge = new client.Gauge({
  name: 'active_users',
  help: 'Number of currently active users (valid JWT tokens)',
  registers: [register],
});

const dbConnectionGauge = new client.Gauge({
  name: 'db_connections',
  help: 'Number of database connections',
  registers: [register],
});

const queueJobsCounter = new client.Counter({
  name: 'queue_jobs_total',
  help: 'Total number of queue jobs processed',
  labelNames: ['status'],
  registers: [register],
});

const ordersGauge = new client.Gauge({
  name: 'orders_total',
  help: 'Number of sales orders by status',
  labelNames: ['status'],
  registers: [register],
});

const jobsGauge = new client.Gauge({
  name: 'jobs_total',
  help: 'Number of production jobs by status',
  labelNames: ['status'],
  registers: [register],
});

const inkBatchesGauge = new client.Gauge({
  name: 'ink_batches_total',
  help: 'Number of ink batches by status',
  labelNames: ['status'],
  registers: [register],
});

const cylindersGauge = new client.Gauge({
  name: 'cylinders_total',
  help: 'Number of cylinders by status',
  labelNames: ['status'],
  registers: [register],
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route?.path || req.path;
    httpRequestDuration.labels(req.method, route, String(res.statusCode)).observe(duration);
    httpRequestTotal.labels(req.method, route, String(res.statusCode)).inc();
  });
  next();
}

export async function metricsHandler(req: Request, res: Response): Promise<void> {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

export function setActiveUsers(count: number): void {
  activeUsersGauge.set(count);
}

export function setDbConnections(count: number): void {
  dbConnectionGauge.set(count);
}

export function incrementQueueJobs(status: string): void {
  queueJobsCounter.labels(status).inc();
}

export function setOrdersByStatus(counts: Record<string, number>): void {
  for (const [status, count] of Object.entries(counts)) {
    ordersGauge.labels(status).set(count);
  }
}

export function setJobsByStatus(counts: Record<string, number>): void {
  for (const [status, count] of Object.entries(counts)) {
    jobsGauge.labels(status).set(count);
  }
}

export function setInkBatchesByStatus(counts: Record<string, number>): void {
  for (const [status, count] of Object.entries(counts)) {
    inkBatchesGauge.labels(status).set(count);
  }
}

export function setCylindersByStatus(counts: Record<string, number>): void {
  for (const [status, count] of Object.entries(counts)) {
    cylindersGauge.labels(status).set(count);
  }
}

export { register };
