import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { env } from '../../config/env';

let io: Server | null = null;

export async function initRealtime(httpServer: HttpServer): Promise<Server> {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const pubClient = new Redis(env.REDIS_URL, { lazyConnect: true });
  const subClient = new Redis(env.REDIS_URL, { lazyConnect: true });
  await Promise.all([pubClient.connect(), subClient.connect()]);

  io.adapter(createAdapter(pubClient, subClient));

  io.on('connection', (socket) => {
    console.log(`[Realtime] Client connected: ${socket.id}`);

    socket.on('subscribe:job', (jobNumber: string) => {
      socket.join(`job:${jobNumber}`);
    });

    socket.on('unsubscribe:job', (jobNumber: string) => {
      socket.leave(`job:${jobNumber}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Realtime] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function emitEvent(event: string, data: any): void {
  if (io) {
    io.emit(event, data);
  }
}

export function emitToJob(jobNumber: string, event: string, data: any): void {
  if (io) {
    io.to(`job:${jobNumber}`).emit(event, data);
  }
}
