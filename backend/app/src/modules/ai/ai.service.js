"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const database_1 = require("../../config/database");
const provider_1 = require("./provider");
class AiService {
    static async chat(req) {
        // Resolve provider
        let provider;
        let providerRecord;
        if (req.providerId) {
            providerRecord = await database_1.prisma.aiProvider.findUnique({ where: { id: req.providerId } });
            if (!providerRecord || !providerRecord.isActive) {
                throw new Error('AI provider not found or inactive');
            }
        }
        else {
            providerRecord = await database_1.prisma.aiProvider.findFirst({
                where: { providerType: req.providerType || 'ollama', isActive: true },
                orderBy: { createdAt: 'asc' },
            });
            if (!providerRecord) {
                throw new Error('No active AI provider found');
            }
        }
        provider = (0, provider_1.createAiProvider)(providerRecord);
        const response = await provider.chat(req);
        response.providerId = providerRecord.id;
        // Log the chat
        await database_1.prisma.aiChatLog.create({
            data: {
                providerId: providerRecord.id,
                modelName: response.model,
                prompt: req.prompt,
                response: response.text,
                inputTokens: response.inputTokens,
                outputTokens: response.outputTokens,
                cost: response.cost,
                durationMs: response.durationMs,
                userId: req.userId,
                success: true,
            },
        });
        return response;
    }
    static async getProviders() {
        return database_1.prisma.aiProvider.findMany({ orderBy: { name: 'asc' } });
    }
    static async upsertProvider(data) {
        if (data.id) {
            return database_1.prisma.aiProvider.update({ where: { id: data.id }, data });
        }
        return database_1.prisma.aiProvider.create({ data });
    }
    static async deleteProvider(id) {
        return database_1.prisma.aiProvider.delete({ where: { id } });
    }
    static async getPromptTemplates(language) {
        const where = { isActive: true };
        if (language)
            where.language = language;
        return database_1.prisma.aiPromptTemplate.findMany({ where, orderBy: { name: 'asc' } });
    }
    static async upsertPromptTemplate(data) {
        if (data.id) {
            return database_1.prisma.aiPromptTemplate.update({ where: { id: data.id }, data });
        }
        return database_1.prisma.aiPromptTemplate.create({ data });
    }
    static async deletePromptTemplate(id) {
        return database_1.prisma.aiPromptTemplate.delete({ where: { id } });
    }
    static async renderPrompt(templateId, variables) {
        const tmpl = await database_1.prisma.aiPromptTemplate.findUnique({ where: { id: templateId } });
        if (!tmpl)
            throw new Error('Prompt template not found');
        let result = tmpl.prompt;
        for (const [key, value] of Object.entries(variables)) {
            result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), value);
        }
        return result;
    }
    static async getChatLogs(options) {
        const where = {};
        if (options.userId)
            where.userId = options.userId;
        if (options.success !== undefined)
            where.success = options.success;
        const [logs, total] = await Promise.all([
            database_1.prisma.aiChatLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: options.limit || 50,
                skip: options.offset || 0,
                include: { provider: { select: { name: true, providerType: true } } },
            }),
            database_1.prisma.aiChatLog.count({ where }),
        ]);
        return { logs, total };
    }
    static async getTotalCost(providerId) {
        const where = {};
        if (providerId)
            where.providerId = providerId;
        const agg = await database_1.prisma.aiChatLog.aggregate({ where, _sum: { cost: true } });
        return agg._sum.cost || 0;
    }
}
exports.AiService = AiService;
