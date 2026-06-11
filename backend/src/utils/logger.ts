import { env } from '../config/env';

export class Logger {
  private static format(level: string, message: string, correlationId?: string, meta?: any) {
    const timestamp = new Date().toISOString();
    if (env.NODE_ENV === 'production' || env.LOG_FORMAT === 'json') {
      return JSON.stringify({
        timestamp,
        level,
        message,
        correlationId: correlationId || null,
        meta: meta || {}
      });
    } else {
      const color = 
        level === 'error' ? '\x1b[31m' :
        level === 'warn' ? '\x1b[33m' :
        level === 'info' ? '\x1b[32m' : '\x1b[36m';
      const reset = '\x1b[0m';
      const correlationStr = correlationId ? ` [CorrelationID: ${correlationId}]` : '';
      const metaStr = meta && Object.keys(meta).length > 0 ? ` - ${JSON.stringify(meta)}` : '';
      return `[${timestamp}] ${color}${level.toUpperCase()}${reset}${correlationStr}: ${message}${metaStr}`;
    }
  }

  static info(message: string, correlationId?: string, meta?: any) {
    console.log(this.format('info', message, correlationId, meta));
  }

  static warn(message: string, correlationId?: string, meta?: any) {
    console.warn(this.format('warn', message, correlationId, meta));
  }

  static error(message: string, correlationId?: string, meta?: any) {
    console.error(this.format('error', message, correlationId, meta));
  }

  static debug(message: string, correlationId?: string, meta?: any) {
    if (env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
      console.log(this.format('debug', message, correlationId, meta));
    }
  }
}
