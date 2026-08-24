import { db } from '../config/database.js';
import { checklistModel } from './checklistModel.js';

export const taskModel = {
  getAllByUserId(userId, { status = null, priority = null, categoryId = null, search = '' } = {}) {
    let sql = `
      SELECT t.*, c.name as category_name, c.color as category_color
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    const params = [userId];

    if (status && status !== 'all') {
      sql += ' AND t.status = ?';
      params.push(status);
    }

    if (priority && priority !== 'all') {
      sql += ' AND t.priority = ?';
      params.push(priority);
    }

    if (categoryId && categoryId !== 'all') {
      sql += ' AND t.category_id = ?';
      params.push(Number(categoryId));
    }

    if (search && search.trim()) {
      sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      const queryPattern = `%${search.trim()}%`;
      params.push(queryPattern, queryPattern);
    }

    sql += `
      ORDER BY 
        CASE t.status 
          WHEN 'in_progress' THEN 1 
          WHEN 'pending' THEN 2 
          WHEN 'completed' THEN 3 
          ELSE 4 
        END,
        CASE t.priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
          ELSE 4 
        END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
    `;

    const stmt = db.prepare(sql);
    const tasks = stmt.all(...params);

    return tasks.map(task => {
      const checklist = checklistModel.getProgress('task', task.id);
      return {
        ...task,
        checklist
      };
    });
  },

  getById(id, userId) {
    const stmt = db.prepare(`
      SELECT t.*, c.name as category_name, c.color as category_color
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ? AND t.user_id = ?
    `);
    const task = stmt.get(id, userId);
    if (!task) return null;

    const checklist = checklistModel.getProgress('task', task.id);
    return {
      ...task,
      checklist
    };
  },

  create({ userId, title, description = '', categoryId = null, priority = 'medium', dueDate = null, status = 'pending', checklistItems = [] }) {
    const stmt = db.prepare(`
      INSERT INTO tasks (user_id, title, description, category_id, priority, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      userId,
      title.trim(),
      description ? description.trim() : '',
      categoryId ? Number(categoryId) : null,
      priority || 'medium',
      dueDate || null,
      status || 'pending'
    );
    const taskId = Number(result.lastInsertRowid);

    // Agregar micro-objetivos si se proporcionan
    if (Array.isArray(checklistItems)) {
      checklistItems.forEach((itemText, idx) => {
        if (typeof itemText === 'string' && itemText.trim()) {
          checklistModel.create({ parentType: 'task', parentId: taskId, title: itemText.trim(), position: idx });
        } else if (itemText && itemText.title) {
          checklistModel.create({ parentType: 'task', parentId: taskId, title: itemText.title.trim(), position: idx });
        }
      });
    }

    return this.getById(taskId, userId);
  },

  update(id, userId, { title, description, categoryId, priority, dueDate, status }) {
    const current = this.getById(id, userId);
    if (!current) return null;

    const stmt = db.prepare(`
      UPDATE tasks
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          category_id = ?,
          priority = COALESCE(?, priority),
          due_date = ?,
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `);

    stmt.run(
      title !== undefined ? title.trim() : null,
      description !== undefined ? description.trim() : null,
      categoryId !== undefined ? (categoryId ? Number(categoryId) : null) : current.category_id,
      priority || null,
      dueDate !== undefined ? (dueDate || null) : current.due_date,
      status || null,
      id,
      userId
    );

    return this.getById(id, userId);
  },

  updateStatus(id, userId, status) {
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) return null;

    const stmt = db.prepare(`
      UPDATE tasks
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(status, id, userId);
    return this.getById(id, userId);
  },

  delete(id, userId) {
    checklistModel.deleteByParent('task', id);
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }
};

export default taskModel;
