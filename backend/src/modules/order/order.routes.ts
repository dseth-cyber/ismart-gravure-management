import { Router } from 'express';
import { OrderController } from './order.controller';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

const router = Router();

router.use(requireAuth);

router.post('/', requirePermission('orders:create'), OrderController.create);
router.get('/', requirePermission('orders:read'), OrderController.list);
router.get('/:id', requirePermission('orders:read'), OrderController.getById);
router.put('/:id', requirePermission('orders:update'), OrderController.updateStatus);
router.delete('/:id', requirePermission('orders:delete'), OrderController.delete);

export default router;
