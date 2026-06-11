"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerMiddleware = void 0;
const logger_1 = require("../utils/logger");
const loggerMiddleware = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.Logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, req.correlationId, {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: duration
        });
    });
    next();
};
exports.loggerMiddleware = loggerMiddleware;
