import express from 'express';
import { chatWithAssistant } from '../controllers/ai.controller.js';

const router = express.Router();

router.post('/chat', chatWithAssistant);

export default router;
