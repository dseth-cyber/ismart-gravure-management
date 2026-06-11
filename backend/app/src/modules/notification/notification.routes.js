"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Alert webhook (no auth - called by AlertManager)
router.post('/alert-webhook', notification_controller_1.NotificationController.alertWebhook);
// Authenticated routes
router.use(auth_1.requireAuth);
// Notification logs
router.get('/', notification_controller_1.NotificationController.list);
router.get('/logs', notification_controller_1.NotificationController.getLogs);
router.post('/logs/:id/retry', notification_controller_1.NotificationController.retryLog);
// Templates (admin)
router.get('/templates', notification_controller_1.NotificationController.listTemplates);
router.post('/templates', notification_controller_1.NotificationController.upsertTemplate);
router.delete('/templates/:type', notification_controller_1.NotificationController.deleteTemplate);
// User preferences
router.get('/prefs/me', notification_controller_1.NotificationController.getMyPrefs);
router.post('/prefs/me', notification_controller_1.NotificationController.upsertMyPref);
router.post('/prefs/me/bulk', notification_controller_1.NotificationController.bulkUpsertPrefs);
// Test notification
router.post('/test', notification_controller_1.NotificationController.sendTest);
exports.default = router;
