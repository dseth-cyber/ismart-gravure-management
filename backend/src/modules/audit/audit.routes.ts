import { Router } from 'express';
import { AuditController } from './audit.controller';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

const router = Router();

// Protect audit logs list route with audit:read permission
router.get('/logs', requireAuth, requirePermission('audit:read'), AuditController.list);
router.post('/logs', requireAuth, AuditController.create);

export default router;
