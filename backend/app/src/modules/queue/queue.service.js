"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initQueueWorker = exports.jobsQueue = exports.redisConnectionOptions = void 0;
const bullmq_1 = require("bullmq");
const logger_1 = require("../../utils/logger");
const audit_service_1 = require("../audit/audit.service");
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
// Setup connection options for BullMQ
// BullMQ requires maxRetriesPerRequest to be null
let host = 'redis';
let port = 6379;
try {
    const parsed = new URL(redisUrl);
    host = parsed.hostname || host;
    port = parsed.port ? parseInt(parsed.port, 10) : port;
}
catch (e) {
    // ignore
}
exports.redisConnectionOptions = {
    host,
    port,
    maxRetriesPerRequest: null,
};
exports.jobsQueue = new bullmq_1.Queue('gravure-jobs', {
    connection: exports.redisConnectionOptions,
});
let worker = null;
const initQueueWorker = () => {
    if (worker)
        return;
    logger_1.Logger.info('Initializing BullMQ Background Worker...');
    worker = new bullmq_1.Worker('gravure-jobs', async (job) => {
        const { jobType, payload, correlationId } = job.data;
        const correlation = correlationId || `job-${job.id}`;
        logger_1.Logger.info(`[Worker] Started processing job ${job.id} of type ${jobType}`, correlation);
        // Create a mock request object so the AuditService can properly capture correlationId and logging context
        const mockReq = {
            correlationId: correlation,
            headers: { 'user-agent': 'background-worker' },
            ip: '127.0.0.1',
            user: {
                userId: payload.userId || 'system',
                username: payload.username || 'background-worker',
            },
        };
        if (jobType === 'GENERATE_REPORT') {
            const { reportType } = payload;
            // Simulate heavy work
            await new Promise((resolve) => setTimeout(resolve, 3000));
            await audit_service_1.AuditService.record(mockReq, 'REPORT_GENERATION_COMPLETED', `Successfully generated ${reportType} report in the background`, payload.userId, payload.username);
            logger_1.Logger.info(`[Worker] Successfully completed report generation for ${reportType}`, correlation);
            return { success: true, reportType };
        }
        if (jobType === 'SEND_NOTIFICATION') {
            const { recipient, message } = payload;
            // Simulate notification dispatch delay
            await new Promise((resolve) => setTimeout(resolve, 1500));
            await audit_service_1.AuditService.record(mockReq, 'NOTIFICATION_SENT', `Sent notification to ${recipient}: ${message}`, payload.userId, payload.username);
            logger_1.Logger.info(`[Worker] Successfully sent notification to ${recipient}`, correlation);
            return { success: true, recipient };
        }
        throw new Error(`Unknown job type: ${jobType}`);
    }, {
        connection: exports.redisConnectionOptions,
        concurrency: 2,
    });
    worker.on('completed', (job) => {
        logger_1.Logger.info(`[Worker] Job ${job.id} completed successfully`);
    });
    worker.on('failed', (job, err) => {
        logger_1.Logger.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
    });
};
exports.initQueueWorker = initQueueWorker;
