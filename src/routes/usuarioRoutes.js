import { Router } from 'express';
import * as usuarioController from '../controllers/usuarioController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { isPrefeitura } from '../middlewares/roleMiddleware.js';

const router = Router();

//Rotas sem necessidade de ser prefeitura
router.delete('/:id', usuarioController.deleteUsuario);
router.patch('/:id', usuarioController.updateUsuario);

router.use(authMiddleware, isPrefeitura);
// Todas as rotas /usuarios exigem login E ser da prefeitura
router.get('/', usuarioController.getAllUsuarios);
// router.get('/:id', ...);
// router.put('/:id', ...);
// router.delete('/:id', ...);

export default router;