import { Router } from 'express';
import { InkController } from './ink.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

// Formulas
router.post('/formulas', InkController.createFormula);
router.get('/formulas', InkController.listFormulas);
router.get('/formulas/exists', InkController.checkFormulaExists);
router.post('/formulas/batch/status', InkController.batchUpdateFormulaStatus);
router.post('/formulas/batch/delete', InkController.batchDeleteFormulas);
router.post('/formulas/batch/restore', InkController.batchRestoreFormulas);
router.delete('/formulas/trash/empty', InkController.emptyFormulaTrash);
router.post('/formulas/:code/restore', InkController.restoreFormula);
router.delete('/formulas/:code/permanent', InkController.permanentDeleteFormula);
router.get('/formulas/:code', InkController.getFormulaByCode);
router.put('/formulas/:code', InkController.updateFormula);
router.delete('/formulas/:code', InkController.deleteFormula);

// Batches
router.post('/batches', InkController.createBatch);
router.get('/batches', InkController.listBatches);
router.get('/batches/exists', InkController.checkBatchExists);
router.post('/batches/batch/delete', InkController.batchDeleteBatches);
router.post('/batches/batch/restore', InkController.batchRestoreBatches);
router.delete('/batches/trash/empty', InkController.emptyBatchTrash);
router.post('/batches/:id/restore', InkController.restoreBatch);
router.delete('/batches/:id/permanent', InkController.permanentDeleteBatch);
router.get('/batches/:id', InkController.getBatchById);
router.put('/batches/:id', InkController.updateBatch);
router.delete('/batches/:id', InkController.deleteBatch);

export default router;
