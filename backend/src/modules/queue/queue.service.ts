import { Queue, Worker, Job } from 'bullmq';
import { Logger } from '../../utils/logger';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';

// Setup connection options for BullMQ
// BullMQ requires maxRetriesPerRequest to be null
let host = 'redis';
let port = 6379;
try {
  const parsed = new URL(redisUrl);
  host = parsed.hostname || host;
  port = parsed.port ? parseInt(parsed.port, 10) : port;
} catch (e) {
  // ignore
}

export const redisConnectionOptions = {
  host,
  port,
  maxRetriesPerRequest: null,
};

export const jobsQueue = new Queue('gravure-jobs', {
  connection: redisConnectionOptions,
});

let worker: Worker | null = null;

export const initQueueWorker = () => {
  if (worker) return;

  Logger.info('Initializing BullMQ Background Worker...');

  worker = new Worker(
    'gravure-jobs',
    async (job: Job) => {
      const { jobType, payload, correlationId } = job.data;
      const correlation = correlationId || `job-${job.id}`;

      Logger.info(`[Worker] Started processing job ${job.id} of type ${jobType}`, correlation);

      // Create a mock request object so the AuditService can properly capture correlationId and logging context
      const mockReq = {
        correlationId: correlation,
        headers: { 'user-agent': 'background-worker' },
        ip: '127.0.0.1',
        user: {
          userId: payload.userId || 'system',
          username: payload.username || 'background-worker',
        },
      } as unknown as Request;

      if (jobType === 'GENERATE_REPORT') {
        const { reportType } = payload;
        // Simulate heavy work
        await new Promise((resolve) => setTimeout(resolve, 3000));

        await AuditService.record(
          mockReq,
          'REPORT_GENERATION_COMPLETED',
          `Successfully generated ${reportType} report in the background`,
          payload.userId,
          payload.username
        );

        Logger.info(`[Worker] Successfully completed report generation for ${reportType}`, correlation);
        return { success: true, reportType };
      }

      if (jobType === 'SEND_NOTIFICATION') {
        const { recipient, message } = payload;
        // Simulate notification dispatch delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        await AuditService.record(
          mockReq,
          'NOTIFICATION_SENT',
          `Sent notification to ${recipient}: ${message}`,
          payload.userId,
          payload.username
        );

        Logger.info(`[Worker] Successfully sent notification to ${recipient}`, correlation);
        return { success: true, recipient };
      }

      throw new Error(`Unknown job type: ${jobType}`);
    },
    {
      connection: redisConnectionOptions,
      concurrency: 2,
    }
  );

  worker.on('completed', (job) => {
    Logger.info(`[Worker] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    Logger.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
  });
};
