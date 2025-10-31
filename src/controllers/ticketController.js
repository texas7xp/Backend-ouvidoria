import * as Ticket from '../models/Ticket.js';
import { findById as findUserById } from '../models/Usuario.js';

// POST /ticket (Cria um novo ticket com até 3 fotos)
export async function createTicket(req, res) {
  try {
    // req.files vem do middleware do Multer
    const files = req.files;
    
    // Verifica o limite de 3 fotos
    if (files && files.length > 3) {
      return res.status(400).json({ error: 'Máximo de 3 fotos permitido na criação.' });
    }

    const ticket = await Ticket.createTicket(req.body, files, req.userId);
    return res.status(201).json(ticket);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Falha ao criar ticket.' });
  }
}

// GET /ticket (Lista tickets)
export async function getTickets(req, res) {
  try {
    // Passamos os dados do usuário (ID e Tipo) para o Model decidir a query
    const user = { id: req.userId, tipo: req.userTipo };
    const tickets = await Ticket.listTickets(user);
    return res.status(200).json(tickets);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Falha ao listar tickets.' });
  }
}

// GET /ticket/:id/detalhamento
export async function getTicketDetails(req, res) {
    const { id } = req.params;

    try {
        const ticket = await Ticket.getTicketDetails(id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket não encontrado.' });
        }

        // Regra de Segurança: Cidadão só pode ver o próprio ticket
        if (req.userTipo === 'cidadao' && ticket.cidadao_id !== req.userId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        return res.status(200).json(ticket);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Falha ao buscar detalhes do ticket.' });
    }
}

// POST /ticket/:id/interacao (Adiciona uma interação com 1 foto)
export async function addInteracao(req, res) {
    const { id } = req.params;
    
    try {
        // req.file (singular) vem do upload.single()
        const file = req.file; 
        const data = { ...req.body, ticket_id: id };
        
        // (Opcional) Validar se o ticket existe
        // (Opcional) Validar se o usuário pode interagir (dono ou prefeitura)

        const interacao = await Ticket.createInteracao(data, file, req.userId);
        return res.status(201).json(interacao);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Falha ao adicionar interação.' });
    }
}

// PUT /ticket/:id/status (Muda o status - Apenas Prefeitura)
export async function updateStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body; // 'em_atendimento' ou 'finalizado'

    if (!status || !['em_atendimento', 'finalizado'].includes(status)) {
        return res.status(400).json({ error: "Status inválido. Use 'em_atendimento' ou 'finalizado'." });
    }

    try {
        const usuario = { id: req.userId, setor: req.userSetor };
        await Ticket.updateTicketStatus(id, status, usuario);
        
        // Retorna o ticket atualizado
        const ticket = await Ticket.getTicketDetails(id);
        return res.status(200).json(ticket);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Falha ao atualizar status.' });
    }
}