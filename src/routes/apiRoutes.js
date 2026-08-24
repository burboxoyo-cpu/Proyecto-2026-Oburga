import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authController } from '../controllers/authController.js';
import { habitController } from '../controllers/habitController.js';
import { taskController } from '../controllers/taskController.js';
import { checklistController } from '../controllers/checklistController.js';
import { categoryController } from '../controllers/categoryController.js';
import { dashboardController } from '../controllers/dashboardController.js';

const router = Router();

// Endpoint público de monitoreo / hosting healthcheck
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Todas las rutas de API siguientes requieren autenticación
router.use(requireAuth);

// Usuario actual
router.get('/me', authController.getCurrentUser);

// Estadísticas para gráficos
router.get('/stats', dashboardController.getStatsJson);

// Hábitos
router.get('/habits', habitController.listHabitsJson);
router.get('/habits/:id', habitController.getHabitJson);
router.post('/habits', habitController.createHabit);
router.put('/habits/:id', habitController.updateHabit);
router.delete('/habits/:id', habitController.deleteHabit);
router.post('/habits/:id/toggle', habitController.toggleLog);

// Tareas
router.get('/tasks', taskController.listTasksJson);
router.get('/tasks/:id', taskController.getTaskJson);
router.post('/tasks', taskController.createTask);
router.put('/tasks/:id', taskController.updateTask);
router.patch('/tasks/:id/status', taskController.updateStatus);
router.delete('/tasks/:id', taskController.deleteTask);

// Micro-objetivos / Checklists
router.get('/checklists/:parentType/:parentId', checklistController.getByParent);
router.post('/checklists', checklistController.addItem);
router.put('/checklists/:id', checklistController.updateItem);
router.patch('/checklists/:id/toggle', checklistController.toggleItem);
router.delete('/checklists/:id', checklistController.deleteItem);

// Categorías
router.get('/categories', categoryController.listCategories);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

export default router;
