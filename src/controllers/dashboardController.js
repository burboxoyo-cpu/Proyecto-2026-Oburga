import { habitModel } from '../models/habitModel.js';
import { taskModel } from '../models/taskModel.js';
import { categoryModel } from '../models/categoryModel.js';

export const dashboardController = {
  renderDashboard(req, res) {
    const userId = req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];

    const habits = habitModel.getAllByUserId(userId);
    const tasks = taskModel.getAllByUserId(userId);
    const categories = categoryModel.getByUserId(userId);

    // Métricas de hábitos
    const totalHabits = habits.length;
    const completedHabitsToday = habits.filter(h => h.completedToday).length;
    const habitsCompletionPct = totalHabits > 0 ? Math.round((completedHabitsToday / totalHabits) * 100) : 0;
    const maxCurrentStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak), 0) : 0;

    // Métricas de tareas
    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const tasksCompletionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Micro-objetivos totales
    let totalMicroGoals = 0;
    let completedMicroGoals = 0;
    habits.forEach(h => {
      totalMicroGoals += h.checklist.total;
      completedMicroGoals += h.checklist.completed;
    });
    tasks.forEach(t => {
      totalMicroGoals += t.checklist.total;
      completedMicroGoals += t.checklist.completed;
    });

    const recentTasks = tasks.slice(0, 6);

    res.render('pages/dashboard', {
      title: 'Panel Principal',
      todayStr,
      habits,
      tasks: recentTasks,
      categories,
      stats: {
        totalHabits,
        completedHabitsToday,
        habitsCompletionPct,
        maxCurrentStreak,
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        tasksCompletionPct,
        totalMicroGoals,
        completedMicroGoals
      }
    });
  },

  renderStats(req, res) {
    const userId = req.user.id;
    const habits = habitModel.getAllByUserId(userId);
    const tasks = taskModel.getAllByUserId(userId);
    const categories = categoryModel.getByUserId(userId);

    res.render('pages/stats', {
      title: 'Estadísticas y Rendimiento',
      habits,
      tasks,
      categories
    });
  },

  getStatsJson(req, res) {
    const userId = req.user.id;
    const habits = habitModel.getAllByUserId(userId);
    const tasks = taskModel.getAllByUserId(userId);
    const categories = categoryModel.getByUserId(userId);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const monthlyActivity = habitModel.getMonthlyActivity(userId, currentYear, currentMonth);

    // Tareas por estado
    const tasksByStatus = {
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length
    };

    // Tareas por prioridad
    const tasksByPriority = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    };

    // Hábitos por categoría
    const habitsByCategory = categories.map(cat => ({
      name: cat.name,
      color: cat.color,
      count: habits.filter(h => h.category_id === cat.id).length
    }));

    return res.json({
      success: true,
      data: {
        habitsCount: habits.length,
        completedHabitsToday: habits.filter(h => h.completedToday).length,
        tasksByStatus,
        tasksByPriority,
        habitsByCategory,
        monthlyActivity
      }
    });
  }
};

export default dashboardController;
