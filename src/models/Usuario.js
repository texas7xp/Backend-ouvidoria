import { db } from '../config/database.js';
import bcrypt from 'bcryptjs';

// Encontra usuário por ID (sem a senha)
export async function findById(id) {
  const user = await db.get('SELECT id, nome, email, tipo, setor, created_at, updated_at FROM usuarios WHERE id = ?', [id]);
  return user;
}

// Encontra usuário por Email (com a senha, para login)
export async function findByEmail(email) {
  const user = await db.get('SELECT * FROM usuarios WHERE email = ?', [email]);
  return user;
}

// Lista todos os usuários (para admin)
export async function findAll() {
    const users = await db.all('SELECT id, nome, email, tipo, setor, created_at, updated_at FROM usuarios');
    return users;
}

// Cria um novo usuário
export async function create(userData) {
  const { nome, email, senha, tipo, setor } = userData;
  
  // Hash da senha
  const senhaHash = await bcrypt.hash(senha, 8);

  const sql = `
    INSERT INTO usuarios (nome, email, senha, tipo, setor)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  const { lastID } = await db.run(sql, [nome, email, senhaHash, tipo, setor]);
  
  return findById(lastID);
}