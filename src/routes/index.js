import { Router } from 'express';
import authRoutes from './authRoutes.js';
import usuarioRoutes from './usuarioRoutes.js';
import ticketRoutes from './ticketRoutes.js';

const router = Router();

// As rotas de autenticação ficam na raiz
router.get('/', (req, res)=> {
    res.status(200).send('API Online');
}); 

// As rotas de autenticação ficam na raiz
router.use('/', authRoutes); 

// As rotas de usuários ficam em /usuarios
router.use('/usuarios', usuarioRoutes);

// As rotas de ticket ficam em /ticket
router.use('/ticket', ticketRoutes);

export default router;