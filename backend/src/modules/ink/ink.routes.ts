import { Router } from 'express';
import { InkController } from './ink.controller';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

const router = Router();

router.use(requireAuth);

// Formulas
router.post('/formulas', requirePermission('inks:create'), InkController.createFormula);
router.get('/formulas', requirePermission('inks:read'), InkController.listFormulas);
router.get('/formulas/exists', requirePermission('inks:read'), InkController.checkFormulaExists);
router.post('/formulas/batch/status', requirePermission('inks:formulas.manage'), InkController.batchUpdateFormulaStatus);
router.post('/formulas/batch/delete', requirePermission('inks:delete'), InkController.batchDeleteFormulas);
router.post('/formulas/batch/restore', requirePermission('inks:delete'), InkController.batchRestoreFormulas);
router.delete('/formulas/trash/empty', requirePermission('inks:delete'), InkController.emptyFormulaTrash);
router.post('/formulas/:code/restore', requirePermission('inks:delete'), InkController.restoreFormula);
router.delete('/formulas/:code/permanent', requirePermission('inks:delete'), InkController.permanentDeleteFormula);
router.get('/formulas/:code', requirePermission('inks:read'), InkController.getFormulaByCode);
router.put('/formulas/:code', requirePermission('inks:update'), InkController.updateFormula);
router.delete('/formulas/:code', requirePermission('inks:delete'), InkController.deleteFormula);

// Batches
router.post('/batches', requirePermission('inks:create'), InkController.createBatch);
router.get('/batches', requirePermission('inks:read'), InkController.listBatches);
router.get('/batches/exists', requirePermission('inks:read'), InkController.checkBatchExists);
router.post('/batches/batch/delete', requirePermission('inks:delete'), InkController.batchDeleteBatches);
router.post('/batches/batch/restore', requirePermission('inks:delete'), InkController.batchRestoreBatches);
router.delete('/batches/trash/empty', requirePermission('inks:delete'), InkController.emptyBatchTrash);
router.post('/batches/:id/restore', requirePermission('inks:delete'), InkController.restoreBatch);
router.delete('/batches/:id/permanent', requirePermission('inks:delete'), InkController.permanentDeleteBatch);
router.get('/batches/:id', requirePermission('inks:read'), InkController.getBatchById);
router.put('/batches/:id', requirePermission('inks:update'), InkController.updateBatch);
router.delete('/batches/:id', requirePermission('inks:delete'), InkController.deleteBatch);

export default router;
