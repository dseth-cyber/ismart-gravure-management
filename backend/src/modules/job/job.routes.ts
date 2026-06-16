import { Router } from 'express';
import { JobController } from './job.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', JobController.create);
router.get('/', JobController.list);
router.delete('/trash/empty', JobController.emptyTrash);
router.get('/logs', JobController.listLogs);

router.get('/:jobNumber', JobController.getByJobNumber);
router.delete('/:jobNumber', JobController.delete);
router.post('/:jobNumber/restore', JobController.restore);
router.delete('/:jobNumber/permanent', JobController.permanentDelete);
router.put('/:jobNumber/status', JobController.updateStatus);
router.post('/:jobNumber/verify', JobController.verify);
router.post('/:jobNumber/override', JobController.override);
router.get('/:jobNumber/verification', JobController.getVerification);
router.post('/:jobNumber/logs', JobController.logProduction);
router.get('/:jobNumber/logs', JobController.listLogs);

export default router;
