import { Request, Response, NextFunction } from 'express';
import { jobsQueue } from './queue.service';
import { Logger } from '../../utils/logger';
import { AuditService } from '../audit/audit.service';

export class QueueController {
  static async triggerTestJob(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { jobType, payload } = req.body;

      if (!jobType || !payload) {
        return res.status(400).json({ error: 'jobType and payload are required' });
      }

      if (jobType !== 'GENERATE_REPORT' && jobType !== 'SEND_NOTIFICATION') {
        return res.status(400).json({ error: 'Invalid jobType. Allowed: GENERATE_REPORT, SEND_NOTIFICATION' });
      }

      // Attach authenticated user identity to the payload for audit trail tracking in the worker
      const user = (req as any).user;
      const jobPayload = {
        ...payload,
        userId: user?.userId || 'anonymous',
        username: user?.username || 'anonymous',
      };

      const correlationId = req.correlationId;

      // Enqueue job to the BullMQ system
      const job = await jobsQueue.add(jobType, {
        jobType,
        payload: jobPayload,
        correlationId,
      });

      Logger.info(`Enqueued background job ${job.id} of type ${jobType}`, correlationId);

      // Record audit log that the job has been queued
      await AuditService.record(
        req,
        'JOB_ENQUEUED',
        `Enqueued background job ${job.id} of type ${jobType} successfully`
      );

      return res.status(202).json({
        message: 'Job enqueued successfully',
        jobId: job.id,
        jobName: job.name,
      });
    } catch (error) {
      next(error);
    }
  }
}
