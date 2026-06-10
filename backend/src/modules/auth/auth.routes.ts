import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', requireAuth, AuthController.me);

export default router;
