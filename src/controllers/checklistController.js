import { checklistModel } from '../models/checklistModel.js';

export const checklistController = {
  getByParent(req, res) {
    try {
      const { parentType, parentId } = req.params;
      const progress = checklistModel.getProgress(parentType, Number(parentId));
      return res.json({ success: true, data: progress });
    } catch (err) {
      console.error('Error getByParent:', err);
      return res.status(500).json({ success: false, error: 'Error al obtener lista de micro-objetivos' });
    }
  },

  addItem(req, res) {
    try {
      const { parentType, parentId, title } = req.body;

      if (!parentType || !parentId || !title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Tipo, ID y título del objetivo son requeridos' });
      }

      if (!['habit', 'task'].includes(parentType)) {
        return res.status(400).json({ success: false, error: 'Tipo de padre inválido (debe ser habit o task)' });
      }

      const item = checklistModel.create({
        parentType,
        parentId: Number(parentId),
        title: title.trim()
      });

      const progress = checklistModel.getProgress(parentType, Number(parentId));

      return res.status(201).json({
        success: true,
        data: item,
        progress,
        message: 'Micro-objetivo añadido'
      });
    } catch (err) {
      console.error('Error addItem:', err);
      return res.status(500).json({ success: false, error: 'Error al agregar micro-objetivo' });
    }
  },

  updateItem(req, res) {
    try {
      const { id } = req.params;
      const { title, isCompleted, position } = req.body;

      const item = checklistModel.getById(Number(id));
      if (!item) {
        return res.status(404).json({ success: false, error: 'Micro-objetivo no encontrado' });
      }

      const updated = checklistModel.update(Number(id), {
        title,
        isCompleted: isCompleted !== undefined ? Boolean(Number(isCompleted)) : undefined,
        position: position !== undefined ? Number(position) : undefined
      });

      const progress = checklistModel.getProgress(item.parent_type, item.parent_id);

      return res.json({
        success: true,
        data: updated,
        progress,
        message: 'Micro-objetivo actualizado'
      });
    } catch (err) {
      console.error('Error updateItem:', err);
      return res.status(500).json({ success: false, error: 'Error al actualizar micro-objetivo' });
    }
  },

  toggleItem(req, res) {
    try {
      const { id } = req.params;

      const item = checklistModel.getById(Number(id));
      if (!item) {
        return res.status(404).json({ success: false, error: 'Micro-objetivo no encontrado' });
      }

      const updated = checklistModel.toggle(Number(id));
      const progress = checklistModel.getProgress(item.parent_type, item.parent_id);

      return res.json({
        success: true,
        data: updated,
        progress,
        message: updated.is_completed ? 'Objetivo completado 🎉' : 'Objetivo desmarcado'
      });
    } catch (err) {
      console.error('Error toggleItem:', err);
      return res.status(500).json({ success: false, error: 'Error al cambiar estado del micro-objetivo' });
    }
  },

  deleteItem(req, res) {
    try {
      const { id } = req.params;

      const item = checklistModel.getById(Number(id));
      if (!item) {
        return res.status(404).json({ success: false, error: 'Micro-objetivo no encontrado' });
      }

      checklistModel.delete(Number(id));
      const progress = checklistModel.getProgress(item.parent_type, item.parent_id);

      return res.json({
        success: true,
        progress,
        message: 'Micro-objetivo eliminado'
      });
    } catch (err) {
      console.error('Error deleteItem:', err);
      return res.status(500).json({ success: false, error: 'Error al eliminar micro-objetivo' });
    }
  }
};

export default checklistController;
