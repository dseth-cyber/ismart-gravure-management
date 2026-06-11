"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_controller_1 = require("./audit.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Only admin role is authorized to view system audit logs
router.get('/logs', auth_1.requireAuth, (0, auth_1.requireRoles)(['admin']), audit_controller_1.AuditController.list);
exports.default = router;
