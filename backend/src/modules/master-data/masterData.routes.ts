import { Router } from 'express';
import { MasterDataController } from './masterData.controller';
import { requireAuth, requireRoles } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/exists', MasterDataController.checkExists);
router.delete('/trash/empty', MasterDataController.emptyTrash);

router.post('/', requireRoles(['admin']), MasterDataController.create);
router.get('/', MasterDataController.list);
router.put('/:id', requireRoles(['admin']), MasterDataController.update);
router.delete('/:id', requireRoles(['admin']), MasterDataController.delete);
router.post('/:id/restore', requireRoles(['admin']), MasterDataController.restore);
router.delete('/:id/permanent', requireRoles(['admin']), MasterDataController.permanentDelete);

export default router;
