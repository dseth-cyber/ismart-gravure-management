"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const env_1 = require("../config/env");
class Logger {
    static format(level, message, correlationId, meta) {
        const timestamp = new Date().toISOString();
        if (env_1.env.NODE_ENV === 'production' || env_1.env.LOG_FORMAT === 'json') {
            return JSON.stringify({
                timestamp,
                level,
                message,
                correlationId: correlationId || null,
                meta: meta || {}
            });
        }
        else {
            const color = level === 'error' ? '\x1b[31m' :
                level === 'warn' ? '\x1b[33m' :
                    level === 'info' ? '\x1b[32m' : '\x1b[36m';
            const reset = '\x1b[0m';
            const correlationStr = correlationId ? ` [CorrelationID: ${correlationId}]` : '';
            const metaStr = meta && Object.keys(meta).length > 0 ? ` - ${JSON.stringify(meta)}` : '';
            return `[${timestamp}] ${color}${level.toUpperCase()}${reset}${correlationStr}: ${message}${metaStr}`;
        }
    }
    static info(message, correlationId, meta) {
        console.log(this.format('info', message, correlationId, meta));
    }
    static warn(message, correlationId, meta) {
        console.warn(this.format('warn', message, correlationId, meta));
    }
    static error(message, correlationId, meta) {
        console.error(this.format('error', message, correlationId, meta));
    }
    static debug(message, correlationId, meta) {
        if (env_1.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
            console.log(this.format('debug', message, correlationId, meta));
        }
    }
}
exports.Logger = Logger;
