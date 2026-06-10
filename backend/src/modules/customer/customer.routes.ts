import { Router } from 'express';
import { CustomerController } from './customer.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', CustomerController.create);
router.get('/', CustomerController.list);
router.get('/:id', CustomerController.getById);
router.put('/:id', CustomerController.update);
router.delete('/:id', CustomerController.delete);

export default router;
