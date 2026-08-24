import { db, initDatabase } from '../src/config/database.js';
import { seedDatabase } from '../src/config/seed.js';
import { userModel } from '../src/models/userModel.js';
import { habitModel } from '../src/models/habitModel.js';
import { taskModel } from '../src/models/taskModel.js';
import { checklistModel } from '../src/models/checklistModel.js';
import { categoryModel } from '../src/models/categoryModel.js';

console.log('🧪 Iniciando batería de pruebas unitarias y de integración...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
  }
}

async function runTests() {
  try {
    // 1. Prueba de Inicialización y Seeding
    console.log('1️⃣ Probando Base de Datos y Sembrado Inicial:');
    initDatabase();
    seedDatabase();

    const demoUser = userModel.findByEmail('demo@example.com');
    assert(demoUser !== undefined && demoUser !== null, 'Usuario demo existe en la base de datos');
    assert(demoUser.role === 'admin', 'Usuario demo tiene rol "admin"');
    assert(userModel.verifyPassword(demoUser, 'demo123'), 'Verificación de contraseña con bcrypt funciona');

    // 2. Prueba de Categorías
    console.log('\n2️⃣ Probando Modelo de Categorías:');
    const categories = categoryModel.getByUserId(demoUser.id);
    assert(categories.length >= 4, `Categorías creadas correctamente (Total: ${categories.length})`);

    const newCat = categoryModel.create({
      userId: demoUser.id,
      name: 'Categoría Test',
      color: '#ff0000',
      icon: 'star'
    });
    assert(newCat.name === 'Categoría Test', 'Creación de nueva categoría personalizada');

    // 3. Prueba de Hábitos y Rachas
    console.log('\n3️⃣ Probando Modelo de Hábitos y Rachas:');
    const habits = habitModel.getAllByUserId(demoUser.id);
    assert(habits.length >= 3, `Hábitos recuperados con estadísticas (Total: ${habits.length})`);

    const habit1 = habits[0];
    assert(habit1.checklist !== undefined, 'Hábito incluye micro-objetivos anidados');
    assert(typeof habit1.streak === 'number', 'Cálculo de racha actual es numérico');

    const createdHabit = habitModel.create({
      userId: demoUser.id,
      title: 'Hábito de Prueba Automatizada',
      description: 'Descripción de prueba',
      categoryId: newCat.id,
      frequency: 'daily',
      targetDays: 1,
      color: '#ec4899',
      checklistItems: ['Paso 1 Test', 'Paso 2 Test', 'Paso 3 Test']
    });
    assert(createdHabit.id !== undefined, 'Creación de hábito con checklist inicial');
    assert(createdHabit.checklist.total === 3, 'Checklist anidado contiene 3 micro-objetivos');
    assert(createdHabit.checklist.completed === 0, 'Checklist inicial tiene 0 completados');
    assert(createdHabit.checklist.percentage === 0, 'Progreso inicial es 0%');

    // 4. Prueba de Micro-Objetivos (Checklist)
    console.log('\n4️⃣ Probando Micro-Objetivos y Recálculo de Progreso:');
    const firstCheckitem = createdHabit.checklist.items[0];
    const toggleRes = checklistModel.toggle(firstCheckitem.id);
    assert(toggleRes.is_completed === 1, 'Micro-objetivo marcado como completado');

    const progressAfterToggle = checklistModel.getProgress('habit', createdHabit.id);
    assert(progressAfterToggle.completed === 1, 'Progreso cuenta 1 micro-objetivo completado');
    assert(progressAfterToggle.percentage === 33, 'Porcentaje de progreso calculado correctamente (33%)');

    const updatedItem = checklistModel.update(firstCheckitem.id, { title: 'Paso 1 Editado' });
    assert(updatedItem.title === 'Paso 1 Editado', 'Edición de título de micro-objetivo');

    const addedItem = checklistModel.create({ parentType: 'habit', parentId: createdHabit.id, title: 'Paso 4 Extra' });
    const progressAfterAdd = checklistModel.getProgress('habit', createdHabit.id);
    assert(progressAfterAdd.total === 4, 'Micro-objetivo añadido dinámicamente');

    checklistModel.delete(addedItem.id);
    const progressAfterDelete = checklistModel.getProgress('habit', createdHabit.id);
    assert(progressAfterDelete.total === 3, 'Micro-objetivo eliminado correctamente');

    // 5. Prueba de Tareas
    console.log('\n5️⃣ Probando Modelo de Tareas y Filtros:');
    const tasks = taskModel.getAllByUserId(demoUser.id);
    assert(tasks.length >= 3, `Tareas recuperadas con checklists (Total: ${tasks.length})`);

    const createdTask = taskModel.create({
      userId: demoUser.id,
      title: 'Tarea de Prueba Automatizada',
      description: 'Test descripción',
      categoryId: newCat.id,
      priority: 'high',
      dueDate: '2026-12-31',
      status: 'pending',
      checklistItems: ['Sub-tarea A', 'Sub-tarea B']
    });
    assert(createdTask.priority === 'high', 'Tarea creada con prioridad Alta');
    assert(createdTask.checklist.total === 2, 'Tarea creada con 2 sub-objetivos');

    const updatedTask = taskModel.updateStatus(createdTask.id, demoUser.id, 'in_progress');
    assert(updatedTask.status === 'in_progress', 'Cambio rápido de estado a "in_progress"');

    // Limpieza de datos de prueba
    habitModel.delete(createdHabit.id, demoUser.id);
    taskModel.delete(createdTask.id, demoUser.id);
    categoryModel.delete(newCat.id, demoUser.id);

    console.log('\n====================================================');
    console.log(`🎯 Resultados: ${passedTests}/${totalTests} pruebas pasadas con éxito.`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ Error durante la ejecución de pruebas:', err);
    process.exit(1);
  }
}

runTests();
