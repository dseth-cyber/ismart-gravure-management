import { Router } from 'express';
import { JobController } from './job.controller';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

const router = Router();

router.use(requireAuth);

router.post('/', requirePermission('jobs:create'), JobController.create);
router.get('/', requirePermission('jobs:read'), JobController.list);
router.post('/batch/status', requirePermission('jobs:status.update'), JobController.batchUpdateStatus);
router.post('/batch/delete', requirePermission('jobs:delete'), JobController.batchDelete);
router.post('/batch/restore', requirePermission('jobs:delete'), JobController.batchRestore);
router.delete('/trash/empty', requirePermission('jobs:delete'), JobController.emptyTrash);
router.get('/logs', requirePermission('jobs:read'), JobController.listLogs);

router.get('/:jobNumber', requirePermission('jobs:read'), JobController.getByJobNumber);
router.delete('/:jobNumber', requirePermission('jobs:delete'), JobController.delete);
router.post('/:jobNumber/restore', requirePermission('jobs:delete'), JobController.restore);
router.delete('/:jobNumber/permanent', requirePermission('jobs:delete'), JobController.permanentDelete);
router.put('/:jobNumber/status', requirePermission('jobs:status.update'), JobController.updateStatus);
router.post('/:jobNumber/verify', requirePermission('jobs:verify'), JobController.verify);
router.post('/:jobNumber/override', requirePermission('jobs:override'), JobController.override);
router.get('/:jobNumber/verification', requirePermission('jobs:read'), JobController.getVerification);
router.post('/:jobNumber/logs', requirePermission('jobs:log.run'), JobController.logProduction);
router.get('/:jobNumber/logs', requirePermission('jobs:read'), JobController.listLogs);

export default router;
