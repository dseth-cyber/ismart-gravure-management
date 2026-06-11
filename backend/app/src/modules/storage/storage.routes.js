"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const storage_controller_1 = require("./storage.controller");
const auth_1 = require("../../middleware/auth");
const env_1 = require("../../config/env");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: env_1.env.UPLOAD_MAX_SIZE },
});
const router = (0, express_1.Router)();
// All routes require auth
router.use(auth_1.requireAuth);
// Upload file
router.post('/upload', upload.single('file'), storage_controller_1.StorageController.upload);
// List files
router.get('/files', storage_controller_1.StorageController.list);
// Download file
router.get('/files/:id', storage_controller_1.StorageController.download);
// Delete file
router.delete('/files/:id', storage_controller_1.StorageController.delete);
// Get signed URL
router.get('/files/:id/url', storage_controller_1.StorageController.getSignedUrl);
exports.default = router;
