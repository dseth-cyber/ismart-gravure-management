import { Router } from 'express';
import { LayoutController } from './layouts.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

// Single default (backward compat)
router.get('/default', LayoutController.getDefault);
router.put('/default', LayoutController.saveDefault);

// Named defaults (admin)
router.get('/defaults', LayoutController.listDefaults);
router.get('/defaults/:name', LayoutController.getDefaultByName);
router.put('/defaults/:name', LayoutController.saveDefaultByName);

// Single user layout (backward compat)
router.get('/me', LayoutController.getMyLayout);
router.put('/me', LayoutController.saveMyLayout);
router.delete('/me', LayoutController.deleteMyLayout);

// Named user layouts
router.get('/me/list', LayoutController.listMyLayouts);
router.get('/me/:name', LayoutController.getMyLayoutByName);
router.put('/me/:name', LayoutController.saveMyLayoutByName);
router.delete('/me/:name', LayoutController.deleteMyLayoutByName);

export default router;