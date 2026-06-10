export interface AuditLogDto {
  id: string;
  action: string;
  userId: string | null;
  username: string | null;
  details: string;
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string | null;
  createdAt: Date | string;
}

export interface SystemHealthDto {
  status: 'healthy' | 'unhealthy';
  database: 'connected' | 'disconnected';
  redis: 'connected' | 'disconnected';
  uptime: number;
  cpuUsage: {
    system: number;
    user: number;
  };
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  timestamp: string;
}
