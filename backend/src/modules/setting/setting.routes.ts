import { Router } from 'express';
import { SettingController } from './setting.controller';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

const router = Router();

router.use(requireAuth);

router.get('/', SettingController.getSettings);
router.put('/', requirePermission('settings:system.manage'), SettingController.saveSetting);

export default router;
