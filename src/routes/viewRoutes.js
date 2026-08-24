import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { dashboardController } from '../controllers/dashboardController.js';
import { habitController } from '../controllers/habitController.js';
import { taskController } from '../controllers/taskController.js';

const router = Router();

router.get('/', (req, res) => {
  if (req.user) {
    return res.redirect('/dashboard');
  }
  return res.redirect('/login');
});

router.get('/dashboard', requireAuth, dashboardController.renderDashboard);
router.get('/habits', requireAuth, habitController.renderHabits);
router.get('/tasks', requireAuth, taskController.renderTasks);
router.get('/stats', requireAuth, dashboardController.renderStats);

export default router;
