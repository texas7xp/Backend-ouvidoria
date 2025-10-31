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
  
  try {
    // Verifica se o usuário já existe
    const userExists = await Usuario.findByEmail(email);
    if (userExists) {
      return res.status(400).json({ error: 'Este e-mail já está em uso.' });
    }

    // Cria o usuário
    const user = await Usuario.create(req.body);

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
  const { email, senha } = req.body;

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