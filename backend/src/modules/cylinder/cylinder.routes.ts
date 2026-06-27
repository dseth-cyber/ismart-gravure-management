import { Router } from 'express';
import { CylinderController } from './cylinder.controller';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

const router = Router();

router.use(requireAuth);

router.post('/', requirePermission('cylinders:create'), CylinderController.create);
router.get('/', requirePermission('cylinders:read'), CylinderController.list);
router.get('/exists', requirePermission('cylinders:read'), CylinderController.checkExists);
router.post('/batch/status', requirePermission('cylinders:status.update'), CylinderController.batchUpdateStatus);
router.post('/batch/delete', requirePermission('cylinders:delete'), CylinderController.batchDelete);
router.post('/batch/restore', requirePermission('cylinders:delete'), CylinderController.batchRestore);
router.delete('/trash/empty', requirePermission('cylinders:delete'), CylinderController.emptyTrash);
router.get('/:id', requirePermission('cylinders:read'), CylinderController.getById);
router.put('/:id', requirePermission('cylinders:update'), CylinderController.update);
router.delete('/:id', requirePermission('cylinders:delete'), CylinderController.delete);
router.post('/:id/restore', requirePermission('cylinders:delete'), CylinderController.restore);
router.delete('/:id/permanent', requirePermission('cylinders:delete'), CylinderController.permanentDelete);

export default router;
