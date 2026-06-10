import http from 'http';
import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { initRealtime } from './modules/realtime/realtime';
import { NotificationService } from './modules/notification/notification.service';

const server = http.createServer(app);
initRealtime(server);

server.listen(env.PORT, () => {
  console.log(`=================================`);
  console.log(`  Gravure Backend Monolith Started`);
  console.log(`  Port: ${env.PORT}`);
  console.log(`  Env:  ${env.NODE_ENV}`);
  console.log(`=================================`);
});

// Periodic notification emission every 5 minutes
setInterval(() => {
  NotificationService.emitNotifications().catch(err => {
    console.error('[Notifications] Periodic check failed:', err);
  });
}, 5 * 60 * 1000);

// Also emit on startup after a short delay
setTimeout(() => {
  NotificationService.emitNotifications().catch(err => {
    console.error('[Notifications] Initial check failed:', err);
  });
}, 3000);

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
