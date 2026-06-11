"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowController = void 0;
const workflow_service_1 = require("./workflow.service");
const audit_service_1 = require("../audit/audit.service");
class WorkflowController {
    // ── Definitions ──
    static async listDefinitions(req, res, next) {
        try {
            const activeOnly = req.query.active === 'true';
            const defs = await workflow_service_1.WorkflowService.listDefinitions(activeOnly);
            return res.status(200).json({ status: 'success', statusCode: 200, data: defs });
        }
        catch (error) {
            next(error);
        }
    }
    static async getDefinition(req, res, next) {
        try {
            const def = await workflow_service_1.WorkflowService.getDefinition(String(req.params.id));
            return res.status(200).json({ status: 'success', statusCode: 200, data: def });
        }
        catch (error) {
            next(error);
        }
    }
    static async createDefinition(req, res, next) {
        try {
            const { name, description, config } = req.body;
            if (!name || !config?.steps) {
                return res.status(400).json({ status: 'error', statusCode: 400, message: 'name and config.steps are required' });
            }
            const def = await workflow_service_1.WorkflowService.createDefinition({ name, description, config });
            await audit_service_1.AuditService.record(req, 'workflow.def.create', `Created workflow definition: ${name}`);
            return res.status(201).json({ status: 'success', statusCode: 201, data: def });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateDefinition(req, res, next) {
        try {
            const def = await workflow_service_1.WorkflowService.updateDefinition(String(req.params.id), req.body);
            await audit_service_1.AuditService.record(req, 'workflow.def.update', `Updated workflow definition: ${def.name}`);
            return res.status(200).json({ status: 'success', statusCode: 200, data: def });
        }
        catch (error) {
            next(error);
        }
    }
    // ── Instances ──
    static async startInstance(req, res, next) {
        try {
            const { defId, title, refType, refId, metadata } = req.body;
            if (!defId || !title || !refType || !refId) {
                return res.status(400).json({ status: 'error', statusCode: 400, message: 'defId, title, refType, refId required' });
            }
            const instance = await workflow_service_1.WorkflowService.startInstance(defId, {
                title, refType, refId, initiator: req.user.username, metadata,
            });
            await audit_service_1.AuditService.record(req, 'workflow.instance.start', `Started workflow: ${title} (${refType}:${refId})`);
            return res.status(201).json({ status: 'success', statusCode: 201, data: instance });
        }
        catch (error) {
            next(error);
        }
    }
    static async listInstances(req, res, next) {
        try {
            const { status, initiator, approverUser, approverRole, page, limit } = req.query;
            const result = await workflow_service_1.WorkflowService.getInstances({
                status: String(status || ''),
                initiator: String(initiator || ''),
                approverUser: String(approverUser || ''),
                approverRole: String(approverRole || ''),
            }, Number(page) || 1, Number(limit) || 20);
            return res.status(200).json({ status: 'success', statusCode: 200, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async getInstance(req, res, next) {
        try {
            const instance = await workflow_service_1.WorkflowService.getInstance(String(req.params.id));
            return res.status(200).json({ status: 'success', statusCode: 200, data: instance });
        }
        catch (error) {
            next(error);
        }
    }
    // ── Actions ──
    static async approve(req, res, next) {
        try {
            const instance = await workflow_service_1.WorkflowService.approve(String(req.params.id), req.user.username, req.body?.comment);
            await audit_service_1.AuditService.record(req, 'workflow.approve', `Approved workflow: ${instance.title} (step ${instance.currentStep})`);
            return res.status(200).json({ status: 'success', statusCode: 200, data: instance });
        }
        catch (error) {
            next(error);
        }
    }
    static async reject(req, res, next) {
        try {
            const instance = await workflow_service_1.WorkflowService.reject(String(req.params.id), req.user.username, req.body?.comment);
            await audit_service_1.AuditService.record(req, 'workflow.reject', `Rejected workflow: ${instance.title}`);
            return res.status(200).json({ status: 'success', statusCode: 200, data: instance });
        }
        catch (error) {
            next(error);
        }
    }
    static async cancel(req, res, next) {
        try {
            const instance = await workflow_service_1.WorkflowService.cancel(String(req.params.id), req.user.username);
            await audit_service_1.AuditService.record(req, 'workflow.cancel', `Cancelled workflow: ${instance.title}`);
            return res.status(200).json({ status: 'success', statusCode: 200, data: instance });
        }
        catch (error) {
            next(error);
        }
    }
    // ── Pending approvals ──
    static async getPendingApprovals(req, res, next) {
        try {
            const result = await workflow_service_1.WorkflowService.getPendingApprovals(req.user.username, req.user.role);
            return res.status(200).json({ status: 'success', statusCode: 200, data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.WorkflowController = WorkflowController;
