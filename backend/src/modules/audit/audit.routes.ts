import { Router } from 'express';
import { AuditController } from './audit.controller';
import { requireAuth, requireRoles } from '../../middleware/auth';

const router = Router();

// Only admin role is authorized to view system audit logs
router.get('/logs', requireAuth, requireRoles(['admin']), AuditController.list);

export default router;
