import { categoryModel } from '../models/categoryModel.js';

export const categoryController = {
  listCategories(req, res) {
    try {
      const categories = categoryModel.getByUserId(req.user.id);
      return res.json({ success: true, data: categories });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Error al consultar categorías' });
    }
  },

  createCategory(req, res) {
    try {
      const { name, color, icon } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'El nombre de la categoría es obligatorio' });
      }

      const cat = categoryModel.create({
        userId: req.user.id,
        name,
        color: color || '#6366f1',
        icon: icon || 'tag'
      });

      return res.status(201).json({ success: true, data: cat, message: 'Categoría creada' });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Error al crear la categoría' });
    }
  },

  updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, color, icon } = req.body;

      const updated = categoryModel.update(Number(id), req.user.id, { name, color, icon });
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
      }

      return res.json({ success: true, data: updated, message: 'Categoría actualizada' });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Error al actualizar categoría' });
    }
  },

  deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const success = categoryModel.delete(Number(id), req.user.id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
      }

      return res.json({ success: true, message: 'Categoría eliminada' });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Error al eliminar categoría' });
    }
  }
};

export default categoryController;
