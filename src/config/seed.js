import bcrypt from 'bcryptjs';
import { db, initDatabase } from './database.js';

export function seedDatabase() {
  initDatabase();

  const userCheck = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@example.com');
  if (userCheck) {
    console.log('ℹ️ Base de datos ya cuenta con el usuario de prueba.');
    return;
  }

  console.log('🌱 Sembrando datos de prueba iniciales...');

  // 1. Crear usuario Demo
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('demo123', salt);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);
  const userResult = insertUser.run('Usuario Demo', 'demo@example.com', passwordHash, 'admin');
  const userId = Number(userResult.lastInsertRowid);

  // 2. Crear Categorías
  const insertCat = db.prepare(`
    INSERT INTO categories (user_id, name, color, icon)
    VALUES (?, ?, ?, ?)
  `);
  
  const catSalud = Number(insertCat.run(userId, 'Salud & Bienestar', '#10b981', 'heart-pulse').lastInsertRowid);
  const catDesarrollo = Number(insertCat.run(userId, 'Desarrollo Personal', '#6366f1', 'book-open').lastInsertRowid);
  const catTrabajo = Number(insertCat.run(userId, 'Trabajo & Proyectos', '#3b82f6', 'briefcase').lastInsertRowid);
  const catFinanzas = Number(insertCat.run(userId, 'Finanzas', '#f59e0b', 'wallet').lastInsertRowid);

  // 3. Crear Hábitos con Micro-Objetivos
  const insertHabit = db.prepare(`
    INSERT INTO habits (user_id, title, description, category_id, frequency, target_days, color, icon)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertChecklist = db.prepare(`
    INSERT INTO checklist_items (parent_type, parent_id, title, is_completed, position)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Hábito 1: Rutina de Ejercicio
  const habit1 = Number(insertHabit.run(
    userId,
    'Entrenamiento Físico',
    'Completar la sesión de actividad física diaria',
    catSalud,
    'daily',
    1,
    '#10b981',
    'dumbbell'
  ).lastInsertRowid);

  insertChecklist.run('habit', habit1, 'Calentamiento y movilidad (5 min)', 1, 0);
  insertChecklist.run('habit', habit1, 'Sesión principal de fuerza / cardio (35 min)', 1, 1);
  insertChecklist.run('habit', habit1, 'Estiramientos y respiración (5 min)', 0, 2);

  // Hábito 2: Lectura
  const habit2 = Number(insertHabit.run(
    userId,
    'Lectura y Aprendizaje',
    'Leer 20 páginas de un libro de desarrollo o tecnología',
    catDesarrollo,
    'daily',
    1,
    '#6366f1',
    'book-marked'
  ).lastInsertRowid);

  insertChecklist.run('habit', habit2, 'Elegir capítulo y preparar notas', 1, 0);
  insertChecklist.run('habit', habit2, 'Lectura enfocada sin distracciones', 1, 1);
  insertChecklist.run('habit', habit2, 'Anotar 1 idea clave o resumen en diario', 0, 2);

  // Hábito 3: Hidratación
  const habit3 = Number(insertHabit.run(
    userId,
    'Hidratación Óptima (2.5L)',
    'Mantener ingesta de agua distribuida a lo largo del día',
    catSalud,
    'daily',
    1,
    '#06b6d4',
    'droplets'
  ).lastInsertRowid);

  insertChecklist.run('habit', habit3, 'Vaso grande al despertar (500ml)', 1, 0);
  insertChecklist.run('habit', habit3, 'Botella en la mañana (1L)', 1, 1);
  insertChecklist.run('habit', habit3, 'Botella en la tarde (1L)', 0, 2);

  // 4. Registrar logs recientes de hábitos (para simular rachas de días previos)
  const insertLog = db.prepare(`
    INSERT INTO habit_logs (habit_id, user_id, completed_date, notes)
    VALUES (?, ?, ?, ?)
  `);

  const today = new Date();
  for (let i = 1; i <= 4; i++) {
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - i);
    const dateStr = pastDate.toISOString().split('T')[0];
    insertLog.run(habit1, userId, dateStr, 'Completado con éxito');
    if (i <= 3) {
      insertLog.run(habit2, userId, dateStr, 'Excelente lectura');
    }
  }

  // 5. Crear Tareas con Micro-Objetivos
  const insertTask = db.prepare(`
    INSERT INTO tasks (user_id, title, description, category_id, priority, due_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  // Tarea 1
  const task1 = Number(insertTask.run(
    userId,
    'Lanzamiento del Proyecto Web 2026',
    'Preparar y desplegar la versión inicial en producción',
    catTrabajo,
    'high',
    tomorrowStr,
    'in_progress'
  ).lastInsertRowid);

  insertChecklist.run('task', task1, 'Configurar Dockerfile y variables de entorno', 1, 0);
  insertChecklist.run('task', task1, 'Validar endpoints y base de datos SQLite', 1, 1);
  insertChecklist.run('task', task1, 'Probar diseño responsive en móviles y escritorio', 0, 2);
  insertChecklist.run('task', task1, 'Publicar en plataforma de hosting cloud', 0, 3);

  // Tarea 2
  const task2 = Number(insertTask.run(
    userId,
    'Revisión y Planificación Financiera',
    'Auditar gastos mensuales y asignar presupuesto de ahorro',
    catFinanzas,
    'medium',
    nextWeekStr,
    'pending'
  ).lastInsertRowid);

  insertChecklist.run('task', task2, 'Exportar reporte de movimientos del mes', 0, 0);
  insertChecklist.run('task', task2, 'Categorizar egresos fijos vs variables', 0, 1);
  insertChecklist.run('task', task2, 'Definir meta de inversión', 0, 2);

  // Tarea 3
  const task3 = Number(insertTask.run(
    userId,
    'Mantenimiento y Respaldo del Sistema',
    'Copias de seguridad automáticas y optimización de base de datos',
    catTrabajo,
    'low',
    today.toISOString().split('T')[0],
    'completed'
  ).lastInsertRowid);

  insertChecklist.run('task', task3, 'Verificar integridad de SQLite', 1, 0);
  insertChecklist.run('task', task3, 'Generar copia de respaldo .db', 1, 1);

  console.log('✅ Base de datos sembrada con éxito.');
  console.log('🔑 Credenciales Demo: demo@example.com / demo123 (Rol: admin)');
}

// Ejecutar si se llama directamente
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}
