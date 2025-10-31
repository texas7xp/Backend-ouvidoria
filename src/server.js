import app from './app.js';

const port = process.env.PORT || 3333;

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  // A conexão com o banco já foi feita em 'src/config/database.js'
});