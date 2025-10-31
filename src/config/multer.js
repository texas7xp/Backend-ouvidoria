import multer from 'multer';
import { resolve, extname } from 'path';

export default {
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // __dirname não existe em ES Modules, usamos 'src/uploads'
      cb(null, resolve('src/uploads')); 
    },
    filename: (req, file, cb) => {
      // Garante um nome de arquivo único
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    // Filtro simples para aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo inválido! Apenas imagens são permitidas.'), false);
    }
  },
};