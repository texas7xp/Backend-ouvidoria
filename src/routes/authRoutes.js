import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

// Rotas públicas
router.post('/signup', authController.signup);
router.post('/signin', authController.signin); // Alterado para POST
router.post('/signout', authController.signout); // Alterado para POST

// Rota privada
router.get('/usuario', authMiddleware, authController.getUsuario);

export default router;