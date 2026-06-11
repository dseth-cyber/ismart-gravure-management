"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const database_1 = require("../../config/database");
const providers_1 = require("./providers");
const template_service_1 = require("./template.service");
const pref_service_1 = require("./pref.service");
const providers = {
    websocket: new providers_1.WebSocketProvider(),
    email: new providers_1.SmtpProvider(),
    line: new providers_1.LineProvider(),
    telegram: new providers_1.TelegramProvider(),
};
class NotificationService {
    static async send(type, userId, variables, language = 'en') {
        const rendered = await template_service_1.TemplateService.render(type, variables, language);
        if (!rendered)
            return;
        const prefs = await pref_service_1.NotificationPrefService.getUserPrefs(userId);
        const user = await database_1.prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
        for (const pref of prefs) {
            if (!pref.enabled)
                continue;
            if (pref_service_1.NotificationPrefService.isInQuietHours(pref))
                continue;
            const provider = providers[pref.channel];
            if (!provider)
                continue;
            const message = {
                to: pref.address || userId,
                subject: rendered.subject,
                body: rendered.body,
                type,
                userId,
            };
            const log = await database_1.prisma.notificationLog.create({
                data: { userId, channel: pref.channel, type, subject: rendered.subject, body: rendered.body, status: 'pending', retryCount: 0, maxRetries: 3 },
            });
            await this.deliverWithRetry(log.id, provider, message);
        }
        // Always send WebSocket notification regardless of prefs
        try {
            const ws = new providers_1.WebSocketProvider();
            await ws.send({ to: userId, subject: rendered.subject, body: rendered.body, type, userId });
        }
        catch { }
    }
    static async deliverWithRetry(logId, provider, message, attempt = 0) {
        const log = await database_1.prisma.notificationLog.findUnique({ where: { id: logId } });
        if (!log || log.status === 'sent')
            return;
        const result = await provider.send(message);
        if (result.success) {
            await database_1.prisma.notificationLog.update({ where: { id: logId }, data: { status: 'sent', sentAt: new Date(), error: null } });
        }
        else {
            const nextAttempt = attempt + 1;
            if (nextAttempt < log.maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, nextAttempt), 30000); // exponential backoff
                await database_1.prisma.notificationLog.update({
                    where: { id: logId },
                    data: { retryCount: nextAttempt, error: result.error, nextRetryAt: new Date(Date.now() + delay) },
                });
                await new Promise(r => setTimeout(r, delay));
                await this.deliverWithRetry(logId, provider, message, nextAttempt);
            }
            else {
                await database_1.prisma.notificationLog.update({
                    where: { id: logId },
                    data: { status: 'failed', error: result.error, retryCount: nextAttempt },
                });
            }
        }
    }
    static async handleAlertWebhook(alerts) {
        for (const alert of alerts) {
            const status = alert.status || 'firing';
            const labels = alert.labels || {};
            const annotations = alert.annotations || {};
            const templateType = 'alert';
            // Create template variables from alert data
            const variables = {
                alertName: labels.alertname || 'Unknown',
                severity: labels.severity || 'warning',
                summary: annotations.summary || '',
                description: annotations.description || '',
                status,
                startsAt: alert.startsAt || new Date().toISOString(),
                instance: labels.instance || 'unknown',
            };
            // Send to all admin users
            const admins = await database_1.prisma.user.findMany({ where: { OR: [{ role: 'admin' }] }, select: { id: true, username: true } });
            for (const admin of admins) {
                await this.send(templateType, admin.id, variables);
            }
        }
    }
    static async getLogs(limit = 100, offset = 0) {
        return database_1.prisma.notificationLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit, skip: offset });
    }
    static async checkAndEmit() {
        try {
            const { prisma } = await Promise.resolve().then(() => __importStar(require('../../config/database')));
            const { emitEvent } = await Promise.resolve().then(() => __importStar(require('../realtime/realtime')));
            const now = new Date();
            const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const [batches, cylinders] = await Promise.all([
                prisma.inkBatch.findMany({ where: { expiryDate: { lte: sevenDaysLater }, status: { not: 'expired' } }, orderBy: { expiryDate: 'asc' } }),
                prisma.cylinder.findMany({ where: { OR: [{ status: 'repair' }, { status: 'hold' }, { meter: { gte: 50000 } }] }, orderBy: { meter: 'desc' } }),
            ]);
            const notifications = [];
            for (const b of batches) {
                const expired = new Date(b.expiryDate) < now;
                const daysLeft = Math.ceil((new Date(b.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                notifications.push({
                    id: `ink-${b.id}`, type: 'ink_expiry', severity: expired ? 'high' : daysLeft <= 2 ? 'high' : 'medium',
                    title: expired ? 'Ink Batch Expired' : 'Ink Batch Near Expiry',
                    message: expired ? `Batch ${b.id} (${b.color}) expired on ${new Date(b.expiryDate).toLocaleDateString()}` : `Batch ${b.id} (${b.color}) expires in ${daysLeft} day(s)`,
                    resourceId: b.id, createdAt: now.toISOString(),
                });
            }
            for (const c of cylinders) {
                const needsRepair = c.status === 'repair' || c.status === 'hold';
                notifications.push({
                    id: `cyl-${c.id}`, type: 'cylinder_maintenance', severity: needsRepair ? 'high' : 'medium',
                    title: needsRepair ? 'Cylinder Needs Repair' : 'Cylinder High Meter',
                    message: needsRepair ? `Cylinder ${c.id} (${c.colorName}) status: ${c.status}` : `Cylinder ${c.id} (${c.colorName}) has ${c.meter.toLocaleString()}m`,
                    resourceId: c.id, createdAt: now.toISOString(),
                });
            }
            if (notifications.length > 0) {
                emitEvent('notification:alerts', notifications);
            }
        }
        catch { }
    }
    static async retryFailed(logId) {
        const log = await database_1.prisma.notificationLog.findUnique({ where: { id: logId } });
        if (!log || log.status !== 'failed')
            return;
        const provider = providers[log.channel];
        if (!provider)
            return;
        await database_1.prisma.notificationLog.update({ where: { id: logId }, data: { status: 'pending', retryCount: 0, error: null, nextRetryAt: null } });
        await this.deliverWithRetry(logId, provider, { to: log.userId || '', subject: log.subject, body: log.body, type: log.type, userId: log.userId || undefined });
    }
}
exports.NotificationService = NotificationService;
