import { db } from '../config/database.js';

export const categoryModel = {
  getByUserId(userId) {
    const stmt = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM habits WHERE category_id = c.id) as habits_count,
        (SELECT COUNT(*) FROM tasks WHERE category_id = c.id) as tasks_count
      FROM categories c
      WHERE c.user_id = ?
      ORDER BY c.name ASC
    `);
    return stmt.all(userId);
  },

  getById(id, userId) {
    const stmt = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId);
  },

  create({ userId, name, color = '#6366f1', icon = 'tag' }) {
    const stmt = db.prepare(`
      INSERT INTO categories (user_id, name, color, icon)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(userId, name.trim(), color, icon);
    return this.getById(Number(result.lastInsertRowid), userId);
  },

  update(id, userId, { name, color, icon }) {
    const stmt = db.prepare(`
      UPDATE categories
      SET name = COALESCE(?, name),
          color = COALESCE(?, color),
          icon = COALESCE(?, icon)
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(name ? name.trim() : null, color || null, icon || null, id, userId);
    return this.getById(id, userId);
  },

  delete(id, userId) {
    const stmt = db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }
};

export default categoryModel;
