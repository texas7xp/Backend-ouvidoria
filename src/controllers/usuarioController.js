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
  const { nome, email, setor } = req.body;

  if (!nome && !email && typeof setor === "undefined") {
    return res.status(400).json({ error: "Nenhum campo para atualizar." });
  }

  try {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const updateData = {};
    if (nome) updateData.nome = nome;
    if (email) updateData.email = email;

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
