import { Router } from 'express';
import { ProductController } from './product.controller';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

const router = Router();

router.use(requireAuth);

router.post('/', requirePermission('products:create'), ProductController.create);
router.get('/', requirePermission('products:read'), ProductController.list);
router.get('/exists', requirePermission('products:read'), ProductController.checkExists);
router.get('/:id', requirePermission('products:read'), ProductController.getById);
router.put('/:id', requirePermission('products:update'), ProductController.update);
router.delete('/:id', requirePermission('products:delete'), ProductController.delete);

export default router;
