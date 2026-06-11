"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("./ai.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Chat completion
router.post('/chat', ai_controller_1.AiController.chat);
// Provider management
router.get('/providers', ai_controller_1.AiController.getProviders);
router.post('/providers', ai_controller_1.AiController.upsertProvider);
router.delete('/providers/:id', ai_controller_1.AiController.deleteProvider);
// Prompt templates
router.get('/templates', ai_controller_1.AiController.getPromptTemplates);
router.post('/templates', ai_controller_1.AiController.upsertPromptTemplate);
router.delete('/templates/:id', ai_controller_1.AiController.deletePromptTemplate);
router.post('/templates/render', ai_controller_1.AiController.renderPrompt);
// Chat logs & cost
router.get('/logs', ai_controller_1.AiController.getChatLogs);
router.get('/cost', ai_controller_1.AiController.getTotalCost);
exports.default = router;
