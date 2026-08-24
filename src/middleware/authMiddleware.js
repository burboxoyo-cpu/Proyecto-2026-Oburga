import jwt from 'jsonwebtoken';
import { userModel } from '../models/userModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_2026';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function attachUser(req, res, next) {
  let token = null;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  res.locals.currentUser = null;
  res.locals.currentPath = req.path;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = userModel.findById(decoded.id);
      if (user) {
        req.user = user;
        res.locals.currentUser = user;
      }
    } catch (err) {
      res.clearCookie('token');
    }
  }

  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({
        success: false,
        error: 'Sesión expirada o no autorizada. Por favor inicia sesión.'
      });
    }
    return res.redirect('/login');
  }
  next();
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({ success: false, error: 'No autenticado' });
      }
      return res.redirect('/login');
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(403).json({ success: false, error: 'Permisos insuficientes para esta acción' });
      }
      return res.status(403).render('pages/error', {
        title: 'Acceso Denegado',
        message: 'No tienes los permisos necesarios para acceder a esta sección.',
        statusCode: 403
      });
    }

    next();
  };
}

export default {
  generateToken,
  attachUser,
  requireAuth,
  requireRole
};
