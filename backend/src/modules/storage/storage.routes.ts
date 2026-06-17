import { Router } from 'express';
import multer from 'multer';
import { StorageController } from './storage.controller';
import { requireAuth } from '../../middleware/auth';
import { env } from '../../config/env';
import { AppError } from '../../middleware/error';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.UPLOAD_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new AppError(`File type ${file.mimetype} is not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`, 400));
    }
    cb(null, true);
  },
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
