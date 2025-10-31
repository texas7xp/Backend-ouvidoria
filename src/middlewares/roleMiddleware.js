// Middleware para checar se é da Prefeitura
export const isPrefeitura = (req, res, next) => {
  if (req.userTipo !== 'prefeitura') {
    return res.status(403).json({ error: 'Acesso negado. Rota exclusiva para Prefeitura.' });
  }
  return next();
};

// Middleware para checar se é Cidadão
export const isCidadao = (req, res, next) => {
    if (req.userTipo !== 'cidadao') {
      return res.status(403).json({ error: 'Acesso negado. Rota exclusiva para Cidadãos.' });
    }
    return next();
  };