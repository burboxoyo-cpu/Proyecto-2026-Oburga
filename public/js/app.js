/**
 * Focus & Habits App Client-Side Engine
 * MVC Architecture - 2026
 */

// Estado temporal para modales
let activeDeleteContext = null;
let activeQuickChecklistContext = null;
let formMicroGoals = {
  habit: [],
  task: []
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }
  setupSidebar();
  setupColorPickers();
  setupEscapeKey();
});

/* ==========================================================================
   UTILIDADES & TOAST NOTIFICATIONS
   ========================================================================== */

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const isSuccess = type === 'success';
  const isError = type === 'error';

  toast.className = `toast-enter pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-xl ${
    isSuccess
      ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-400 shadow-emerald-950/40'
      : isError
      ? 'bg-slate-900/95 border-rose-500/40 text-rose-400 shadow-rose-950/40'
      : 'bg-slate-900/95 border-indigo-500/40 text-indigo-400 shadow-indigo-950/40'
  }`;

  const iconName = isSuccess ? 'check-circle-2' : isError ? 'alert-circle' : 'info';
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-4 h-4 shrink-0"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

function setupSidebar() {
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const openBtn = document.getElementById('openSidebarBtn');
  const closeBtn = document.getElementById('closeSidebarBtn');

  if (openBtn && sidebar && overlay) {
    openBtn.addEventListener('click', () => {
      sidebar.classList.remove('-translate-x-full');
      overlay.classList.remove('hidden');
    });
  }

  if (closeBtn && sidebar && overlay) {
    const close = () => {
      sidebar.classList.add('-translate-x-full');
      overlay.classList.add('hidden');
    };
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
  }
}

function setupColorPickers() {
  const colorInput = document.getElementById('habitColor');
  const colorHex = document.getElementById('habitColorHex');
  if (colorInput && colorHex) {
    colorInput.addEventListener('input', (e) => {
      colorHex.textContent = e.target.value;
    });
  }
}

function setupEscapeKey() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      ['habitModal', 'taskModal', 'quickChecklistModal', 'deleteModal'].forEach(closeModal);
    }
  });
}

/* ==========================================================================
   GESTIÓN DE MODALES
   ========================================================================== */

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.remove('hidden');
  setTimeout(() => {
    modal.classList.add('modal-active');
  }, 10);
  if (window.lucide) lucide.createIcons();
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.remove('modal-active');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 200);
}

/* ==========================================================================
   HÁBITOS: APERTURA Y ENVÍO DE FORMULARIOS
   ========================================================================== */

function openHabitModal() {
  const form = document.getElementById('habitForm');
  if (!form) return;

  form.reset();
  document.getElementById('habitId').value = '';
  document.getElementById('habitModalTitle').textContent = 'Nuevo Hábito';
  document.getElementById('habitColorHex').textContent = '#10b981';
  document.getElementById('habitColor').value = '#10b981';
  document.getElementById('habitSubmitBtn').innerHTML = '<i data-lucide="save" class="w-3.5 h-3.5"></i><span>Guardar Hábito</span>';
  
  formMicroGoals.habit = [];
  renderFormMicroGoals('habit');

  openModal('habitModal');
  setTimeout(() => document.getElementById('habitTitle')?.focus(), 50);
}

