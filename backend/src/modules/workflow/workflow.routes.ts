import { Router } from 'express';
import { WorkflowController } from './workflow.controller';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

const router = Router();

router.use(requireAuth);

// Pending approvals — require approvals:read
router.get('/pending', requirePermission('approvals:read'), WorkflowController.getPendingApprovals);

// Instance actions — for participants
router.get('/instances', requirePermission('approvals:read'), WorkflowController.listInstances);
router.post('/instances', requirePermission('jobs:verify'), WorkflowController.startInstance);
router.get('/instances/:id', requirePermission('approvals:read'), WorkflowController.getInstance);
router.post('/instances/:id/approve', requirePermission('approvals:read'), WorkflowController.approve);
router.post('/instances/:id/reject', requirePermission('approvals:read'), WorkflowController.reject);
router.post('/instances/:id/cancel', requirePermission('approvals:read'), WorkflowController.cancel);

// Definition management — only approval matrix managers
router.get('/definitions', requirePermission('workflows:approvals.manage'), WorkflowController.listDefinitions);
router.get('/definitions/:id', requirePermission('workflows:approvals.manage'), WorkflowController.getDefinition);
router.post('/definitions', requirePermission('workflows:approvals.manage'), WorkflowController.createDefinition);
router.put('/definitions/:id', requirePermission('workflows:approvals.manage'), WorkflowController.updateDefinition);

export default router;
