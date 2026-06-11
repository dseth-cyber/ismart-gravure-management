"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notification_service_1 = require("./notification.service");
const template_service_1 = require("./template.service");
const pref_service_1 = require("./pref.service");
class NotificationController {
    static async list(req, res, next) {
        try {
            const result = await notification_service_1.NotificationService.getLogs();
            return res.status(200).json({ status: 'success', statusCode: 200, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    // Templates
    static async listTemplates(req, res, next) {
        try {
            const templates = await template_service_1.TemplateService.list();
            return res.status(200).json({ status: 'success', statusCode: 200, data: templates });
        }
        catch (error) {
            next(error);
        }
    }
    static async upsertTemplate(req, res, next) {
        try {
            const template = await template_service_1.TemplateService.upsert(req.body);
            return res.status(200).json({ status: 'success', statusCode: 200, data: template });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteTemplate(req, res, next) {
        try {
            await template_service_1.TemplateService.remove(String(req.params.type));
            return res.status(200).json({ status: 'success', statusCode: 200, message: 'Template deleted' });
        }
        catch (error) {
            next(error);
        }
    }
    // Preferences
    static async getMyPrefs(req, res, next) {
        try {
            const prefs = await pref_service_1.NotificationPrefService.getUserPrefs(req.user.userId);
            return res.status(200).json({ status: 'success', statusCode: 200, data: prefs });
        }
        catch (error) {
            next(error);
        }
    }
    static async upsertMyPref(req, res, next) {
        try {
            const pref = await pref_service_1.NotificationPrefService.upsert({ userId: req.user.userId, ...req.body });
            return res.status(200).json({ status: 'success', statusCode: 200, data: pref });
        }
        catch (error) {
            next(error);
        }
    }
    static async bulkUpsertPrefs(req, res, next) {
        try {
            const prefs = await pref_service_1.NotificationPrefService.bulkUpsert(req.user.userId, req.body.prefs || []);
            return res.status(200).json({ status: 'success', statusCode: 200, data: prefs });
        }
        catch (error) {
            next(error);
        }
    }
    // Alert webhook (no auth - called by AlertManager)
    static async alertWebhook(req, res, next) {
        try {
            const body = req.body;
            const alerts = body.alerts || [];
            await notification_service_1.NotificationService.handleAlertWebhook(alerts);
            return res.status(200).json({ status: 'success', statusCode: 200, message: `Processed ${alerts.length} alerts` });
        }
        catch (error) {
            next(error);
        }
    }
    // Logs
    static async getLogs(req, res, next) {
        try {
            const limit = parseInt(String(req.query.limit || '100'), 10);
            const offset = parseInt(String(req.query.offset || '0'), 10);
            const logs = await notification_service_1.NotificationService.getLogs(limit, offset);
            return res.status(200).json({ status: 'success', statusCode: 200, data: logs });
        }
        catch (error) {
            next(error);
        }
    }
    static async retryLog(req, res, next) {
        try {
            await notification_service_1.NotificationService.retryFailed(String(req.params.id));
            return res.status(200).json({ status: 'success', statusCode: 200, message: 'Retry initiated' });
        }
        catch (error) {
            next(error);
        }
    }
    // Send test notification (manual trigger)
    static async sendTest(req, res, next) {
        try {
            const { type, variables } = req.body;
            await notification_service_1.NotificationService.send(type || 'test', req.user.userId, variables || { test: true, username: req.user.username });
            return res.status(200).json({ status: 'success', statusCode: 200, message: 'Notification sent' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.NotificationController = NotificationController;
