import { userModel } from '../models/userModel.js';
import { categoryModel } from '../models/categoryModel.js';
import { generateToken } from '../middleware/authMiddleware.js';

export const authController = {
  renderLogin(req, res) {
    if (req.user) return res.redirect('/dashboard');
    res.render('auth/login', {
      title: 'Iniciar Sesión',
      error: null,
      success: null
    });
  },

  renderRegister(req, res) {
    if (req.user) return res.redirect('/dashboard');
    res.render('auth/register', {
      title: 'Crear Cuenta',
      error: null,
      success: null
    });
  },

  async handleLogin(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        if (req.xhr || req.headers.accept?.includes('json')) {
          return res.status(400).json({ success: false, error: 'Ingresa correo y contraseña' });
        }
        return res.render('auth/login', {
          title: 'Iniciar Sesión',
          error: 'Por favor ingresa tu correo y contraseña.',
          success: null
        });
      }

      const user = userModel.findByEmail(email.toLowerCase().trim());
      if (!user || !userModel.verifyPassword(user, password)) {
        if (req.xhr || req.headers.accept?.includes('json')) {
          return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }
        return res.render('auth/login', {
          title: 'Iniciar Sesión',
          error: 'Correo o contraseña incorrectos.',
          success: null
        });
      }

      const token = generateToken(user);
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      });

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.json({
          success: true,
          message: 'Inicio de sesión exitoso',
          redirect: '/dashboard',
          user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
      }

      return res.redirect('/dashboard');
    } catch (err) {
      console.error('Error en handleLogin:', err);
      res.status(500).render('auth/login', {
        title: 'Iniciar Sesión',
        error: 'Ocurrió un error al procesar tu solicitud.',
        success: null
      });
    }
  },

  async handleRegister(req, res) {
    try {
      const { name, email, password, confirmPassword } = req.body;

      if (!name || !email || !password) {
        const error = 'Todos los campos son requeridos.';
        if (req.xhr || req.headers.accept?.includes('json')) {
          return res.status(400).json({ success: false, error });
        }
        return res.render('auth/register', { title: 'Crear Cuenta', error, success: null });
      }

      if (confirmPassword && password !== confirmPassword) {
        const error = 'Las contraseñas no coinciden.';
        if (req.xhr || req.headers.accept?.includes('json')) {
          return res.status(400).json({ success: false, error });
        }
        return res.render('auth/register', { title: 'Crear Cuenta', error, success: null });
      }

      if (password.length < 6) {
        const error = 'La contraseña debe tener al menos 6 caracteres.';
        if (req.xhr || req.headers.accept?.includes('json')) {
          return res.status(400).json({ success: false, error });
        }
        return res.render('auth/register', { title: 'Crear Cuenta', error, success: null });
      }

      const existing = userModel.findByEmail(email.toLowerCase().trim());
      if (existing) {
        const error = 'Ya existe una cuenta con este correo electrónico.';
        if (req.xhr || req.headers.accept?.includes('json')) {
          return res.status(400).json({ success: false, error });
        }
        return res.render('auth/register', { title: 'Crear Cuenta', error, success: null });
      }

      // Crear usuario
      const newUser = userModel.create({
        name,
        email,
        password,
        role: 'user'
      });

      // Crear categorías iniciales por defecto para el usuario nuevo
      categoryModel.create({ userId: newUser.id, name: 'Salud & Deporte', color: '#10b981', icon: 'heart-pulse' });
      categoryModel.create({ userId: newUser.id, name: 'Trabajo / Proyectos', color: '#3b82f6', icon: 'briefcase' });
      categoryModel.create({ userId: newUser.id, name: 'Estudio & Aprendizaje', color: '#6366f1', icon: 'book-open' });
      categoryModel.create({ userId: newUser.id, name: 'Personal', color: '#ec4899', icon: 'user' });

      const token = generateToken(newUser);
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      });

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.json({
          success: true,
          message: 'Cuenta creada exitosamente',
          redirect: '/dashboard',
          user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
        });
      }

      return res.redirect('/dashboard');
    } catch (err) {
      console.error('Error en handleRegister:', err);
      res.status(500).render('auth/register', {
        title: 'Crear Cuenta',
        error: 'Ocurrió un error al crear la cuenta.',
        success: null
      });
    }
  },

  handleLogout(req, res) {
    res.clearCookie('token');
    return res.redirect('/login');
  },

  getCurrentUser(req, res) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }
    return res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  }
};

export default authController;
