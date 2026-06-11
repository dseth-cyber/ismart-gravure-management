"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireApiKey = requireApiKey;
const env_1 = require("../config/env");
const error_1 = require("./error");
function requireApiKey(req, res, next) {
    if (!env_1.env.API_KEY_ENABLED) {
        return next();
    }
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return next(new error_1.AppError('API key required (X-API-Key header)', 401));
    }
    if (!env_1.env.API_KEYS.includes(apiKey)) {
        return next(new error_1.AppError('Invalid API key', 401));
    }
    next();
}
