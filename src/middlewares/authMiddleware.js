import jwt from 'jsonwebtoken';
import authConfig from '../config/auth.js';
import { db } from '../config/database.js';

export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  // O token vem no formato "Bearer [token]"
  const [, token] = authHeader.split(' ');

  try {
    // Verifica o token
    const decoded = jwt.verify(token, authConfig.jwtSecret);
    
    // Anexa os dados do usuário (payload) na requisição
    req.userId = decoded.id;
    req.userTipo = decoded.tipo;
    req.userSetor = decoded.setor;

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido.' });
  }
};