import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error';

interface WorkflowConfig {
  steps: Array<{
    index: number;
    label: string;
    approverRole?: string;
    approverUser?: string;
    escalationMinutes?: number;
  }>;
}

export class WorkflowService {
  // ── Definition CRUD ──
  static async listDefinitions(activeOnly = false) {
    const where = activeOnly ? { active: true } : {};
    return prisma.workflowDefinition.findMany({ where, orderBy: { name: 'asc' } });
  }

  static async getDefinition(id: string) {
    const def = await prisma.workflowDefinition.findUnique({ where: { id } });
    if (!def) throw new AppError('Workflow definition not found', 404);
    return def;
  }

  static async createDefinition(data: { name: string; description?: string; config: WorkflowConfig }) {
    const existing = await prisma.workflowDefinition.findUnique({ where: { name: data.name } });
    if (existing) throw new AppError('Workflow definition already exists', 409);
    return prisma.workflowDefinition.create({
      data: {
        name: data.name,
        description: data.description,
        config: JSON.stringify(data.config),
      },
    });
  }

  static async updateDefinition(id: string, data: { name?: string; description?: string; config?: WorkflowConfig; active?: boolean }) {
    const def = await this.getDefinition(id);
    return prisma.workflowDefinition.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description && { description: data.description }),
        ...(data.config && { config: JSON.stringify(data.config), version: def.version + 1 }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });
  }

  // ── Instance Management ──
  static async startInstance(defId: string, data: {
    title: string; refType: string; refId: string; initiator: string; metadata?: any;
  }) {
    const def = await this.getDefinition(defId);
    const config: WorkflowConfig = JSON.parse(def.config);

    const instance = await prisma.workflowInstance.create({
      data: {
        defId,
        title: data.title,
        refType: data.refType,
        refId: data.refId,
        initiator: data.initiator,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        currentStep: 0,
        status: config.steps.length === 0 ? 'approved' : 'in_progress',
        steps: {
          create: config.steps.map(step => ({
            stepIndex: step.index,
            label: step.label,
            approverRole: step.approverRole || null,
            approverUser: step.approverUser || null,
            status: 'pending',
          })),
        },
      },
      include: { steps: { orderBy: { stepIndex: 'asc' } } },
    });

    return instance;
  }

  static async getInstances(filter: {
    status?: string; initiator?: string; approverUser?: string; approverRole?: string;
  }, page = 1, limit = 20) {
    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.initiator) where.initiator = filter.initiator;
    if (filter.approverUser || filter.approverRole) {
      where.steps = {
        some: {
          status: 'pending',
          ...(filter.approverUser && { approverUser: filter.approverUser }),
          ...(filter.approverRole && { approverRole: filter.approverRole }),
        },
      };
    }

    const [total, items] = await Promise.all([
      prisma.workflowInstance.count({ where }),
      prisma.workflowInstance.findMany({
        where,
        include: { definition: true, steps: { orderBy: { stepIndex: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, items };
  }

  static async getInstance(id: string) {
    const inst = await prisma.workflowInstance.findUnique({
      where: { id },
      include: { definition: true, steps: { orderBy: { stepIndex: 'asc' } } },
    });
    if (!inst) throw new AppError('Workflow instance not found', 404);
    return inst;
  }

  // ── Approval Actions ──
  static async approve(instanceId: string, username: string, comment?: string) {
    const instance = await this.getInstance(instanceId);
    if (instance.status !== 'in_progress') {
      throw new AppError(`Cannot approve: workflow is ${instance.status}`, 400);
    }

    const currentStepIdx = instance.currentStep;
    const currentStep = instance.steps.find(s => s.stepIndex === currentStepIdx);
    if (!currentStep) throw new AppError('No pending step found', 400);
    if (currentStep.status !== 'pending') {
      throw new AppError('Current step is not pending', 400);
    }

    // Check if user is the approver
    if (currentStep.approverUser && currentStep.approverUser !== username) {
      throw new AppError('You are not assigned as approver for this step', 403);
    }

    await prisma.workflowStep.update({
      where: { id: currentStep.id },
      data: { status: 'approved', actedBy: username, comment: comment || null, actedAt: new Date() },
    });

    const config: WorkflowConfig = JSON.parse(instance.definition.config);
    const nextStepIndex = currentStepIdx + 1;

    if (nextStepIndex >= config.steps.length) {
      // All steps approved
      await prisma.workflowInstance.update({
        where: { id: instanceId },
        data: { status: 'approved', currentStep: nextStepIndex, updatedAt: new Date() },
      });
    } else {
      await prisma.workflowInstance.update({
        where: { id: instanceId },
        data: { currentStep: nextStepIndex, updatedAt: new Date() },
      });
    }

    return this.getInstance(instanceId);
  }

  static async reject(instanceId: string, username: string, comment?: string) {
    const instance = await this.getInstance(instanceId);
    if (instance.status !== 'in_progress') {
      throw new AppError(`Cannot reject: workflow is ${instance.status}`, 400);
    }

    const currentStepIdx = instance.currentStep;
    const currentStep = instance.steps.find(s => s.stepIndex === currentStepIdx);
    if (!currentStep) throw new AppError('No pending step found', 400);

    if (currentStep.approverUser && currentStep.approverUser !== username) {
      throw new AppError('You are not assigned as approver for this step', 403);
    }

    await prisma.workflowStep.update({
      where: { id: currentStep.id },
      data: { status: 'rejected', actedBy: username, comment: comment || null, actedAt: new Date() },
    });

    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { status: 'rejected', updatedAt: new Date() },
    });

    return this.getInstance(instanceId);
  }

  static async cancel(instanceId: string, username: string) {
    const instance = await this.getInstance(instanceId);
    if (instance.status === 'approved' || instance.status === 'rejected') {
      throw new AppError(`Cannot cancel: workflow is already ${instance.status}`, 400);
    }

    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { status: 'cancelled', updatedAt: new Date() },
    });

    return this.getInstance(instanceId);
  }

  // ── Pending approvals for current user ──
  static async getPendingApprovals(username: string, role: string) {
    const instances = await prisma.workflowInstance.findMany({
      where: {
        status: 'in_progress',
        steps: {
          some: {
            status: 'pending',
            AND: [
              { OR: [{ approverUser: username }, { approverRole: role }] },
            ],
          },
        },
      },
      include: {
        definition: true,
        steps: {
          where: { status: 'pending' },
          orderBy: { stepIndex: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return instances.map(inst => ({
      id: inst.id,
      title: inst.title,
      refType: inst.refType,
      refId: inst.refId,
      initiator: inst.initiator,
      definition: inst.definition.name,
      currentStep: inst.steps[0] || null,
      createdAt: inst.createdAt,
    }));
  }
}
