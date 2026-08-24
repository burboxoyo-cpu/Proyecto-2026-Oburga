import { habitModel } from '../models/habitModel.js';
import { categoryModel } from '../models/categoryModel.js';

export const habitController = {
  renderHabits(req, res) {
    const userId = req.user.id;
    const { category } = req.query;

    const habits = habitModel.getAllByUserId(userId, {
      categoryId: category ? Number(category) : null
    });
    const categories = categoryModel.getByUserId(userId);
    const todayStr = new Date().toISOString().split('T')[0];

    res.render('pages/habits', {
      title: 'Mis Hábitos',
      habits,
      categories,
      selectedCategory: category || 'all',
      todayStr
    });
  },

  listHabitsJson(req, res) {
    try {
      const userId = req.user.id;
      const { category, isArchived } = req.query;

      const habits = habitModel.getAllByUserId(userId, {
        categoryId: category ? Number(category) : null,
        isArchived: isArchived === '1' ? 1 : 0
      });

      return res.json({ success: true, data: habits });
    } catch (err) {
      console.error('Error listHabitsJson:', err);
      return res.status(500).json({ success: false, error: 'Error al obtener hábitos' });
    }
  },

  getHabitJson(req, res) {
    try {
      const { id } = req.params;
      const habit = habitModel.getById(Number(id), req.user.id);
      if (!habit) {
        return res.status(404).json({ success: false, error: 'Hábito no encontrado' });
      }
      return res.json({ success: true, data: habit });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Error al consultar hábito' });
    }
  },

  createHabit(req, res) {
    try {
      const userId = req.user.id;
      const { title, description, categoryId, frequency, targetDays, color, icon, checklistItems } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'El título del hábito es requerido' });
      }

      let parsedItems = [];
      if (checklistItems) {
        parsedItems = typeof checklistItems === 'string' ? JSON.parse(checklistItems) : checklistItems;
      }

      const habit = habitModel.create({
        userId,
        title,
        description,
        categoryId: categoryId ? Number(categoryId) : null,
        frequency: frequency || 'daily',
        targetDays: Number(targetDays) || 1,
        color: color || '#6366f1',
        icon: icon || 'flame',
        checklistItems: parsedItems
      });

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(201).json({ success: true, data: habit, message: 'Hábito creado exitosamente' });
      }

      return res.redirect('/habits');
    } catch (err) {
      console.error('Error createHabit:', err);
      return res.status(500).json({ success: false, error: 'Error al crear el hábito' });
    }
  },

  updateHabit(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { title, description, categoryId, frequency, targetDays, color, icon, isArchived } = req.body;

      const updated = habitModel.update(Number(id), userId, {
        title,
        description,
        categoryId: categoryId !== undefined ? (categoryId ? Number(categoryId) : null) : undefined,
        frequency,
        targetDays: targetDays !== undefined ? Number(targetDays) : undefined,
        color,
        icon,
        isArchived: isArchived !== undefined ? Boolean(Number(isArchived)) : undefined
      });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Hábito no encontrado' });
      }

      return res.json({ success: true, data: updated, message: 'Hábito actualizado correctamente' });
    } catch (err) {
      console.error('Error updateHabit:', err);
      return res.status(500).json({ success: false, error: 'Error al actualizar el hábito' });
    }
  },

  deleteHabit(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const success = habitModel.delete(Number(id), userId);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Hábito no encontrado' });
      }

      return res.json({ success: true, message: 'Hábito eliminado correctamente' });
    } catch (err) {
      console.error('Error deleteHabit:', err);
      return res.status(500).json({ success: false, error: 'Error al eliminar el hábito' });
    }
  },

  toggleLog(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { date } = req.body;

      const result = habitModel.toggleCompletion(Number(id), userId, date);
      const updatedHabit = habitModel.getById(Number(id), userId);

      return res.json({
        success: true,
        data: {
          ...result,
          habit: updatedHabit
        }
      });
    } catch (err) {
      console.error('Error toggleLog:', err);
      return res.status(500).json({ success: false, error: 'Error al registrar progreso de hábito' });
    }
  }
};

export default habitController;
