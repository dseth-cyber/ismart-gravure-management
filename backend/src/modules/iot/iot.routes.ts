import { Router } from 'express';
import { IotController } from './iot.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

// Device registry
router.get('/devices', IotController.listDevices);
router.get('/devices/:id', IotController.getDevice);
router.post('/devices', IotController.upsertDevice);
router.delete('/devices/:id', IotController.deleteDevice);

// Telemetry
router.post('/telemetry', IotController.ingestTelemetry);
router.get('/telemetry', IotController.getTelemetry);
router.get('/telemetry/:deviceId/latest', IotController.getLatestTelemetry);

// MQTT publish
router.post('/publish', IotController.publishToDevice);

export default router;
