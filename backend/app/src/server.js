"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const realtime_1 = require("./modules/realtime/realtime");
const notification_service_1 = require("./modules/notification/notification.service");
const cleanup_service_1 = require("./modules/cleanup/cleanup.service");
const server = http_1.default.createServer(app_1.default);
(0, realtime_1.initRealtime)(server);
server.listen(env_1.env.PORT, () => {
    console.log(`=================================`);
    console.log(`  Gravure Backend Monolith Started`);
    console.log(`  Port: ${env_1.env.PORT}`);
    console.log(`  Env:  ${env_1.env.NODE_ENV}`);
    console.log(`=================================`);
});
// Periodic notification emission every 5 minutes
setInterval(() => {
    notification_service_1.NotificationService.checkAndEmit().catch(err => {
        console.error('[Notifications] Periodic check failed:', err);
    });
}, 5 * 60 * 1000);
// Also emit on startup after a short delay
setTimeout(() => {
    notification_service_1.NotificationService.checkAndEmit().catch(err => {
        console.error('[Notifications] Initial check failed:', err);
    });
}, 3000);
// Daily data retention cleanup
setInterval(async () => {
    try {
        const result = await cleanup_service_1.CleanupService.runAll();
        if (result.auditLogs > 0 || result.refreshTokens > 0) {
            console.log(`[Cleanup] Purged ${result.auditLogs} audit logs, ${result.refreshTokens} expired refresh tokens`);
        }
    }
    catch (err) {
        console.error('[Cleanup] Failed:', err);
    }
}, 24 * 60 * 60 * 1000);
const gracefulShutdown = async () => {
    console.log('Received kill signal, shutting down gracefully...');
    server.close(async () => {
        console.log('HTTP server closed.');
        await database_1.prisma.$disconnect();
        console.log('Database connection closed.');
        process.exit(0);
    });
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
