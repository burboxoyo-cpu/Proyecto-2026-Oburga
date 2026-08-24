import { taskModel } from '../models/taskModel.js';
import { categoryModel } from '../models/categoryModel.js';

export const taskController = {
  renderTasks(req, res) {
    const userId = req.user.id;
    const { status, priority, category, search, view } = req.query;

    const tasks = taskModel.getAllByUserId(userId, {
      status,
      priority,
      categoryId: category ? Number(category) : null,
      search
    });
    const categories = categoryModel.getByUserId(userId);

    // Agrupación de tareas para vista Kanban
    const kanban = {
      pending: tasks.filter(t => t.status === 'pending'),
      in_progress: tasks.filter(t => t.status === 'in_progress'),
      completed: tasks.filter(t => t.status === 'completed')
    };

    res.render('pages/tasks', {
      title: 'Mis Tareas',
      tasks,
      kanban,
      categories,
      currentFilters: {
        status: status || 'all',
        priority: priority || 'all',
        category: category || 'all',
        search: search || '',
        view: view || 'board' // 'board' o 'list'
      }
    });
  },

  listTasksJson(req, res) {
    try {
      const userId = req.user.id;
      const { status, priority, category, search } = req.query;

      const tasks = taskModel.getAllByUserId(userId, {
        status,
        priority,
        categoryId: category ? Number(category) : null,
        search
      });

      return res.json({ success: true, data: tasks });
    } catch (err) {
      console.error('Error listTasksJson:', err);
      return res.status(500).json({ success: false, error: 'Error al consultar tareas' });
    }
  },

  getTaskJson(req, res) {
    try {
      const { id } = req.params;
      const task = taskModel.getById(Number(id), req.user.id);
      if (!task) {
        return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
      }
      return res.json({ success: true, data: task });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Error al consultar tarea' });
    }
  },

  createTask(req, res) {
    try {
      const userId = req.user.id;
      const { title, description, categoryId, priority, dueDate, status, checklistItems } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'El título de la tarea es requerido' });
      }

      let parsedItems = [];
      if (checklistItems) {
        parsedItems = typeof checklistItems === 'string' ? JSON.parse(checklistItems) : checklistItems;
      }

      const task = taskModel.create({
        userId,
        title,
        description,
        categoryId: categoryId ? Number(categoryId) : null,
        priority: priority || 'medium',
        dueDate: dueDate || null,
        status: status || 'pending',
        checklistItems: parsedItems
      });

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(201).json({ success: true, data: task, message: 'Tarea creada exitosamente' });
      }

      return res.redirect('/tasks');
    } catch (err) {
      console.error('Error createTask:', err);
      return res.status(500).json({ success: false, error: 'Error al crear la tarea' });
    }
  },

  updateTask(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { title, description, categoryId, priority, dueDate, status } = req.body;

      const updated = taskModel.update(Number(id), userId, {
        title,
        description,
        categoryId: categoryId !== undefined ? (categoryId ? Number(categoryId) : null) : undefined,
        priority,
        dueDate: dueDate !== undefined ? (dueDate || null) : undefined,
        status
      });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
      }

      return res.json({ success: true, data: updated, message: 'Tarea actualizada correctamente' });
    } catch (err) {
      console.error('Error updateTask:', err);
      return res.status(500).json({ success: false, error: 'Error al actualizar la tarea' });
    }
  },

  updateStatus(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { status } = req.body;

      const updated = taskModel.updateStatus(Number(id), userId, status);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Tarea no encontrada o estado inválido' });
      }

      return res.json({ success: true, data: updated, message: 'Estado actualizado correctamente' });
    } catch (err) {
      console.error('Error updateStatus:', err);
      return res.status(500).json({ success: false, error: 'Error al actualizar estado de la tarea' });
    }
  },

  deleteTask(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const success = taskModel.delete(Number(id), userId);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
      }

      return res.json({ success: true, message: 'Tarea eliminada correctamente' });
    } catch (err) {
      console.error('Error deleteTask:', err);
      return res.status(500).json({ success: false, error: 'Error al eliminar la tarea' });
    }
  }
};

export default taskController;
