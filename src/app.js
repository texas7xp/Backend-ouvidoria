import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { resolve } from 'path';
import allRoutes from './routes/index.js';
import multer from 'multer';

class App {
  constructor() {
    this.server = express();
    this.middlewares();
    this.routes();
    this.exceptionHandler();
  }

  middlewares() {
    // CORS (permite acesso de qualquer frontend)
    this.server.use(cors()); 
    
    // Habilita o Express para ler JSON do body
    this.server.use(express.json());
    
    // Habilita o Express para ler 'form-data' (necessário para o Multer)
    this.server.use(express.urlencoded({ extended: true }));

    // Serve os arquivos estáticos (fotos) da pasta 'uploads'
    // Ex: http://localhost:3000/files/nome-do-arquivo.jpg
    this.server.use(
      '/files', 
      express.static(resolve('src/uploads'))
    );
  }

  routes() {
    this.server.use(allRoutes);
  }

  exceptionHandler() {
    // Middleware de tratamento de erro (ex: erro do Multer)
    this.server.use((err, req, res, next) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
      }
      
      // Tratamento de erro de upload (filtro de arquivo)
      if (err) {
         return res.status(400).json({ error: err.message });
      }

      // Erro interno do servidor
      console.error(err);
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    });
  }
}

export default new App().server;