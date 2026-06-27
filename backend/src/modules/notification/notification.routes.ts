import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

const router = Router();

// Alert webhook (no auth - called by AlertManager)
router.post('/alert-webhook', NotificationController.alertWebhook);

// Authenticated routes
router.use(requireAuth);

// Notification logs
router.get('/', NotificationController.list);
router.get('/logs', NotificationController.getLogs);
router.post('/logs/:id/retry', NotificationController.retryLog);

// Templates (admin)
router.get('/templates', requirePermission('notifications:settings.manage'), NotificationController.listTemplates);
router.post('/templates', requirePermission('notifications:settings.manage'), NotificationController.upsertTemplate);
router.delete('/templates/:type', requirePermission('notifications:settings.manage'), NotificationController.deleteTemplate);

// User preferences
router.get('/prefs/me', NotificationController.getMyPrefs);
router.post('/prefs/me', NotificationController.upsertMyPref);
router.post('/prefs/me/bulk', NotificationController.bulkUpsertPrefs);

// Test notification
router.post('/test', requirePermission('notifications:settings.manage'), NotificationController.sendTest);

export default router;
