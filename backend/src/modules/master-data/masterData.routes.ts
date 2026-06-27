import { Router } from 'express';
import { MasterDataController } from './masterData.controller';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

const router = Router();

router.use(requireAuth);

router.get('/exists', MasterDataController.checkExists);
router.delete('/trash/empty', requirePermission('settings:master.manage'), MasterDataController.emptyTrash);

router.post('/', requirePermission('settings:master.manage'), MasterDataController.create);
router.get('/', MasterDataController.list);
router.put('/:id', requirePermission('settings:master.manage'), MasterDataController.update);
router.delete('/:id', requirePermission('settings:master.manage'), MasterDataController.delete);
router.post('/:id/restore', requirePermission('settings:master.manage'), MasterDataController.restore);
router.delete('/:id/permanent', requirePermission('settings:master.manage'), MasterDataController.permanentDelete);

export default router;
