import express from 'express';
import { getDB, dbHelpers } from '../database.js';
import { requireAdmin, logAdminAction } from '../middleware/auth.js';

const router = express.Router();

// GET - Obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const db = getDB('settings');
    await db.read();

    if (!db.data.categories) {
      db.data.categories = [
        {
          id: 1,
          name: 'MM2',
          slug: 'mm2',
          image: 'https://tr.rbxcdn.com/7d4d5d822a204f6f7c3d9bf66e1cf070/150/150/Image/Png',
          active: true,
          order: 1,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Blox Fruits',
          slug: 'blox-fruits',
          image: 'https://tr.rbxcdn.com/6fa2bcf08af1170bf3e5a4e6c88ba0d6/150/150/Image/Png',
          active: true,
          order: 2,
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Pet Simulator',
          slug: 'pet-simulator',
          image: 'https://tr.rbxcdn.com/099636f1a6c0d6be3f6e7d80b8f69d87/150/150/Image/Png',
          active: true,
          order: 3,
          createdAt: new Date().toISOString()
        }
      ];
      await db.write();
    }

    const categories = db.data.categories || [];
    
    // Ordenar por 'order'
    const sortedCategories = categories.sort((a, b) => a.order - b.order);

    res.json({ success: true, data: sortedCategories });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({ success: false, error: 'Error al obtener categorías' });
  }
});

// GET - Obtener categoría por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDB('settings');
    await db.read();

    const category = db.data.categories?.find(c => c.id === parseInt(id));

    if (!category) {
      return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    res.status(500).json({ success: false, error: 'Error al obtener categoría' });
  }
});

// POST - Crear categoría (ADMIN)
router.post('/', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { name, image, active = true } = req.body;

    if (!name || !image) {
      return res.status(400).json({ success: false, error: 'Nombre e imagen son requeridos' });
    }

    const db = getDB('settings');
    await db.read();

    if (!db.data.categories) {
      db.data.categories = [];
    }

    // Generar slug a partir del nombre
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const newCategory = {
      id: dbHelpers.generateId(db.data.categories),
      name,
      slug,
      image,
      active,
      order: db.data.categories.length + 1,
      createdAt: new Date().toISOString()
    };

    db.data.categories.push(newCategory);
    await db.write();

    console.log(`✅ Categoría creada: ${name}`);

    res.json({ success: true, data: newCategory });
  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({ success: false, error: 'Error al crear categoría' });
  }
});

// PUT - Actualizar categoría (ADMIN)
router.put('/:id', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image, active, order } = req.body;

    const db = getDB('settings');
    await db.read();

    const categoryIndex = db.data.categories?.findIndex(c => c.id === parseInt(id));

    if (categoryIndex === -1) {
      return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
    }

    // Actualizar campos
    if (name) {
      db.data.categories[categoryIndex].name = name;
      db.data.categories[categoryIndex].slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    if (image) db.data.categories[categoryIndex].image = image;
    if (active !== undefined) db.data.categories[categoryIndex].active = active;
    if (order !== undefined) db.data.categories[categoryIndex].order = order;

    db.data.categories[categoryIndex].updatedAt = new Date().toISOString();

    await db.write();

    console.log(`✅ Categoría actualizada: ${db.data.categories[categoryIndex].name}`);

    res.json({ success: true, data: db.data.categories[categoryIndex] });
  } catch (error) {
    console.error('Error actualizando categoría:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar categoría' });
  }
});

// DELETE - Eliminar categoría (ADMIN)
router.delete('/:id', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDB('settings');
    await db.read();

    const categoryIndex = db.data.categories?.findIndex(c => c.id === parseInt(id));

    if (categoryIndex === -1) {
      return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
    }

    const deletedCategory = db.data.categories.splice(categoryIndex, 1)[0];

    await db.write();

    console.log(`✅ Categoría eliminada: ${deletedCategory.name}`);

    res.json({ success: true, message: 'Categoría eliminada' });
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar categoría' });
  }
});

export default router;
