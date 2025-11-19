import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

// Função para abrir a conexão com o banco
async function openDb() {
  const filename = process.env.DATABASE_PATH || './src/db/database.db';
  return open({
    filename,
    driver: sqlite3.Database,
  });
}

const senhaHash = await bcrypt.hash('123456', 8);

// Função para criar as tabelas (Migração)
export async function setupDatabase() {
  const db = await openDb();
  console.log('Conectado ao banco SQLite.');

  // Usamos PRAGMA foreign_keys=ON para garantir a integridade referencial
  await db.exec('PRAGMA foreign_keys=ON;');

  // SQL para criar as tabelas
  const createTablesSQL = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL DEFAULT '${senhaHash}',
      tipo TEXT NOT NULL CHECK(tipo IN ('cidadao', 'prefeitura')) DEFAULT 'cidadao',
      setor TEXT,
      cpf TEXT,
      telefone TEXT,
      endereco TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cidadao_id INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'aberto' CHECK(status IN ('aberto', 'em_atendimento', 'finalizado')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cidadao_id) REFERENCES usuarios (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS interacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      usuario_id INTEGER NOT NULL, -- ID de quem fez a interação (cidadao ou prefeitura)
      descricao TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    );

    CREATE TABLE IF NOT EXISTS anexos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER, -- Anexo do ticket original
      interacao_id INTEGER, -- Anexo de uma interação
      path TEXT NOT NULL,
      filename TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
      FOREIGN KEY (interacao_id) REFERENCES interacoes (id) ON DELETE CASCADE
    );
    
    -- Triggers para atualizar 'updated_at' automaticamente
    CREATE TRIGGER IF NOT EXISTS trigger_usuarios_updated_at
    AFTER UPDATE ON usuarios
    FOR EACH ROW
    BEGIN
      UPDATE usuarios SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trigger_tickets_updated_at
    AFTER UPDATE ON tickets
    FOR EACH ROW
    BEGIN
      UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trigger_interacoes_updated_at
    AFTER UPDATE ON interacoes
    FOR EACH ROW
    BEGIN
      UPDATE interacoes SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

    INSERT OR IGNORE INTO usuarios (nome, email, senha, tipo, setor)
    VALUES
      ('Adm da Prefeitura 1', 'adm_prefeitura1@email.com.br', '${senhaHash}', 'prefeitura', 'Setor 1'),
      ('Adm da Prefeitura 2', 'adm_prefeitura2@email.com.br', '${senhaHash}', 'prefeitura', 'Setor 2'),
      ('cidadao_1', 'cidadao_1@email.com.br', '${senhaHash}', 'cidadao', NULL),
      ('cidadao_2', 'cidadao_2@email.com.br', '${senhaHash}', 'cidadao', NULL);
  `;

  await db.exec(createTablesSQL);
  console.log('Tabelas criadas ou já existentes.');

  // Migração: adiciona colunas ausentes em 'usuarios' se não existirem
  const cols = await db.all("PRAGMA table_info('usuarios')");
  const names = new Set(cols.map((c) => c.name));
  const addCol = async (name, type) => {
    if (!names.has(name)) {
      await db.exec(`ALTER TABLE usuarios ADD COLUMN ${name} ${type}`);
      console.log(`Coluna adicionada: usuarios.${name}`);
    }
  };
  await addCol('cpf', 'TEXT');
  await addCol('telefone', 'TEXT');
  await addCol('endereco', 'TEXT');

  return db;
}

// Exporta a instância do banco para ser usada nos models
export const db = await setupDatabase();