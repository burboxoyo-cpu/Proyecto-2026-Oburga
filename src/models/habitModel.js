import { db } from '../config/database.js';
import { checklistModel } from './checklistModel.js';

export const habitModel = {
  getAllByUserId(userId, { categoryId = null, isArchived = 0 } = {}) {
    let sql = `
      SELECT h.*, c.name as category_name, c.color as category_color
      FROM habits h
      LEFT JOIN categories c ON h.category_id = c.id
      WHERE h.user_id = ? AND h.is_archived = ?
    `;
    const params = [userId, isArchived ? 1 : 0];

    if (categoryId) {
      sql += ' AND h.category_id = ?';
      params.push(categoryId);
    }

    sql += ' ORDER BY h.created_at DESC';

    const stmt = db.prepare(sql);
    const habits = stmt.all(...params);

    const todayStr = new Date().toISOString().split('T')[0];

    return habits.map(habit => {
      const checklist = checklistModel.getProgress('habit', habit.id);
      const streakInfo = this.getStreak(habit.id, userId);
      const completedToday = this.isCompletedOn(habit.id, todayStr);
      const weeklyHistory = this.getLastNDays(habit.id, userId, 7);

      return {
        ...habit,
        checklist,
        streak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
        completedToday,
        weeklyHistory
      };
    });
  },

  getById(id, userId) {
    const stmt = db.prepare(`
      SELECT h.*, c.name as category_name, c.color as category_color
      FROM habits h
      LEFT JOIN categories c ON h.category_id = c.id
      WHERE h.id = ? AND h.user_id = ?
    `);
    const habit = stmt.get(id, userId);
    if (!habit) return null;

    const checklist = checklistModel.getProgress('habit', habit.id);
    const streakInfo = this.getStreak(habit.id, userId);
    const todayStr = new Date().toISOString().split('T')[0];
    const completedToday = this.isCompletedOn(habit.id, todayStr);
    const weeklyHistory = this.getLastNDays(habit.id, userId, 7);

    return {
      ...habit,
      checklist,
      streak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
      completedToday,
      weeklyHistory
    };
  },

  create({ userId, title, description = '', categoryId = null, frequency = 'daily', targetDays = 1, color = '#6366f1', icon = 'flame', checklistItems = [] }) {
    const stmt = db.prepare(`
      INSERT INTO habits (user_id, title, description, category_id, frequency, target_days, color, icon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      userId,
      title.trim(),
      description ? description.trim() : '',
      categoryId ? Number(categoryId) : null,
      frequency,
      Number(targetDays) || 1,
      color || '#6366f1',
      icon || 'flame'
    );
    const habitId = Number(result.lastInsertRowid);

    // Agregar micro-objetivos si se proporcionan
    if (Array.isArray(checklistItems)) {
      checklistItems.forEach((itemText, idx) => {
        if (typeof itemText === 'string' && itemText.trim()) {
          checklistModel.create({ parentType: 'habit', parentId: habitId, title: itemText.trim(), position: idx });
        } else if (itemText && itemText.title) {
          checklistModel.create({ parentType: 'habit', parentId: habitId, title: itemText.title.trim(), position: idx });
        }
      });
    }

    return this.getById(habitId, userId);
  },

  update(id, userId, { title, description, categoryId, frequency, targetDays, color, icon, isArchived }) {
    const current = this.getById(id, userId);
    if (!current) return null;

    const stmt = db.prepare(`
      UPDATE habits
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          category_id = ?,
          frequency = COALESCE(?, frequency),
          target_days = COALESCE(?, target_days),
          color = COALESCE(?, color),
          icon = COALESCE(?, icon),
          is_archived = COALESCE(?, is_archived),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `);

    stmt.run(
      title !== undefined ? title.trim() : null,
      description !== undefined ? description.trim() : null,
      categoryId !== undefined ? (categoryId ? Number(categoryId) : null) : current.category_id,
      frequency || null,
      targetDays !== undefined ? Number(targetDays) : null,
      color || null,
      icon || null,
      isArchived !== undefined ? (isArchived ? 1 : 0) : null,
      id,
      userId
    );

    return this.getById(id, userId);
  },

  delete(id, userId) {
    checklistModel.deleteByParent('habit', id);
    const stmt = db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  },

  toggleCompletion(habitId, userId, dateStr = null) {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];

    const checkStmt = db.prepare('SELECT id FROM habit_logs WHERE habit_id = ? AND completed_date = ?');
    const existing = checkStmt.get(habitId, targetDate);

    if (existing) {
      const delStmt = db.prepare('DELETE FROM habit_logs WHERE id = ?');
      delStmt.run(existing.id);
      return { completed: false, date: targetDate };
    } else {
      const insStmt = db.prepare('INSERT INTO habit_logs (habit_id, user_id, completed_date) VALUES (?, ?, ?)');
      insStmt.run(habitId, userId, targetDate);
      return { completed: true, date: targetDate };
    }
  },

  isCompletedOn(habitId, dateStr) {
    const stmt = db.prepare('SELECT id FROM habit_logs WHERE habit_id = ? AND completed_date = ?');
    const res = stmt.get(habitId, dateStr);
    return !!res;
  },

  getLastNDays(habitId, userId, daysCount = 7) {
    const results = [];
    const today = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const isCompleted = this.isCompletedOn(habitId, dateStr);

      results.push({
        date: dateStr,
        dayName: d.toLocaleDateString('es-ES', { weekday: 'narrow' }).toUpperCase(),
        dayNumber: d.getDate(),
        isToday: i === 0,
        isCompleted
      });
    }

    return results;
  },

  getStreak(habitId, userId) {
    const stmt = db.prepare(`
      SELECT completed_date 
      FROM habit_logs 
      WHERE habit_id = ? AND user_id = ? 
      ORDER BY completed_date DESC
    `);
    const logs = stmt.all(habitId, userId);

    if (!logs || logs.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const logDates = new Set(logs.map(l => l.completed_date));
    
    // Cálculo de racha actual
    let currentStreak = 0;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let checkDate = new Date(today);

    // Si no está completado hoy, comenzamos a contar desde ayer
    if (!logDates.has(todayStr)) {
      if (logDates.has(yesterdayStr)) {
        checkDate = yesterday;
      } else {
        // Racha rota
        checkDate = null;
      }
    }

    if (checkDate) {
      let iter = new Date(checkDate);
      while (true) {
        const iterStr = iter.toISOString().split('T')[0];
        if (logDates.has(iterStr)) {
          currentStreak++;
          iter.setDate(iter.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Cálculo de racha histórica más larga
    const sortedDates = Array.from(logDates).sort();
    let maxStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    for (const dStr of sortedDates) {
      const curr = new Date(dStr);
      if (prevDate) {
        const diffDays = Math.round((curr - prevDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      prevDate = curr;
      if (tempStreak > maxStreak) {
        maxStreak = tempStreak;
      }
    }

    return {
      currentStreak,
      longestStreak: Math.max(maxStreak, currentStreak)
    };
  },

  getMonthlyActivity(userId, year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const stmt = db.prepare(`
      SELECT completed_date, COUNT(*) as count
      FROM habit_logs
      WHERE user_id = ? AND completed_date BETWEEN ? AND ?
      GROUP BY completed_date
    `);
    return stmt.all(userId, startDate, endDate);
  }
};

export default habitModel;
