import { prisma } from '../../config/database';
import { createAiProvider, AiProviderInterface, AiChatRequest, AiChatResponse } from './provider';

export class AiService {
  static async chat(req: AiChatRequest): Promise<AiChatResponse> {
    // Resolve provider
    let provider: AiProviderInterface;
    let providerRecord: any;

    if (req.providerId) {
      providerRecord = await prisma.aiProvider.findUnique({ where: { id: req.providerId } });
      if (!providerRecord || !providerRecord.isActive) {
        throw new Error('AI provider not found or inactive');
      }
    } else {
      providerRecord = await prisma.aiProvider.findFirst({
        where: { providerType: req.providerType || 'ollama', isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!providerRecord) {
        throw new Error('No active AI provider found');
      }
    }

    provider = createAiProvider(providerRecord);
    const response = await provider.chat(req);
    response.providerId = providerRecord.id;

    // Log the chat
    await prisma.aiChatLog.create({
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
    return prisma.aiProvider.findMany({ orderBy: { name: 'asc' } });
  }

  static async upsertProvider(data: { id?: string; name: string; providerType: string; modelName: string; apiKey?: string; baseUrl?: string; isActive?: boolean; costPer1kInput?: number; costPer1kOutput?: number; rateLimit?: number }) {
    if (data.id) {
      return prisma.aiProvider.update({ where: { id: data.id }, data });
    }
    const existing = await prisma.aiProvider.findFirst({ where: { name: data.name } });
    if (existing) {
      return prisma.aiProvider.update({ where: { id: existing.id }, data });
    }
    return prisma.aiProvider.create({ data });
  }

  static async deleteProvider(id: string) {
    return prisma.aiProvider.delete({ where: { id } });
  }

  static async getPromptTemplates(language?: string) {
    const where: any = { isActive: true };
    if (language) where.language = language;
    return prisma.aiPromptTemplate.findMany({ where, orderBy: { name: 'asc' } });
  }

  static async upsertPromptTemplate(data: { id?: string; name: string; prompt: string; variables: string[]; language: string; isActive?: boolean }) {
    if (data.id) {
      return prisma.aiPromptTemplate.update({ where: { id: data.id }, data });
    }
    return prisma.aiPromptTemplate.create({ data });
  }

  static async deletePromptTemplate(id: string) {
    return prisma.aiPromptTemplate.delete({ where: { id } });
  }

  static async renderPrompt(templateId: string, variables: Record<string, string>): Promise<string> {
    const tmpl = await prisma.aiPromptTemplate.findUnique({ where: { id: templateId } });
    if (!tmpl) throw new Error('Prompt template not found');

    let result = tmpl.prompt;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), value);
    }
    return result;
  }

  static async getChatLogs(options: { limit?: number; offset?: number; userId?: string; success?: boolean }) {
    const where: any = {};
    if (options.userId) where.userId = options.userId;
    if (options.success !== undefined) where.success = options.success;

    const [logs, total] = await Promise.all([
      prisma.aiChatLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
        include: { provider: { select: { name: true, providerType: true } } },
      }),
      prisma.aiChatLog.count({ where }),
    ]);
    return { logs, total };
  }

  static async getTotalCost(providerId?: string): Promise<number> {
    const where: any = {};
    if (providerId) where.providerId = providerId;
    const agg = await prisma.aiChatLog.aggregate({ where, _sum: { cost: true } });
    return agg._sum.cost || 0;
  }
}
