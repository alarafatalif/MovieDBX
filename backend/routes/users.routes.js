import express from 'express';
import { registerUser, loginUser, getUserProfile, getAllUsers, deleteUser } from '../controllers/users.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);

router.post('/login', loginUser);

router.get('/', requireAuth, requireAdmin, getAllUsers);

router.get('/:userId', getUserProfile);

router.delete('/:userId', requireAuth, requireAdmin, deleteUser);

export default router;
