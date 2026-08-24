import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { attachUser } from './middleware/authMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import viewRoutes from './routes/viewRoutes.js';
import apiRoutes from './routes/apiRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuración de Motor de Plantillas (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares estándar
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Archivos estáticos (CSS, JS, iconos, imágenes)
app.use(express.static(path.join(__dirname, '../public')));

// Middleware para inyectar usuario actual en todas las vistas y requests
app.use(attachUser);

// Registro de Rutas
app.use('/', authRoutes);
app.use('/', viewRoutes);
app.use('/api', apiRoutes);

// Manejo de Error 404
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'Recurso no encontrado' });
  }
  res.status(404).render('pages/error', {
    title: 'Página no encontrada (404)',
    message: 'La página que estás buscando no existe o ha sido movida.',
    statusCode: 404
  });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('⚠️ Error no controlado:', err);
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
  res.status(500).render('pages/error', {
    title: 'Error Interno (500)',
    message: 'Ocurrió un error inesperado en el servidor.',
    statusCode: 500
  });
});

export default app;
