import { Router } from 'express';
import { CylinderController } from './cylinder.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', CylinderController.create);
router.get('/', CylinderController.list);
router.get('/:id', CylinderController.getById);
router.put('/:id', CylinderController.update);
router.delete('/:id', CylinderController.delete);

export default router;
