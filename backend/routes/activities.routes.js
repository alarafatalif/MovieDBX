import express from 'express';
import { getActivities } from '../controllers/activities.controller.js';

const router = express.Router();

// GET /api/activities?limit=20&userId=5
router.get('/', getActivities);

export default router;
