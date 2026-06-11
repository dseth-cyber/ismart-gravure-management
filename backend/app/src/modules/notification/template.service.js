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
exports.TemplateService = void 0;
const database_1 = require("../../config/database");
class TemplateService {
    static async render(type, variables, language = 'en') {
        const template = await database_1.prisma.notificationTemplate.findFirst({
            where: { type, language, active: true },
        });
        if (!template)
            return null;
        try {
            const Handlebars = await Promise.resolve().then(() => __importStar(require('handlebars')));
            const subjectTmpl = Handlebars.compile(template.subject);
            const bodyTmpl = Handlebars.compile(template.body);
            return {
                subject: subjectTmpl(variables),
                body: bodyTmpl(variables),
            };
        }
        catch (error) {
            throw new Error(`Template render failed: ${error.message}`);
        }
    }
    static async list() {
        return database_1.prisma.notificationTemplate.findMany({ orderBy: { type: 'asc' } });
    }
    static async upsert(data) {
        return database_1.prisma.notificationTemplate.upsert({
            where: { type: data.type },
            update: { subject: data.subject, body: data.body, channels: data.channels, language: data.language || 'en' },
            create: { type: data.type, subject: data.subject, body: data.body, channels: data.channels, language: data.language || 'en' },
        });
    }
    static async remove(type) {
        return database_1.prisma.notificationTemplate.delete({ where: { type } });
    }
}
exports.TemplateService = TemplateService;
