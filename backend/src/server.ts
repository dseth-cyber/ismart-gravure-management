import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';

const server = app.listen(env.PORT, () => {
  console.log(`=================================`);
  console.log(`  Gravure Backend Monolith Started`);
  console.log(`  Port: ${env.PORT}`);
  console.log(`  Env:  ${env.NODE_ENV}`);
  console.log(`=================================`);
});

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
