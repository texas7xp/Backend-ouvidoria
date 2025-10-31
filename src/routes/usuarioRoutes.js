import { Router } from 'express';
import * as usuarioController from '../controllers/usuarioController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { isPrefeitura } from '../middlewares/roleMiddleware.js';

const router = Router();

// Todas as rotas /usuarios exigem login E ser da prefeitura
router.use(authMiddleware, isPrefeitura);

router.get('/', usuarioController.getAllUsuarios);
// router.get('/:id', ...);
// router.put('/:id', ...);
// router.delete('/:id', ...);

export default router;