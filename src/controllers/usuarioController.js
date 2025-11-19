import * as Usuario from "../models/Usuario.js";

// GET /usuarios (Apenas Prefeitura)
export async function getAllUsuarios(req, res) {
  try {
    const usuarios = await Usuario.findAll();
    return res.status(200).json(usuarios);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao listar usuários." });
  }
}

export async function deleteUsuario(req, res) {
  const { id } = req.params;

  try {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const changes = await Usuario.remove(id);
    if (changes)
      return res.status(200).json({ message: "Usuário excluído com sucesso." });

    return res.status(200).json({ message: "Nenhuma alteração realizada" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao excluir usuário." });
  }
}

export async function updateUsuario(req, res) {
  const { id } = req.params;
  const { nome, email, setor, cpf, telefone, endereco } = req.body;

  if (!nome && !email && typeof setor === "undefined" && !cpf && !telefone && !endereco) {
    return res.status(400).json({ error: "Nenhum campo para atualizar." });
  }

  try {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const onlyDigits = (s) => String(s || '').replace(/\D+/g, '');
    const isEmailValid = (e) => /.+@.+\..+/.test(e);
    const isCpfValid = (cpf) => {
      const d = onlyDigits(cpf);
      if (d.length !== 11) return false;
      if (/^(\d)\1+$/.test(d)) return false;
      return true;
    };
    const isPhoneValid = (tel) => {
      const d = onlyDigits(tel);
      return d.length >= 10 && d.length <= 11;
    };

    const updateData = {};
    if (nome) updateData.nome = String(nome).trim();
    if (email) {
      const norm = String(email).trim().toLowerCase();
      if (!isEmailValid(norm)) return res.status(400).json({ error: 'E-mail inválido.' });
      updateData.email = norm;
    }

    // Permite alteração de setor somente para contexto "prefeitura".
    // Verifica possíveis campos de sessão/autenticação (ajuste conforme sua aplicação)
    const isPrefeitura = usuario.tipo === "prefeitura";

    console.log(isPrefeitura, " isPrefeitura");
    if (typeof setor !== "undefined") {
      if (!isPrefeitura) {
        return res
          .status(403)
          .json({ error: "Permissão negada para alterar setor." });
      }
      updateData.setor = setor;
    }

    if (cpf) {
      if (!isCpfValid(cpf)) return res.status(400).json({ error: 'CPF inválido.' });
      updateData.cpf = onlyDigits(cpf);
    }
    if (telefone) {
      if (!isPhoneValid(telefone)) return res.status(400).json({ error: 'Telefone inválido.' });
      updateData.telefone = onlyDigits(telefone);
    }
    if (endereco) updateData.endereco = String(endereco).trim();

    const result = await Usuario.update(id, updateData);

    // Ajuste conforme contrato do model: result pode ser objeto atualizado ou número de alterações
    if (!result) {
      return res.status(200).json({ message: "Nenhuma alteração realizada." });
    }

    return res
      .status(200)
      .json({ message: "Usuário atualizado com sucesso.", usuario: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao atualizar usuário." });
  }
}

// Outras funções (getById, update, delete) podem ser adicionadas aqui
