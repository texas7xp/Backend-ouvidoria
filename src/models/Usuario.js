import { db } from "../config/database.js";
import bcrypt from "bcryptjs";

// Encontra usuário por ID (sem a senha)
export async function findById(id) {
  const user = await db.get(
    "SELECT id, nome, email, tipo, setor, cpf, telefone, endereco, created_at, updated_at FROM usuarios WHERE id = ?",
    [id]
  );
  return user;
}

// Encontra usuário por Email (com a senha, para login)
export async function findByEmail(email) {
  const user = await db.get("SELECT * FROM usuarios WHERE email = ?", [email]);
  return user;
}

// Lista todos os usuários (para admin)
export async function findAll() {
  const users = await db.all(
    "SELECT id, nome, email, tipo, setor, cpf, telefone, endereco, created_at, updated_at FROM usuarios"
  );
  return users;
}

// Cria um novo usuário
export async function create(userData) {
  let { nome, email, senha, tipo, setor, cpf, telefone, endereco } = userData;

  if (typeof tipo === 'undefined') {
    tipo = "cidadao";
    setor = null;
  }

  if (tipo === 'prefeitura' && (typeof setor === 'undefined' || setor === null)) {
    throw new Error("Setor é obrigatório para usuários do tipo 'prefeitura'.");
  }

  const senhaHash = await bcrypt.hash(String(senha || '123456'), 8);

  const sql = `
    INSERT INTO usuarios (nome, email, senha, tipo, setor, cpf, telefone, endereco)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const { lastID } = await db.run(sql, [nome, email, senhaHash, tipo, setor, cpf || null, telefone || null, endereco || null]);

  return findById(lastID);
}

// Exclui um usuário por ID
export async function remove(id) {
  const result = await db.run("DELETE FROM usuarios WHERE id = ?", [id]);
  return result.changes > 0;
}

// Atualiza dados do usuário (nome, email e setor — setor só se tipo for 'prefeitura')
export async function update(id, userData) {
  const { nome, email, setor, cpf, telefone, endereco } = userData;

  const existing = await findById(id);
  if (!existing) return null;

  const updates = [];
  const params = [];

  if (typeof nome === "string" && nome.trim() !== "") {
    updates.push("nome = ?");
    params.push(nome.trim());
  }

  if (typeof email === "string" && email.trim() !== "") {
    updates.push("email = ?");
    params.push(email.trim());
  }

  // só atualiza o setor se o usuário for do tipo 'prefeitura'
  if (typeof setor !== "undefined" && existing.tipo === "prefeitura") {
    updates.push("setor = ?");
    params.push(setor);
  }

  if (typeof cpf === "string" && cpf.trim() !== "") {
    updates.push("cpf = ?");
    params.push(cpf.trim());
  }
  if (typeof telefone === "string" && telefone.trim() !== "") {
    updates.push("telefone = ?");
    params.push(telefone.trim());
  }
  if (typeof endereco === "string" && endereco.trim() !== "") {
    updates.push("endereco = ?");
    params.push(endereco.trim());
  }

  if (updates.length === 0) {
    return findById(id); // nada a alterar
  }

  const sql = `UPDATE usuarios SET ${updates.join(", ")} WHERE id = ?`;
  params.push(id);

  await db.run(sql, params);
  return findById(id);
}
