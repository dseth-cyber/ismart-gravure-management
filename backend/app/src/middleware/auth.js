"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const error_1 = require("./error");
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new error_1.AppError('Unauthorized: Access token is missing or invalid format', 401));
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return next(new error_1.AppError('Unauthorized: Token verification failed', 401));
    }
};
exports.requireAuth = requireAuth;
const requireRoles = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new error_1.AppError('Unauthorized: Authentication required', 401));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new error_1.AppError('Forbidden: Insufficient privileges', 403));
        }
        next();
    };
};
exports.requireRoles = requireRoles;
