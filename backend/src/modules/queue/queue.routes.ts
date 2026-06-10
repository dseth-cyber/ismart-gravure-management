import { Router } from 'express';
import { QueueController } from './queue.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// Route to trigger background jobs
router.post('/test-job', requireAuth, QueueController.triggerTestJob);

export default router;
