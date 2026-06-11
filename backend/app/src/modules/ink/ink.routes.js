"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ink_controller_1 = require("./ink.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Formulas
router.post('/formulas', ink_controller_1.InkController.createFormula);
router.get('/formulas', ink_controller_1.InkController.listFormulas);
router.get('/formulas/:code', ink_controller_1.InkController.getFormulaByCode);
router.put('/formulas/:code', ink_controller_1.InkController.updateFormula);
router.delete('/formulas/:code', ink_controller_1.InkController.deleteFormula);
// Batches
router.post('/batches', ink_controller_1.InkController.createBatch);
router.get('/batches', ink_controller_1.InkController.listBatches);
router.get('/batches/:id', ink_controller_1.InkController.getBatchById);
router.put('/batches/:id', ink_controller_1.InkController.updateBatch);
router.delete('/batches/:id', ink_controller_1.InkController.deleteBatch);
exports.default = router;
