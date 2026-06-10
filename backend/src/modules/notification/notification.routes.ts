import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../auth/auth.middleware';

const router = Router();

router.get('/', authenticate, NotificationController.list);

export default router;
