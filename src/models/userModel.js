import bcrypt from 'bcryptjs';
import { db } from '../config/database.js';

export const userModel = {
  findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  findById(id) {
    const stmt = db.prepare('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?');
    return stmt.get(id);
  },

  create({ name, email, password, role = 'user' }) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const stmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(name, email.toLowerCase().trim(), passwordHash, role);
    return this.findById(Number(result.lastInsertRowid));
  },

  verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password_hash);
  },

  updateRole(userId, newRole) {
    const stmt = db.prepare(`
      UPDATE users 
      SET role = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(newRole, userId);
    return this.findById(userId);
  },

  listAll() {
    const stmt = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    return stmt.all();
  }
};

export default userModel;
