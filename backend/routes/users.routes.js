import express from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/users.controller.js';

const router = express.Router();

router.post('/register', registerUser);

router.post('/login', loginUser);

router.get('/:userId', getUserProfile);

export default router;
