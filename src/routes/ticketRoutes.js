import { Router } from 'express';
import multer from 'multer';
import * as ticketController from '../controllers/ticketController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { isCidadao, isPrefeitura } from '../middlewares/roleMiddleware.js';
import multerConfig from '../config/multer.js';

const router = Router();
const upload = multer(multerConfig);

// Todas as rotas de ticket exigem login
router.use(authMiddleware);

// Rota /ticket
router.post(
    '/', 
    isCidadao, // Apenas cidadão pode criar ticket
    upload.array('fotos', 3), // Middleware do Multer para até 3 fotos
    ticketController.createTicket
);
router.get('/', ticketController.getTickets); // Lista (lógica de Cidadão/Prefeitura no controller)

// Rota /ticket/:id
router.get('/:id/detalhamento', ticketController.getTicketDetails);
router.post(
    '/:id/interacao', 
    upload.single('foto'), // Middleware do Multer para 1 foto
    ticketController.addInteracao
);
router.put(
    '/:id/status',
    isPrefeitura, // Apenas prefeitura muda status
    ticketController.updateStatus
);


export default router;