async function editHabit(habitId) {
  try {
    const res = await fetch(`/api/habits/${habitId}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    const habit = data.data;
    document.getElementById('habitId').value = habit.id;
    document.getElementById('habitTitle').value = habit.title;
    document.getElementById('habitDescription').value = habit.description || '';
    document.getElementById('habitCategory').value = habit.category_id || '';
    document.getElementById('habitFrequency').value = habit.frequency || 'daily';
    document.getElementById('habitColor').value = habit.color || '#10b981';
    document.getElementById('habitColorHex').textContent = habit.color || '#10b981';
    document.getElementById('habitTargetDays').value = habit.target_days || 1;

    document.getElementById('habitModalTitle').textContent = 'Editar Hábito';
    document.getElementById('habitSubmitBtn').innerHTML = '<i data-lucide="save" class="w-3.5 h-3.5"></i><span>Actualizar Hábito</span>';

    // Cargar checklist de este hábito
    formMicroGoals.habit = habit.checklist && habit.checklist.items ? habit.checklist.items.map(i => i.title) : [];
    renderFormMicroGoals('habit');

    openModal('habitModal');
  } catch (err) {
    showToast('Error al cargar datos del hábito', 'error');
  }
}

async function submitHabitForm(e) {
  e.preventDefault();
  const id = document.getElementById('habitId').value;
  const title = document.getElementById('habitTitle').value;
  const description = document.getElementById('habitDescription').value;
  const categoryId = document.getElementById('habitCategory').value;
  const frequency = document.getElementById('habitFrequency').value;
  const color = document.getElementById('habitColor').value;
  const targetDays = document.getElementById('habitTargetDays').value;

  const payload = {
    title,
    description,
    categoryId: categoryId || null,
    frequency,
    color,
    targetDays,
    checklistItems: formMicroGoals.habit
  };

  try {
    const url = id ? `/api/habits/${id}` : '/api/habits';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    closeModal('habitModal');
    showToast(id ? 'Hábito actualizado correctamente' : 'Hábito creado con éxito');
    setTimeout(() => window.location.reload(), 500);
  } catch (err) {
    showToast(err.message || 'Error al guardar hábito', 'error');
  }
}

async function toggleHabitLog(habitId) {
  try {
    const res = await fetch(`/api/habits/${habitId}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    const btn = document.getElementById(`habit-toggle-btn-${habitId}`);
    if (btn) {
      if (result.data.completed) {
        btn.className = 'w-11 h-11 rounded-2xl flex items-center justify-center transition-all shrink-0 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30';
        showToast('¡Hábito marcado como completado hoy! 🔥');
      } else {
        btn.className = 'w-11 h-11 rounded-2xl flex items-center justify-center transition-all shrink-0 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700';
        showToast('Hábito desmarcado');
      }
    }

    setTimeout(() => window.location.reload(), 400);
  } catch (err) {
    showToast('Error al registrar hábito', 'error');
  }
}

async function toggleHabitLogDate(habitId, dateStr) {
  try {
    const res = await fetch(`/api/habits/${habitId}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateStr })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    showToast(result.data.completed ? `Hábito completado para el ${dateStr}` : `Hábito desmarcado para el ${dateStr}`);
    setTimeout(() => window.location.reload(), 400);
  } catch (err) {
    showToast('Error al modificar registro de fecha', 'error');
  }
}

/* ==========================================================================
   TAREAS: APERTURA Y ENVÍO DE FORMULARIOS
   ========================================================================== */

function openTaskModal() {
  const form = document.getElementById('taskForm');
  if (!form) return;

  form.reset();
  document.getElementById('taskId').value = '';
  document.getElementById('taskModalTitle').textContent = 'Nueva Tarea';
  document.getElementById('taskPriority').value = 'medium';
  document.getElementById('taskStatus').value = 'pending';
  document.getElementById('taskSubmitBtn').innerHTML = '<i data-lucide="save" class="w-3.5 h-3.5"></i><span>Guardar Tarea</span>';

  formMicroGoals.task = [];
  renderFormMicroGoals('task');

  openModal('taskModal');
  setTimeout(() => document.getElementById('taskTitle')?.focus(), 50);
}

async function editTask(taskId) {
  try {
    const res = await fetch(`/api/tasks/${taskId}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    const task = data.data;
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskCategory').value = task.category_id || '';
    document.getElementById('taskPriority').value = task.priority || 'medium';
    document.getElementById('taskStatus').value = task.status || 'pending';
    document.getElementById('taskDueDate').value = task.due_date || '';

    document.getElementById('taskModalTitle').textContent = 'Editar Tarea';
    document.getElementById('taskSubmitBtn').innerHTML = '<i data-lucide="save" class="w-3.5 h-3.5"></i><span>Actualizar Tarea</span>';

    // Cargar checklist
    formMicroGoals.task = task.checklist && task.checklist.items ? task.checklist.items.map(i => i.title) : [];
    renderFormMicroGoals('task');

    openModal('taskModal');
  } catch (err) {
    showToast('Error al cargar datos de la tarea', 'error');
  }
}

async function submitTaskForm(e) {
  e.preventDefault();
  const id = document.getElementById('taskId').value;
  const title = document.getElementById('taskTitle').value;
  const description = document.getElementById('taskDescription').value;
  const categoryId = document.getElementById('taskCategory').value;
  const priority = document.getElementById('taskPriority').value;
  const dueDate = document.getElementById('taskDueDate').value;
  const status = document.getElementById('taskStatus').value;

  const payload = {
    title,
    description,
    categoryId: categoryId || null,
    priority,
    dueDate: dueDate || null,
    status,
    checklistItems: formMicroGoals.task
  };

  try {
    const url = id ? `/api/tasks/${id}` : '/api/tasks';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    closeModal('taskModal');
    showToast(id ? 'Tarea actualizada correctamente' : 'Tarea creada con éxito');
    setTimeout(() => window.location.reload(), 500);
  } catch (err) {
    showToast(err.message || 'Error al guardar tarea', 'error');
  }
}

async function updateTaskStatusQuick(taskId, newStatus) {
  try {
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    showToast('Estado de tarea actualizado');
    setTimeout(() => window.location.reload(), 400);
  } catch (err) {
    showToast('Error al actualizar estado', 'error');
  }
}

/* ==========================================================================
   CONSTRUCTOR DE CHECKLISTS EN MODALES (CREACIÓN)
   ========================================================================== */

function addMicroGoalToForm(type) {
  const input = document.getElementById(`${type}NewCheckitemInput`);
  if (!input || !input.value.trim()) return;

  formMicroGoals[type].push(input.value.trim());
  input.value = '';
  renderFormMicroGoals(type);
  input.focus();
}

function removeMicroGoalFromForm(type, index) {
  formMicroGoals[type].splice(index, 1);
  renderFormMicroGoals(type);
}

function renderFormMicroGoals(type) {
  const container = document.getElementById(`${type}ChecklistContainer`);
  if (!container) return;

  container.innerHTML = '';
  formMicroGoals[type].forEach((text, idx) => {
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs';
    li.innerHTML = `
      <span class="text-slate-300 truncate">• ${text}</span>
      <button type="button" onclick="removeMicroGoalFromForm('${type}', ${idx})" class="text-slate-400 hover:text-rose-400 p-1">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
    `;
    container.appendChild(li);
  });
  if (window.lucide) lucide.createIcons();
}

/* ==========================================================================
   MICRO-OBJETIVOS / CHECKLISTS INTERACTIVOS EN TIEMPO REAL
   ========================================================================== */

async function toggleChecklistItem(itemId, parentType, parentId) {
  try {
    const res = await fetch(`/api/checklists/${itemId}/toggle`, {
      method: 'PATCH'
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    // Actualizar visualmente la barra y porcentaje del padre
    updateParentProgressUI(parentType, parentId, result.progress);

    // Tachar el texto
    const titleSpan = document.getElementById(`checkitem-title-${itemId}`);
    if (titleSpan) {
      if (result.data.is_completed) {
        titleSpan.classList.add('line-through', 'text-slate-500');
      } else {
        titleSpan.classList.remove('line-through', 'text-slate-500');
      }
    }

    showToast(result.message);
  } catch (err) {
    showToast('Error al actualizar objetivo', 'error');
  }
}

async function addInlineCheckitem(e, parentType, parentId) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  if (!input || !input.value.trim()) return;

  const title = input.value.trim();

  try {
    const res = await fetch('/api/checklists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentType, parentId, title })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    input.value = '';
    showToast('Micro-objetivo añadido ✨');

    // Añadir el item a la lista DOM
    const list = document.getElementById(`checklist-items-${parentType}-${parentId}`);
    if (list) {
      const li = createCheckitemDOM(result.data, parentType, parentId);
      list.appendChild(li);
      if (window.lucide) lucide.createIcons();
    }

    // Actualizar progreso
    updateParentProgressUI(parentType, parentId, result.progress);
  } catch (err) {
    showToast('Error al agregar objetivo', 'error');
  }
}

function createCheckitemDOM(item, parentType, parentId) {
  const li = document.createElement('li');
  li.className = 'flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/60 hover:border-slate-700 text-[11px] group';
  li.id = `checkitem-${item.id}`;
  li.innerHTML = `
    <label class="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
      <input type="checkbox" ${item.is_completed ? 'checked' : ''} 
        onchange="toggleChecklistItem(${item.id}, '${parentType}', ${parentId})"
        class="w-3.5 h-3.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800 cursor-pointer">
      <span id="checkitem-title-${item.id}" class="text-slate-300 truncate ${item.is_completed ? 'line-through text-slate-500' : ''}">
        ${item.title}
      </span>
    </label>
    <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onclick="inlineEditChecklistItem(${item.id}, '${parentType}', ${parentId})" title="Editar texto" class="p-0.5 text-slate-400 hover:text-white rounded">
        <i data-lucide="edit-2" class="w-2.5 h-2.5"></i>
      </button>
      <button onclick="deleteChecklistItem(${item.id}, '${parentType}', ${parentId})" title="Eliminar objetivo" class="p-0.5 text-slate-400 hover:text-rose-400 rounded">
        <i data-lucide="trash" class="w-2.5 h-2.5"></i>
      </button>
    </div>
  `;
  return li;
}

async function inlineEditChecklistItem(itemId, parentType, parentId) {
  const titleSpan = document.getElementById(`checkitem-title-${itemId}`);
  if (!titleSpan) return;

  const currentText = titleSpan.textContent.trim();
  const newText = prompt('Editar micro-objetivo:', currentText);

  if (newText === null || !newText.trim() || newText.trim() === currentText) return;

  try {
    const res = await fetch(`/api/checklists/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newText.trim() })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    titleSpan.textContent = result.data.title;
    showToast('Micro-objetivo editado');
  } catch (err) {
    showToast('Error al editar objetivo', 'error');
  }
}

async function deleteChecklistItem(itemId, parentType, parentId) {
  if (!confirm('¿Eliminar este micro-objetivo?')) return;

  try {
    const res = await fetch(`/api/checklists/${itemId}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    const el = document.getElementById(`checkitem-${itemId}`);
    if (el) el.remove();

    updateParentProgressUI(parentType, parentId, result.progress);
    showToast('Micro-objetivo eliminado');
  } catch (err) {
    showToast('Error al eliminar objetivo', 'error');
  }
}

function updateParentProgressUI(parentType, parentId, progress) {
  if (!progress) return;

  // Actualizar porcentaje de texto
  const pctEl = document.getElementById(`${parentType}-pct-${parentId}`);
  if (pctEl) pctEl.textContent = `${progress.percentage}%`;

  // Actualizar ancho de la barra
  const barEl = document.getElementById(`${parentType}-bar-${parentId}`);
  if (barEl) barEl.style.width = `${progress.percentage}%`;
}

/* ==========================================================================
   MODAL RÁPIDO DE MICRO-OBJETIVOS
   ========================================================================== */

async function openQuickChecklistModal(parentType, parentId, parentTitle) {
  activeQuickChecklistContext = { parentType, parentId };

  document.getElementById('quickChecklistTitle').textContent = parentTitle;
  document.getElementById('quickChecklistSubtitle').textContent = parentType === 'habit' ? 'Checklist del Hábito' : 'Checklist de la Tarea';
  
  await refreshQuickChecklistModal();
  openModal('quickChecklistModal');
}

async function refreshQuickChecklistModal() {
  if (!activeQuickChecklistContext) return;
  const { parentType, parentId } = activeQuickChecklistContext;

  try {
    const res = await fetch(`/api/checklists/${parentType}/${parentId}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    const progress = data.data;
    document.getElementById('quickChecklistProgressText').textContent = `${progress.percentage}% (${progress.completed}/${progress.total})`;
    document.getElementById('quickChecklistProgressBar').style.width = `${progress.percentage}%`;

    const list = document.getElementById('quickChecklistItemsList');
    list.innerHTML = '';

    if (progress.items.length === 0) {
      list.innerHTML = '<li class="text-center py-6 text-xs text-slate-500">No hay micro-objetivos agregados todavía.</li>';
    } else {
      progress.items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs';
        li.innerHTML = `
          <label class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
            <input type="checkbox" ${item.is_completed ? 'checked' : ''}
              onchange="toggleQuickItem(${item.id})"
              class="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800">
            <span class="text-slate-300 truncate ${item.is_completed ? 'line-through text-slate-500' : ''}">
              ${item.title}
            </span>
          </label>
          <div class="flex items-center gap-1">
            <button onclick="editQuickItem(${item.id}, '${item.title.replace(/'/g, "\\'")}')" class="p-1 text-slate-400 hover:text-white rounded">
              <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="deleteQuickItem(${item.id})" class="p-1 text-slate-400 hover:text-rose-400 rounded">
              <i data-lucide="trash" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        `;
        list.appendChild(li);
      });
    }

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    showToast('Error al cargar checklist', 'error');
  }
}

async function submitQuickChecklistItem(e) {
  e.preventDefault();
  const input = document.getElementById('quickNewItemInput');
  if (!input || !input.value.trim() || !activeQuickChecklistContext) return;

  const { parentType, parentId } = activeQuickChecklistContext;

  try {
    const res = await fetch('/api/checklists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentType, parentId, title: input.value.trim() })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    input.value = '';
    await refreshQuickChecklistModal();
    updateParentProgressUI(parentType, parentId, result.progress);
    showToast('Micro-objetivo agregado');
  } catch (err) {
    showToast('Error al guardar objetivo', 'error');
  }
}

async function toggleQuickItem(itemId) {
  try {
    const res = await fetch(`/api/checklists/${itemId}/toggle`, { method: 'PATCH' });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    await refreshQuickChecklistModal();
    if (activeQuickChecklistContext) {
      updateParentProgressUI(activeQuickChecklistContext.parentType, activeQuickChecklistContext.parentId, result.progress);
    }
  } catch (err) {
    showToast('Error al alternar objetivo', 'error');
  }
}

async function editQuickItem(itemId, currentTitle) {
  const newTitle = prompt('Editar micro-objetivo:', currentTitle);
  if (!newTitle || !newTitle.trim() || newTitle.trim() === currentTitle) return;

  try {
    const res = await fetch(`/api/checklists/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim() })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    await refreshQuickChecklistModal();
    showToast('Objetivo modificado');
  } catch (err) {
    showToast('Error al modificar', 'error');
  }
}

async function deleteQuickItem(itemId) {
  if (!confirm('¿Eliminar micro-objetivo?')) return;

  try {
    const res = await fetch(`/api/checklists/${itemId}`, { method: 'DELETE' });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    await refreshQuickChecklistModal();
    if (activeQuickChecklistContext) {
      updateParentProgressUI(activeQuickChecklistContext.parentType, activeQuickChecklistContext.parentId, result.progress);
    }
    showToast('Objetivo eliminado');
  } catch (err) {
    showToast('Error al eliminar', 'error');
  }
}

/* ==========================================================================
   CONFIRMACIÓN Y ELIMINACIÓN DE ENTIDADES
   ========================================================================== */

function confirmDelete(type, id, title) {
  activeDeleteContext = { type, id };
  document.getElementById('deleteModalTitle').textContent = `¿Eliminar ${type === 'habit' ? 'Hábito' : 'Tarea'}?`;
  document.getElementById('deleteModalMessage').textContent = `Estás a punto de eliminar "${title}". Esta acción no se puede deshacer.`;

  const btn = document.getElementById('confirmDeleteBtn');
  btn.onclick = executeDelete;

  openModal('deleteModal');
}

async function executeDelete() {
  if (!activeDeleteContext) return;
  const { type, id } = activeDeleteContext;

  try {
    const url = type === 'habit' ? `/api/habits/${id}` : `/api/tasks/${id}`;
    const res = await fetch(url, { method: 'DELETE' });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    closeModal('deleteModal');
    showToast(`${type === 'habit' ? 'Hábito' : 'Tarea'} eliminado correctamente`);
    setTimeout(() => window.location.reload(), 400);
  } catch (err) {
    showToast('Error al eliminar elemento', 'error');
  }
}
