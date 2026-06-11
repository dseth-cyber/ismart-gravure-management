"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const iot_controller_1 = require("./iot.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Device registry
router.get('/devices', iot_controller_1.IotController.listDevices);
router.get('/devices/:id', iot_controller_1.IotController.getDevice);
router.post('/devices', iot_controller_1.IotController.upsertDevice);
router.delete('/devices/:id', iot_controller_1.IotController.deleteDevice);
// Telemetry
router.post('/telemetry', iot_controller_1.IotController.ingestTelemetry);
router.get('/telemetry', iot_controller_1.IotController.getTelemetry);
router.get('/telemetry/:deviceId/latest', iot_controller_1.IotController.getLatestTelemetry);
// MQTT publish
router.post('/publish', iot_controller_1.IotController.publishToDevice);
exports.default = router;
