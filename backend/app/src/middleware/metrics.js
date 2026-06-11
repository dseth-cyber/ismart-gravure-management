"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
exports.metricsMiddleware = metricsMiddleware;
exports.metricsHandler = metricsHandler;
exports.setActiveUsers = setActiveUsers;
exports.setDbConnections = setDbConnections;
exports.incrementQueueJobs = incrementQueueJobs;
const prom_client_1 = __importDefault(require("prom-client"));
const register = new prom_client_1.default.Registry();
exports.register = register;
prom_client_1.default.collectDefaultMetrics({ register });
const httpRequestDuration = new prom_client_1.default.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
    registers: [register],
});
const httpRequestTotal = new prom_client_1.default.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
});
const activeUsersGauge = new prom_client_1.default.Gauge({
    name: 'active_users',
    help: 'Number of currently active users (valid JWT tokens)',
    registers: [register],
});
const dbConnectionGauge = new prom_client_1.default.Gauge({
    name: 'db_connections',
    help: 'Number of database connections',
    registers: [register],
});
const queueJobsCounter = new prom_client_1.default.Counter({
    name: 'queue_jobs_total',
    help: 'Total number of queue jobs processed',
    labelNames: ['status'],
    registers: [register],
});
function metricsMiddleware(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const route = req.route?.path || req.path;
        httpRequestDuration.labels(req.method, route, String(res.statusCode)).observe(duration);
        httpRequestTotal.labels(req.method, route, String(res.statusCode)).inc();
    });
    next();
}
async function metricsHandler(req, res) {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
}
function setActiveUsers(count) {
    activeUsersGauge.set(count);
}
function setDbConnections(count) {
    dbConnectionGauge.set(count);
}
function incrementQueueJobs(status) {
    queueJobsCounter.labels(status).inc();
}
