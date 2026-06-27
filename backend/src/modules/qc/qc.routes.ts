import { Router } from 'express';
import { QcController } from './qc.controller';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

const router = Router();

router.use(requireAuth);

router.get('/inspections', requirePermission('qc:read'), QcController.listInspections);
router.get('/inspections/:id', requirePermission('qc:read'), QcController.getInspectionById);
router.delete('/inspections/:id', requirePermission('qc:approve'), QcController.deleteInspection);
router.post('/inspections/:jobNumber', requirePermission('qc:create'), QcController.createInspection);
router.get('/inspections/job/:jobNumber', requirePermission('qc:read'), QcController.listInspectionsByJobNumber);

router.get('/traceability', requirePermission('qc:read'), QcController.getTraceability);

export default router;
