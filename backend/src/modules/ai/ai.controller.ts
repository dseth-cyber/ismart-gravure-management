import { Request, Response, NextFunction } from 'express';
import { AiService } from './ai.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ApiResponse } from '@shared/dto/auth/auth.dto';

export class AiController {
  static async chat(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { prompt, systemPrompt, providerId, providerType, model, temperature, maxTokens } = req.body;
      if (!prompt) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'prompt is required' } as ApiResponse);
      }
      const result = await AiService.chat({
        prompt,
        systemPrompt,
        providerId,
        providerType,
        model,
        temperature,
        maxTokens,
        userId: req.user?.userId,
      });
      return res.status(200).json({ status: 'success', statusCode: 200, data: result } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async getProviders(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const providers = await AiService.getProviders();
      return res.status(200).json({ status: 'success', statusCode: 200, data: providers } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async upsertProvider(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const provider = await AiService.upsertProvider(req.body);
      return res.status(200).json({ status: 'success', statusCode: 200, data: provider } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async deleteProvider(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await AiService.deleteProvider(String(req.params.id));
      return res.status(200).json({ status: 'success', statusCode: 200, message: 'Provider deleted' } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async getPromptTemplates(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const templates = await AiService.getPromptTemplates(String(req.query.language || ''));
      return res.status(200).json({ status: 'success', statusCode: 200, data: templates } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async upsertPromptTemplate(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const template = await AiService.upsertPromptTemplate(req.body);
      return res.status(200).json({ status: 'success', statusCode: 200, data: template } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async deletePromptTemplate(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await AiService.deletePromptTemplate(String(req.params.id));
      return res.status(200).json({ status: 'success', statusCode: 200, message: 'Template deleted' } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async renderPrompt(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { templateId, variables } = req.body;
      const rendered = await AiService.renderPrompt(templateId, variables || {});
      return res.status(200).json({ status: 'success', statusCode: 200, data: { rendered } } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async getChatLogs(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { logs, total } = await AiService.getChatLogs({
        limit: parseInt(String(req.query.limit || '50'), 10),
        offset: parseInt(String(req.query.offset || '0'), 10),
        userId: String(req.query.userId || ''),
        success: req.query.success !== undefined ? req.query.success === 'true' : undefined,
      });
      return res.status(200).json({ status: 'success', statusCode: 200, data: { logs, total } } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async getTotalCost(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const cost = await AiService.getTotalCost(String(req.query.providerId || ''));
      return res.status(200).json({ status: 'success', statusCode: 200, data: { totalCost: cost } } as ApiResponse);
    } catch (error) { next(error); }
  }
}
