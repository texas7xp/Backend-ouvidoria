import { db } from '../config/database.js';

// Cria um novo ticket e seus anexos
export async function createTicket(ticketData, files, cidadaoId) {
  const { titulo, descricao } = ticketData;
  
  // 1. Inicia uma transação
  await db.exec('BEGIN TRANSACTION');
  
  try {
    // 2. Insere o ticket
    const ticketSql = `
      INSERT INTO tickets (cidadao_id, titulo, descricao, status)
      VALUES (?, ?, ?, 'aberto')
    `;
    const { lastID: ticketId } = await db.run(ticketSql, [cidadaoId, titulo, descricao]);

    // 3. Insere os anexos (se houver)
    if (files && files.length > 0) {
      const anexoSql = `
        INSERT INTO anexos (ticket_id, path, filename, mimetype)
        VALUES (?, ?, ?, ?)
      `;
      // Prepara as inserções
      const stmt = await db.prepare(anexoSql);
      for (const file of files) {
        await stmt.run(ticketId, file.path, file.filename, file.mimetype);
      }
      await stmt.finalize();
    }
    
    // 4. Commita a transação
    await db.exec('COMMIT');
    
    // 5. Retorna o ticket criado
    return getTicketDetails(ticketId);

  } catch (error) {
    // 6. Rollback em caso de erro
    await db.exec('ROLLBACK');
    console.error('Erro ao criar ticket:', error);
    throw new Error('Falha ao criar ticket e anexos.');
  }
}

// Cria uma nova interação e seu anexo (se houver)
export async function createInteracao(data, file, usuarioId) {
    const { ticket_id, descricao } = data;

    await db.exec('BEGIN TRANSACTION');
    try {
        // 1. Insere a interação
        const interacaoSql = `
            INSERT INTO interacoes (ticket_id, usuario_id, descricao)
            VALUES (?, ?, ?)
        `;
        const { lastID: interacaoId } = await db.run(interacaoSql, [ticket_id, usuarioId, descricao]);

        // 2. Insere o anexo da interação (se houver)
        if (file) {
            const anexoSql = `
                INSERT INTO anexos (interacao_id, path, filename, mimetype)
                VALUES (?, ?, ?, ?)
            `;
            await db.run(anexoSql, [interacaoId, file.path, file.filename, file.mimetype]);
        }

        // 3. (Regra de Negócio) Se a interação foi da prefeitura, muda o status do ticket
        const usuario = await db.get('SELECT tipo FROM usuarios WHERE id = ?', [usuarioId]);
        if (usuario.tipo === 'prefeitura') {
            await db.run("UPDATE tickets SET status = 'em_atendimento' WHERE id = ? AND status = 'aberto'", [ticket_id]);
        }
        
        await db.exec('COMMIT');
        
        // Retorna a interação criada (poderia buscar os detalhes completos)
        return { id: interacaoId, ticket_id, usuario_id: usuarioId, descricao };

    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Erro ao criar interação:', error);
        throw new Error('Falha ao criar interação.');
    }
}

// Busca detalhes completos de um ticket (Ticket + Interações + Anexos)
export async function getTicketDetails(ticketId) {
    const ticket = await db.get('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (!ticket) return null;

    // Busca o usuário criador
    ticket.cidadao = await db.get(
        'SELECT id, nome, email FROM usuarios WHERE id = ?', 
        [ticket.cidadao_id]
    );

    // Busca anexos do ticket principal
    ticket.anexos = await db.all(
        'SELECT id, path, filename FROM anexos WHERE ticket_id = ?', 
        [ticketId]
    );

    // Busca interações
    const interacoes = await db.all(
        `SELECT i.*, u.nome as usuario_nome, u.tipo as usuario_tipo, u.setor as usuario_setor 
         FROM interacoes i
         JOIN usuarios u ON i.usuario_id = u.id
         WHERE i.ticket_id = ?
         ORDER BY i.created_at ASC`,
        [ticketId]
    );

    // Busca anexos de CADA interação
    for (const interacao of interacoes) {
        interacao.anexo = await db.get(
            'SELECT id, path, filename FROM anexos WHERE interacao_id = ?', 
            [interacao.id]
        );
    }

    ticket.interacoes = interacoes;
    return ticket;
}

// Lista tickets (todos ou por cidadão)
export async function listTickets(user) {
    let sql = `
        SELECT t.id, t.titulo, t.status, t.created_at, u.nome as cidadao_nome 
        FROM tickets t
        JOIN usuarios u ON t.cidadao_id = u.id
    `;
    
    const params = [];

    // Se for cidadão, filtra pelos seus
    if (user.tipo === 'cidadao') {
        sql += ' WHERE t.cidadao_id = ?';
        params.push(user.id);
    }

    sql += ' ORDER BY t.updated_at DESC';

    const tickets = await db.all(sql, params);
    return tickets;
}

// Atualiza o status de um ticket (Ação da Prefeitura)
export async function updateTicketStatus(ticketId, status, usuario) {
    await db.exec('BEGIN TRANSACTION');
    try {
        // 1. Atualiza o status
        await db.run('UPDATE tickets SET status = ? WHERE id = ?', [status, ticketId]);
        
        // 2. Cria uma interação de log (histórico)
        const logDesc = `O status do ticket foi alterado para "${status}" pelo setor ${usuario.setor || 'Prefeitura'}.`;
        const logSql = `
            INSERT INTO interacoes (ticket_id, usuario_id, descricao)
            VALUES (?, ?, ?)
        `;
        await db.run(logSql, [ticketId, usuario.id, logDesc]);

        await db.exec('COMMIT');
        return true;
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Erro ao atualizar status:', error);
        throw error;
    }
}