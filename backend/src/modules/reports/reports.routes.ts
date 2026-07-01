import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';
import { ReportsController } from './reports.controller';

const router = Router();

router.use(requireAuth);
router.use(requirePermission('reports:export'));

router.get('/', ReportsController.list);
router.get('/:id', ReportsController.getById);
router.post('/', ReportsController.create);
router.put('/:id', ReportsController.update);
router.delete('/:id', ReportsController.delete);
router.post('/:id/run', ReportsController.runNow);

export default router;
