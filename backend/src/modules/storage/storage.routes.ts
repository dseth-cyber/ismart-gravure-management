import { Router } from 'express';
import multer from 'multer';
import { StorageController } from './storage.controller';
import { requireAuth } from '../../middleware/auth';
import { env } from '../../config/env';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.UPLOAD_MAX_SIZE },
});

const router = Router();

// All routes require auth
router.use(requireAuth);

// Upload file
router.post('/upload', upload.single('file'), StorageController.upload);

// List files
router.get('/files', StorageController.list);

// Download file
router.get('/files/:id', StorageController.download);

// Delete file
router.delete('/files/:id', StorageController.delete);

// Get signed URL
router.get('/files/:id/url', StorageController.getSignedUrl);

export default router;
