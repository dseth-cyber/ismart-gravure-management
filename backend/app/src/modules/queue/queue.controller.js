"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueController = void 0;
const queue_service_1 = require("./queue.service");
const logger_1 = require("../../utils/logger");
const audit_service_1 = require("../audit/audit.service");
class QueueController {
    static async triggerTestJob(req, res, next) {
        try {
            const { jobType, payload } = req.body;
            if (!jobType || !payload) {
                return res.status(400).json({ error: 'jobType and payload are required' });
            }
            if (jobType !== 'GENERATE_REPORT' && jobType !== 'SEND_NOTIFICATION') {
                return res.status(400).json({ error: 'Invalid jobType. Allowed: GENERATE_REPORT, SEND_NOTIFICATION' });
            }
            // Attach authenticated user identity to the payload for audit trail tracking in the worker
            const user = req.user;
            const jobPayload = {
                ...payload,
                userId: user?.userId || 'anonymous',
                username: user?.username || 'anonymous',
            };
            const correlationId = req.correlationId;
            // Enqueue job to the BullMQ system
            const job = await queue_service_1.jobsQueue.add(jobType, {
                jobType,
                payload: jobPayload,
                correlationId,
            });
            logger_1.Logger.info(`Enqueued background job ${job.id} of type ${jobType}`, correlationId);
            // Record audit log that the job has been queued
            await audit_service_1.AuditService.record(req, 'JOB_ENQUEUED', `Enqueued background job ${job.id} of type ${jobType} successfully`);
            return res.status(202).json({
                message: 'Job enqueued successfully',
                jobId: job.id,
                jobName: job.name,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.QueueController = QueueController;
