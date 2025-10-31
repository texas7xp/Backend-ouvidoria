import * as Usuario from '../models/Usuario.js';

// GET /usuarios (Apenas Prefeitura)
export async function getAllUsuarios(req, res) {
  try {
    const usuarios = await Usuario.findAll();
    return res.status(200).json(usuarios);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
}

// Outras funções (getById, update, delete) podem ser adicionadas aqui