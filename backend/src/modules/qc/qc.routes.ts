import { Router } from 'express';
import { QcController } from './qc.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/inspections', QcController.listInspections);
router.get('/inspections/:id', QcController.getInspectionById);
router.delete('/inspections/:id', QcController.deleteInspection);
router.post('/inspections/:jobNumber', QcController.createInspection);
router.get('/inspections/job/:jobNumber', QcController.listInspectionsByJobNumber);

router.get('/traceability', QcController.getTraceability);

export default router;
