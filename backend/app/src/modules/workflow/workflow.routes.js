"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const workflow_controller_1 = require("./workflow.controller");
const auth_1 = require("../../middleware/auth");
const permission_1 = require("../../middleware/permission");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Pending approvals — available to all authenticated users
router.get('/pending', workflow_controller_1.WorkflowController.getPendingApprovals);
// Instance actions — for participants
router.get('/instances', workflow_controller_1.WorkflowController.listInstances);
router.post('/instances', (0, permission_1.requirePermission)('jobs:verify'), workflow_controller_1.WorkflowController.startInstance);
router.get('/instances/:id', workflow_controller_1.WorkflowController.getInstance);
router.post('/instances/:id/approve', workflow_controller_1.WorkflowController.approve);
router.post('/instances/:id/reject', workflow_controller_1.WorkflowController.reject);
router.post('/instances/:id/cancel', workflow_controller_1.WorkflowController.cancel);
// Definition management — admin only
router.get('/definitions', workflow_controller_1.WorkflowController.listDefinitions);
router.get('/definitions/:id', workflow_controller_1.WorkflowController.getDefinition);
router.post('/definitions', (0, auth_1.requireRoles)(['admin']), workflow_controller_1.WorkflowController.createDefinition);
router.put('/definitions/:id', (0, auth_1.requireRoles)(['admin']), workflow_controller_1.WorkflowController.updateDefinition);
exports.default = router;
