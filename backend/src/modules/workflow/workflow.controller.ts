import { Request, Response, NextFunction } from 'express';
import { WorkflowService } from './workflow.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AuditService } from '../audit/audit.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';

export class WorkflowController {
  // ── Definitions ──
  static async listDefinitions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const activeOnly = req.query.active === 'true';
      const defs = await WorkflowService.listDefinitions(activeOnly);
      return res.status(200).json({ status: 'success', statusCode: 200, data: defs } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async getDefinition(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const def = await WorkflowService.getDefinition(String(req.params.id));
      return res.status(200).json({ status: 'success', statusCode: 200, data: def } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async createDefinition(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { name, description, config } = req.body;
      if (!name || !config?.steps) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'name and config.steps are required' } as ApiResponse);
      }
      const def = await WorkflowService.createDefinition({ name, description, config });
      await AuditService.record(req, 'workflow.def.create', `Created workflow definition: ${name}`);
      return res.status(201).json({ status: 'success', statusCode: 201, data: def } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async updateDefinition(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const def = await WorkflowService.updateDefinition(String(req.params.id), req.body);
      await AuditService.record(req, 'workflow.def.update', `Updated workflow definition: ${def.name}`);
      return res.status(200).json({ status: 'success', statusCode: 200, data: def } as ApiResponse);
    } catch (error) { next(error); }
  }

  // ── Instances ──
  static async startInstance(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { defId, title, refType, refId, metadata } = req.body;
      if (!defId || !title || !refType || !refId) {
        return res.status(400).json({ status: 'error', statusCode: 400, message: 'defId, title, refType, refId required' } as ApiResponse);
      }
      const instance = await WorkflowService.startInstance(defId, {
        title, refType, refId, initiator: req.user!.username, metadata,
      });
      await AuditService.record(req, 'workflow.instance.start', `Started workflow: ${title} (${refType}:${refId})`);
      return res.status(201).json({ status: 'success', statusCode: 201, data: instance } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async listInstances(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { status, initiator, approverUser, approverRole, page, limit } = req.query;
      const result = await WorkflowService.getInstances(
        {
          status: String(status || ''),
          initiator: String(initiator || ''),
          approverUser: String(approverUser || ''),
          approverRole: String(approverRole || ''),
        },
        Number(page) || 1,
        Number(limit) || 20,
      );
      return res.status(200).json({ status: 'success', statusCode: 200, data: result } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async getInstance(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const instance = await WorkflowService.getInstance(String(req.params.id));
      return res.status(200).json({ status: 'success', statusCode: 200, data: instance } as ApiResponse);
    } catch (error) { next(error); }
  }

  // ── Actions ──
  static async approve(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const instance = await WorkflowService.approve(String(req.params.id), req.user!.username, req.body?.comment);
      await AuditService.record(req, 'workflow.approve', `Approved workflow: ${instance.title} (step ${instance.currentStep})`);
      return res.status(200).json({ status: 'success', statusCode: 200, data: instance } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async reject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const instance = await WorkflowService.reject(String(req.params.id), req.user!.username, req.body?.comment);
      await AuditService.record(req, 'workflow.reject', `Rejected workflow: ${instance.title}`);
      return res.status(200).json({ status: 'success', statusCode: 200, data: instance } as ApiResponse);
    } catch (error) { next(error); }
  }

  static async cancel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const instance = await WorkflowService.cancel(String(req.params.id), req.user!.username);
      await AuditService.record(req, 'workflow.cancel', `Cancelled workflow: ${instance.title}`);
      return res.status(200).json({ status: 'success', statusCode: 200, data: instance } as ApiResponse);
    } catch (error) { next(error); }
  }

  // ── Pending approvals ──
  static async getPendingApprovals(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await WorkflowService.getPendingApprovals(req.user!.username, req.user!.role);
      return res.status(200).json({ status: 'success', statusCode: 200, data: result } as ApiResponse);
    } catch (error) { next(error); }
  }
}
