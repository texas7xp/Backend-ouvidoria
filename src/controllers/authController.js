import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as Usuario from '../models/Usuario.js';
import authConfig from '../config/auth.js';

// Função para gerar o token
function generateToken(user) {
  const { id, tipo, setor, nome } = user;
  return jwt.sign({ id, tipo, setor, nome }, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn,
  });
}

// POST /signup
export async function signup(req, res) {
  const { email } = req.body;
  const body = {
    nome: String(req.body?.nome || '').trim(),
    email: String(req.body?.email || '').trim().toLowerCase(),
    senha: String(req.body?.senha || ''),
    tipo: req.body?.tipo,
    setor: req.body?.setor,
    cpf: req.body?.cpf,
    telefone: req.body?.telefone,
    endereco: req.body?.endereco,
  };

  // Validações básicas
  const isEmailValid = (e) => /.+@.+\..+/.test(e);
  const onlyDigits = (s) => String(s || '').replace(/\D+/g, '');
  const isCpfValid = (cpf) => {
    const d = onlyDigits(cpf);
    if (d.length !== 11) return false;
    if (/^(\d)\1+$/.test(d)) return false;
    return true; // validação simplificada para este contexto
  };
  const isPhoneValid = (tel) => {
    const d = onlyDigits(tel);
    return d.length >= 10 && d.length <= 11;
  };

  if (!body.nome) return res.status(400).json({ error: 'Nome é obrigatório.' });
  if (!isEmailValid(body.email)) return res.status(400).json({ error: 'E-mail inválido.' });
  if (body.senha && body.senha.length < 6) return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres.' });
  if (body.cpf && !isCpfValid(body.cpf)) return res.status(400).json({ error: 'CPF inválido.' });
  if (body.telefone && !isPhoneValid(body.telefone)) return res.status(400).json({ error: 'Telefone inválido.' });
  
  try {
    // Verifica se o usuário já existe
    const userExists = await Usuario.findByEmail(body.email);
    if (userExists) {
      return res.status(400).json({ error: 'Este e-mail já está em uso.' });
    }

    // Cria o usuário
    const user = await Usuario.create(body);

    // Gera o token
    const token = generateToken(user);
    
    // Retorna o usuário (sem a senha) e o token
    const { senha, ...userWithoutPassword } = user;
    return res.status(201).json({ user: userWithoutPassword, token });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Falha no registro.' });
  }
}

// POST /signin (User pediu GET, mas POST é o correto para enviar body)
export async function signin(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const senha = String(req.body?.senha || '');

  console.log('Tentativa de login para o email:', email);

  try {
    const user = await Usuario.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    // Compara a senha enviada com o hash salvo
    const passwordMatch = await bcrypt.compare(senha, user.senha);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    // Gera o token
    const token = generateToken(user);

    // Retorna o usuário (sem a senha) e o token
    const { senha: _, ...userWithoutPassword } = user;
    return res.status(200).json({ user: userWithoutPassword, token });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Falha no login.' });
  }
}

// POST /signout (User pediu GET, mas POST é mais semântico)
export async function signout(req, res) {
  // Em JWT, o "logout" é feito no cliente (apagando o token).
  // O backend apenas confirma que a rota existe.
  return res.status(200).json({ message: 'Logout realizado com sucesso. Apague o token no cliente.' });
}

// GET /usuario (Retorna dados do usuário logado pelo token)
export async function getUsuario(req, res) {
    try {
        const user = await Usuario.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        return res.status(200).json(user);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar dados do usuário.' });
    }
}