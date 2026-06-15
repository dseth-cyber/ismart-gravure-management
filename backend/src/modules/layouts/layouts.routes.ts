import { Router } from 'express';
import { LayoutController } from './layouts.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/default', LayoutController.getDefault);
router.put('/default', LayoutController.saveDefault);
router.get('/me', LayoutController.getMyLayout);
router.put('/me', LayoutController.saveMyLayout);
router.delete('/me', LayoutController.deleteMyLayout);

export default router;
