"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const ai_service_1 = require("./ai.service");
class AiController {
    static async chat(req, res, next) {
        try {
            const { prompt, systemPrompt, providerId, providerType, model, temperature, maxTokens } = req.body;
            if (!prompt) {
                return res.status(400).json({ status: 'error', statusCode: 400, message: 'prompt is required' });
            }
            const result = await ai_service_1.AiService.chat({
                prompt,
                systemPrompt,
                providerId,
                providerType,
                model,
                temperature,
                maxTokens,
                userId: req.user?.userId,
            });
            return res.status(200).json({ status: 'success', statusCode: 200, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async getProviders(req, res, next) {
        try {
            const providers = await ai_service_1.AiService.getProviders();
            return res.status(200).json({ status: 'success', statusCode: 200, data: providers });
        }
        catch (error) {
            next(error);
        }
    }
    static async upsertProvider(req, res, next) {
        try {
            const provider = await ai_service_1.AiService.upsertProvider(req.body);
            return res.status(200).json({ status: 'success', statusCode: 200, data: provider });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteProvider(req, res, next) {
        try {
            await ai_service_1.AiService.deleteProvider(String(req.params.id));
            return res.status(200).json({ status: 'success', statusCode: 200, message: 'Provider deleted' });
        }
        catch (error) {
            next(error);
        }
    }
    static async getPromptTemplates(req, res, next) {
        try {
            const templates = await ai_service_1.AiService.getPromptTemplates(String(req.query.language || ''));
            return res.status(200).json({ status: 'success', statusCode: 200, data: templates });
        }
        catch (error) {
            next(error);
        }
    }
    static async upsertPromptTemplate(req, res, next) {
        try {
            const template = await ai_service_1.AiService.upsertPromptTemplate(req.body);
            return res.status(200).json({ status: 'success', statusCode: 200, data: template });
        }
        catch (error) {
            next(error);
        }
    }
    static async deletePromptTemplate(req, res, next) {
        try {
            await ai_service_1.AiService.deletePromptTemplate(String(req.params.id));
            return res.status(200).json({ status: 'success', statusCode: 200, message: 'Template deleted' });
        }
        catch (error) {
            next(error);
        }
    }
    static async renderPrompt(req, res, next) {
        try {
            const { templateId, variables } = req.body;
            const rendered = await ai_service_1.AiService.renderPrompt(templateId, variables || {});
            return res.status(200).json({ status: 'success', statusCode: 200, data: { rendered } });
        }
        catch (error) {
            next(error);
        }
    }
    static async getChatLogs(req, res, next) {
        try {
            const { logs, total } = await ai_service_1.AiService.getChatLogs({
                limit: parseInt(String(req.query.limit || '50'), 10),
                offset: parseInt(String(req.query.offset || '0'), 10),
                userId: String(req.query.userId || ''),
                success: req.query.success !== undefined ? req.query.success === 'true' : undefined,
            });
            return res.status(200).json({ status: 'success', statusCode: 200, data: { logs, total } });
        }
        catch (error) {
            next(error);
        }
    }
    static async getTotalCost(req, res, next) {
        try {
            const cost = await ai_service_1.AiService.getTotalCost(String(req.query.providerId || ''));
            return res.status(200).json({ status: 'success', statusCode: 200, data: { totalCost: cost } });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AiController = AiController;
