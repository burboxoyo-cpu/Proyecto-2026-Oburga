/**
 * Focus & Habits - Visualizaciones y Gráficos con Chart.js
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof Chart === 'undefined') return;

  // Configuración global de Chart.js para modo oscuro
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
  Chart.defaults.plugins.tooltip.backgroundColor = '#0f172a';
  Chart.defaults.plugins.tooltip.borderColor = '#334155';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 10;

  try {
    const res = await fetch('/api/stats');
    const json = await res.json();
    if (!json.success) return;

    const { tasksByStatus, tasksByPriority, habitsByCategory } = json.data;

    // 1. Gráfico de Tareas por Estado (Doughnut)
    const statusCtx = document.getElementById('tasksStatusChart');
    if (statusCtx) {
      new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: ['Pendientes', 'En Progreso', 'Completadas'],
          datasets: [{
            data: [
              tasksByStatus.pending || 0,
              tasksByStatus.in_progress || 0,
              tasksByStatus.completed || 0
            ],
            backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
            borderColor: '#0f172a',
            borderWidth: 3,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, padding: 15, font: { size: 11, weight: '600' } }
            }
          },
          cutout: '70%'
        }
      });
    }

    // 2. Gráfico de Tareas por Prioridad (Bar)
    const priorityCtx = document.getElementById('tasksPriorityChart');
    if (priorityCtx) {
      new Chart(priorityCtx, {
        type: 'bar',
        data: {
          labels: ['Alta (🔴)', 'Media (🟡)', 'Baja (🟢)'],
          datasets: [{
            label: 'Cantidad de Tareas',
            data: [
              tasksByPriority.high || 0,
              tasksByPriority.medium || 0,
              tasksByPriority.low || 0
            ],
            backgroundColor: ['#f43f5e', '#f59e0b', '#10b981'],
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: '#64748b' },
              grid: { color: '#1e293b' }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { size: 11, weight: '600' } }
            }
          }
        }
      });
    }

    // 3. Gráfico de Hábitos por Categoría (Bar)
    const categoryCtx = document.getElementById('habitsCategoryChart');
    if (categoryCtx && habitsByCategory && habitsByCategory.length > 0) {
      new Chart(categoryCtx, {
        type: 'bar',
        data: {
          labels: habitsByCategory.map(c => c.name),
          datasets: [{
            label: 'Hábitos Registrados',
            data: habitsByCategory.map(c => c.count),
            backgroundColor: habitsByCategory.map(c => c.color || '#6366f1'),
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: '#64748b' },
              grid: { color: '#1e293b' }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { size: 11 } }
            }
          }
        }
      });
    }

  } catch (err) {
    console.error('Error al inicializar gráficos:', err);
  }
});
