import { Router } from 'express';
import { AiController } from './ai.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

// Chat completion
router.post('/chat', AiController.chat);

// Provider management
router.get('/providers', AiController.getProviders);
router.post('/providers', AiController.upsertProvider);
router.delete('/providers/:id', AiController.deleteProvider);

// Prompt templates
router.get('/templates', AiController.getPromptTemplates);
router.post('/templates', AiController.upsertPromptTemplate);
router.delete('/templates/:id', AiController.deletePromptTemplate);
router.post('/templates/render', AiController.renderPrompt);

// Chat logs & cost
router.get('/logs', AiController.getChatLogs);
router.get('/cost', AiController.getTotalCost);

export default router;
