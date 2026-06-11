"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowService = void 0;
const database_1 = require("../../config/database");
const error_1 = require("../../middleware/error");
class WorkflowService {
    // ── Definition CRUD ──
    static async listDefinitions(activeOnly = false) {
        const where = activeOnly ? { active: true } : {};
        return database_1.prisma.workflowDefinition.findMany({ where, orderBy: { name: 'asc' } });
    }
    static async getDefinition(id) {
        const def = await database_1.prisma.workflowDefinition.findUnique({ where: { id } });
        if (!def)
            throw new error_1.AppError('Workflow definition not found', 404);
        return def;
    }
    static async createDefinition(data) {
        const existing = await database_1.prisma.workflowDefinition.findUnique({ where: { name: data.name } });
        if (existing)
            throw new error_1.AppError('Workflow definition already exists', 409);
        return database_1.prisma.workflowDefinition.create({
            data: {
                name: data.name,
                description: data.description,
                config: JSON.stringify(data.config),
            },
        });
    }
    static async updateDefinition(id, data) {
        const def = await this.getDefinition(id);
        return database_1.prisma.workflowDefinition.update({
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
    static async startInstance(defId, data) {
        const def = await this.getDefinition(defId);
        const config = JSON.parse(def.config);
        const instance = await database_1.prisma.workflowInstance.create({
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
    static async getInstances(filter, page = 1, limit = 20) {
        const where = {};
        if (filter.status)
            where.status = filter.status;
        if (filter.initiator)
            where.initiator = filter.initiator;
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
            database_1.prisma.workflowInstance.count({ where }),
            database_1.prisma.workflowInstance.findMany({
                where,
                include: { definition: true, steps: { orderBy: { stepIndex: 'asc' } } },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return { total, page, limit, items };
    }
    static async getInstance(id) {
        const inst = await database_1.prisma.workflowInstance.findUnique({
            where: { id },
            include: { definition: true, steps: { orderBy: { stepIndex: 'asc' } } },
        });
        if (!inst)
            throw new error_1.AppError('Workflow instance not found', 404);
        return inst;
    }
    // ── Approval Actions ──
    static async approve(instanceId, username, comment) {
        const instance = await this.getInstance(instanceId);
        if (instance.status !== 'in_progress') {
            throw new error_1.AppError(`Cannot approve: workflow is ${instance.status}`, 400);
        }
        const currentStepIdx = instance.currentStep;
        const currentStep = instance.steps.find(s => s.stepIndex === currentStepIdx);
        if (!currentStep)
            throw new error_1.AppError('No pending step found', 400);
        if (currentStep.status !== 'pending') {
            throw new error_1.AppError('Current step is not pending', 400);
        }
        // Check if user is the approver
        if (currentStep.approverUser && currentStep.approverUser !== username) {
            throw new error_1.AppError('You are not assigned as approver for this step', 403);
        }
        await database_1.prisma.workflowStep.update({
            where: { id: currentStep.id },
            data: { status: 'approved', actedBy: username, comment: comment || null, actedAt: new Date() },
        });
        const config = JSON.parse(instance.definition.config);
        const nextStepIndex = currentStepIdx + 1;
        if (nextStepIndex >= config.steps.length) {
            // All steps approved
            await database_1.prisma.workflowInstance.update({
                where: { id: instanceId },
                data: { status: 'approved', currentStep: nextStepIndex, updatedAt: new Date() },
            });
        }
        else {
            await database_1.prisma.workflowInstance.update({
                where: { id: instanceId },
                data: { currentStep: nextStepIndex, updatedAt: new Date() },
            });
        }
        return this.getInstance(instanceId);
    }
    static async reject(instanceId, username, comment) {
        const instance = await this.getInstance(instanceId);
        if (instance.status !== 'in_progress') {
            throw new error_1.AppError(`Cannot reject: workflow is ${instance.status}`, 400);
        }
        const currentStepIdx = instance.currentStep;
        const currentStep = instance.steps.find(s => s.stepIndex === currentStepIdx);
        if (!currentStep)
            throw new error_1.AppError('No pending step found', 400);
        if (currentStep.approverUser && currentStep.approverUser !== username) {
            throw new error_1.AppError('You are not assigned as approver for this step', 403);
        }
        await database_1.prisma.workflowStep.update({
            where: { id: currentStep.id },
            data: { status: 'rejected', actedBy: username, comment: comment || null, actedAt: new Date() },
        });
        await database_1.prisma.workflowInstance.update({
            where: { id: instanceId },
            data: { status: 'rejected', updatedAt: new Date() },
        });
        return this.getInstance(instanceId);
    }
    static async cancel(instanceId, username) {
        const instance = await this.getInstance(instanceId);
        if (instance.status === 'approved' || instance.status === 'rejected') {
            throw new error_1.AppError(`Cannot cancel: workflow is already ${instance.status}`, 400);
        }
        await database_1.prisma.workflowInstance.update({
            where: { id: instanceId },
            data: { status: 'cancelled', updatedAt: new Date() },
        });
        return this.getInstance(instanceId);
    }
    // ── Pending approvals for current user ──
    static async getPendingApprovals(username, role) {
        const instances = await database_1.prisma.workflowInstance.findMany({
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
exports.WorkflowService = WorkflowService;
