import http from 'http';
import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { initRealtime } from './modules/realtime/realtime';
import { NotificationService } from './modules/notification/notification.service';
import { CleanupService } from './modules/cleanup/cleanup.service';
import { ReportsService } from './modules/reports/reports.service';

const server = http.createServer(app);
initRealtime(server).catch(err => {
  console.error('[Realtime] Failed to initialize:', err);
});

server.listen(env.PORT, () => {
  console.log(`=================================`);
  console.log(`  Gravure Backend Monolith Started`);
  console.log(`  Port: ${env.PORT}`);
  console.log(`  Env:  ${env.NODE_ENV}`);
  console.log(`=================================`);
});

// Periodic notification emission every 5 minutes
setInterval(() => {
  NotificationService.checkAndEmit().catch(err => {
    console.error('[Notifications] Periodic check failed:', err);
  });
}, 5 * 60 * 1000);

// Also emit on startup after a short delay
setTimeout(() => {
  NotificationService.checkAndEmit().catch(err => {
    console.error('[Notifications] Initial check failed:', err);
  });
}, 3000);

// Check scheduled reports every minute
setInterval(async () => {
  try {
    await ReportsService.checkAndRunDue();
  } catch (err) {
    console.error('[Reports] Periodic check failed:', err);
  }
}, 60 * 1000);

// Daily data retention cleanup
setInterval(async () => {
  try {
    const result = await CleanupService.runAll();
    if (result.auditLogs > 0 || result.refreshTokens > 0) {
      console.log(`[Cleanup] Purged ${result.auditLogs} audit logs, ${result.refreshTokens} expired refresh tokens`);
    }
  } catch (err) {
    console.error('[Cleanup] Failed:', err);
  }
}, 24 * 60 * 60 * 1000);

const gracefulShutdown = async (): Promise<void> => {
  console.log('Received kill signal, shutting down gracefully...');
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
