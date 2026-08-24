import { db } from '../config/database.js';

export const checklistModel = {
  getByParent(parentType, parentId) {
    const stmt = db.prepare(`
      SELECT * FROM checklist_items
      WHERE parent_type = ? AND parent_id = ?
      ORDER BY position ASC, id ASC
    `);
    return stmt.all(parentType, parentId);
  },

  getById(id) {
    const stmt = db.prepare('SELECT * FROM checklist_items WHERE id = ?');
    return stmt.get(id);
  },

  create({ parentType, parentId, title, position = 0 }) {
    if (position === 0) {
      const countStmt = db.prepare('SELECT COUNT(*) as count FROM checklist_items WHERE parent_type = ? AND parent_id = ?');
      const res = countStmt.get(parentType, parentId);
      position = res ? res.count : 0;
    }

    const stmt = db.prepare(`
      INSERT INTO checklist_items (parent_type, parent_id, title, is_completed, position)
      VALUES (?, ?, ?, 0, ?)
    `);
    const result = stmt.run(parentType, parentId, title.trim(), position);
    return this.getById(Number(result.lastInsertRowid));
  },

  update(id, { title, isCompleted, position }) {
    const current = this.getById(id);
    if (!current) return null;

    const newTitle = title !== undefined ? title.trim() : current.title;
    const newIsCompleted = isCompleted !== undefined ? (isCompleted ? 1 : 0) : current.is_completed;
    const newPos = position !== undefined ? position : current.position;

    const stmt = db.prepare(`
      UPDATE checklist_items
      SET title = ?, is_completed = ?, position = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(newTitle, newIsCompleted, newPos, id);
    return this.getById(id);
  },

  toggle(id) {
    const item = this.getById(id);
    if (!item) return null;

    const nextState = item.is_completed === 1 ? 0 : 1;
    const stmt = db.prepare(`
      UPDATE checklist_items
      SET is_completed = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(nextState, id);
    return this.getById(id);
  },

  delete(id) {
    const stmt = db.prepare('DELETE FROM checklist_items WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  deleteByParent(parentType, parentId) {
    const stmt = db.prepare('DELETE FROM checklist_items WHERE parent_type = ? AND parent_id = ?');
    const result = stmt.run(parentType, parentId);
    return result.changes;
  },

  getProgress(parentType, parentId) {
    const items = this.getByParent(parentType, parentId);
    const total = items.length;
    const completed = items.filter(item => item.is_completed === 1).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      total,
      completed,
      percentage,
      items
    };
  }
};

export default checklistModel;
