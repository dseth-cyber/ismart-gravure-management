import { Router } from 'express';
import { OrderController } from './order.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', OrderController.create);
router.get('/', OrderController.list);
router.get('/:id', OrderController.getById);
router.put('/:id', OrderController.updateStatus);
router.delete('/:id', OrderController.delete);

export default router;
