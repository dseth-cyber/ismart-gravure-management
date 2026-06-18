import { Router } from 'express';
import { CylinderController } from './cylinder.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', CylinderController.create);
router.get('/', CylinderController.list);
router.get('/exists', CylinderController.checkExists);
router.post('/batch/status', CylinderController.batchUpdateStatus);
router.post('/batch/delete', CylinderController.batchDelete);
router.post('/batch/restore', CylinderController.batchRestore);
router.delete('/trash/empty', CylinderController.emptyTrash);
router.get('/:id', CylinderController.getById);
router.put('/:id', CylinderController.update);
router.delete('/:id', CylinderController.delete);
router.post('/:id/restore', CylinderController.restore);
router.delete('/:id/permanent', CylinderController.permanentDelete);

export default router;
