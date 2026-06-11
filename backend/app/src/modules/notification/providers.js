"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramProvider = exports.LineProvider = exports.SmtpProvider = exports.WebSocketProvider = void 0;
class WebSocketProvider {
    name = 'websocket';
    async send(message) {
        try {
            const { emitEvent } = await Promise.resolve().then(() => __importStar(require('../realtime/realtime')));
            emitEvent('notification:alert', {
                type: message.type,
                subject: message.subject,
                body: message.body,
                userId: message.userId,
                timestamp: new Date().toISOString(),
            });
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
}
exports.WebSocketProvider = WebSocketProvider;
class SmtpProvider {
    name = 'email';
    transporter = null;
    async getTransporter() {
        if (this.transporter)
            return this.transporter;
        const nodemailer = await Promise.resolve().then(() => __importStar(require('nodemailer')));
        const { env } = await Promise.resolve().then(() => __importStar(require('../../config/env')));
        const host = process.env.SMTP_HOST || 'mailhog';
        const port = parseInt(process.env.SMTP_PORT || '1025', 10);
        const user = process.env.SMTP_USER || '';
        const pass = process.env.SMTP_PASS || '';
        this.transporter = nodemailer.createTransport({
            host, port,
            secure: port === 465,
            auth: user ? { user, pass } : undefined,
            tls: { rejectUnauthorized: false },
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000,
        });
        return this.transporter;
    }
    async send(message) {
        try {
            const transporter = await this.getTransporter();
            await transporter.sendMail({
                from: process.env.SMTP_FROM || 'noreply@ismart-gravure.com',
                to: message.to,
                subject: message.subject,
                html: message.body,
            });
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
}
exports.SmtpProvider = SmtpProvider;
class LineProvider {
    name = 'line';
    async send(message) {
        const token = process.env.LINE_CHANNEL_TOKEN;
        if (!token)
            return { success: false, error: 'LINE_CHANNEL_TOKEN not configured' };
        try {
            const https = await Promise.resolve().then(() => __importStar(require('https')));
            const data = JSON.stringify({ to: message.to, messages: [{ type: 'text', text: `${message.subject}\n\n${message.body.replace(/<[^>]*>/g, '')}` }] });
            return new Promise((resolve) => {
                const req = https.request({
                    hostname: 'api.line.me', path: '/v2/bot/message/push', method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Content-Length': Buffer.byteLength(data) },
                }, (res) => {
                    let body = '';
                    res.on('data', (c) => body += c);
                    res.on('end', () => resolve(res.statusCode === 200 ? { success: true } : { success: false, error: `LINE API returned ${res.statusCode}: ${body}` }));
                });
                req.on('error', (e) => resolve({ success: false, error: e.message }));
                req.write(data);
                req.end();
            });
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
}
exports.LineProvider = LineProvider;
class TelegramProvider {
    name = 'telegram';
    async send(message) {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token)
            return { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
        try {
            const https = await Promise.resolve().then(() => __importStar(require('https')));
            const text = `${message.subject}\n\n${message.body.replace(/<[^>]*>/g, '')}`;
            const data = JSON.stringify({ chat_id: message.to, text, parse_mode: 'HTML' });
            return new Promise((resolve) => {
                const req = https.request({
                    hostname: 'api.telegram.org', path: `/bot${token}/sendMessage`, method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
                }, (res) => {
                    let body = '';
                    res.on('data', (c) => body += c);
                    res.on('end', () => resolve(res.statusCode === 200 ? { success: true } : { success: false, error: `Telegram API returned ${res.statusCode}: ${body}` }));
                });
                req.on('error', (e) => resolve({ success: false, error: e.message }));
                req.write(data);
                req.end();
            });
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
}
exports.TelegramProvider = TelegramProvider;
