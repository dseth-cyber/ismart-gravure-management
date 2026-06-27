import { Router } from 'express';
import { WorkflowController } from './workflow.controller';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

const router = Router();

router.use(requireAuth);

// Pending approvals — available to all authenticated users
router.get('/pending', WorkflowController.getPendingApprovals);

// Instance actions — for participants
router.get('/instances', WorkflowController.listInstances);
router.post('/instances', requirePermission('jobs:verify'), WorkflowController.startInstance);
router.get('/instances/:id', WorkflowController.getInstance);
router.post('/instances/:id/approve', WorkflowController.approve);
router.post('/instances/:id/reject', WorkflowController.reject);
router.post('/instances/:id/cancel', WorkflowController.cancel);

// Definition management — admin only
router.get('/definitions', WorkflowController.listDefinitions);
router.get('/definitions/:id', WorkflowController.getDefinition);
router.post('/definitions', requirePermission('workflows:approvals.manage'), WorkflowController.createDefinition);
router.put('/definitions/:id', requirePermission('workflows:approvals.manage'), WorkflowController.updateDefinition);

export default router;
