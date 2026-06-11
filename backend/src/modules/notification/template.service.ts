import { prisma } from '../../config/database';

export class TemplateService {
  static async render(type: string, variables: Record<string, any>, language = 'en'): Promise<{ subject: string; body: string } | null> {
    const template = await prisma.notificationTemplate.findFirst({
      where: { type, language, active: true },
    });
    if (!template) return null;

    try {
      const Handlebars = await import('handlebars');
      const subjectTmpl = Handlebars.compile(template.subject);
      const bodyTmpl = Handlebars.compile(template.body);
      return {
        subject: subjectTmpl(variables),
        body: bodyTmpl(variables),
      };
    } catch (error: any) {
      throw new Error(`Template render failed: ${error.message}`);
    }
  }

  static async list() {
    return prisma.notificationTemplate.findMany({ orderBy: { type: 'asc' } });
  }

  static async upsert(data: { type: string; subject: string; body: string; channels: string[]; language?: string }) {
    return prisma.notificationTemplate.upsert({
      where: { type: data.type },
      update: { subject: data.subject, body: data.body, channels: data.channels, language: data.language || 'en' },
      create: { type: data.type, subject: data.subject, body: data.body, channels: data.channels, language: data.language || 'en' },
    });
  }

  static async remove(type: string) {
    return prisma.notificationTemplate.delete({ where: { type } });
  }
}
