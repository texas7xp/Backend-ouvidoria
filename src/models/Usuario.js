import { db } from "../config/database.js";
import bcrypt from "bcryptjs";

// Encontra usuário por ID (sem a senha)
export async function findById(id) {
  const user = await db.get(
    "SELECT id, nome, email, tipo, setor, created_at, updated_at FROM usuarios WHERE id = ?",
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
    "SELECT id, nome, email, tipo, setor, created_at, updated_at FROM usuarios"
  );
  return users;
}

// Cria um novo usuário
export async function create(userData) {
  let { nome, email, tipo, setor } = userData;

  // Hash da senha
  //const senhaHash = await bcrypt.hash(senha, 8);

  if (typeof tipo === 'undefined') {
    tipo = "cidadao";
    setor = null;
  }

  if (tipo === 'prefeitura' && (typeof setor === 'undefined' || setor === null)) {
    throw new Error("Setor é obrigatório para usuários do tipo 'prefeitura'.");
  }

  const sql = `
    INSERT INTO usuarios (nome, email, tipo, setor)
    VALUES (?, ?, ?, ?)
  `;

  const { lastID } = await db.run(sql, [nome, email, tipo, setor]);

  return findById(lastID);
}

// Exclui um usuário por ID
export async function remove(id) {
  const result = await db.run("DELETE FROM usuarios WHERE id = ?", [id]);
  return result.changes > 0;
}

// Atualiza dados do usuário (nome, email e setor — setor só se tipo for 'prefeitura')
export async function update(id, userData) {
  const { nome, email, setor } = userData;

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

  if (updates.length === 0) {
    return findById(id); // nada a alterar
  }

  const sql = `UPDATE usuarios SET ${updates.join(", ")} WHERE id = ?`;
  params.push(id);

  await db.run(sql, params);
  return findById(id);
}
