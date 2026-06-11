"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const queue_controller_1 = require("./queue.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Route to trigger background jobs
router.post('/test-job', auth_1.requireAuth, queue_controller_1.QueueController.triggerTestJob);
exports.default = router;
