import { Router } from 'express';
import { authController } from '../controllers/authController.js';

const router = Router();

router.get('/login', authController.renderLogin);
router.post('/login', authController.handleLogin);

router.get('/register', authController.renderRegister);
router.post('/register', authController.handleRegister);

router.get('/logout', authController.handleLogout);
router.post('/logout', authController.handleLogout);

export default router;
