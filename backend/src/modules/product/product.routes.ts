import { Router } from 'express';
import { ProductController } from './product.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', ProductController.create);
router.get('/', ProductController.list);
router.get('/:id', ProductController.getById);
router.put('/:id', ProductController.update);
router.delete('/:id', ProductController.delete);

export default router;
