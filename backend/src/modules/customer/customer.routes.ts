import { Router } from 'express';
import { CustomerController } from './customer.controller';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

const router = Router();

router.use(requireAuth);

router.post('/', requirePermission('customers:create'), CustomerController.create);
router.get('/', requirePermission('customers:read'), CustomerController.list);
router.get('/exists', requirePermission('customers:read'), CustomerController.checkExists);
router.get('/:id', requirePermission('customers:read'), CustomerController.getById);
router.put('/:id', requirePermission('customers:update'), CustomerController.update);
router.delete('/:id', requirePermission('customers:delete'), CustomerController.delete);

export default router;
