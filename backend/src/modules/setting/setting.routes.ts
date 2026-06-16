import { Router } from 'express';
import { SettingController } from './setting.controller';
import { requireAuth, requireRoles } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', SettingController.getSettings);
router.put('/', requireRoles(['admin']), SettingController.saveSetting);

export default router;
