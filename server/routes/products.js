import express from 'express';
import { getDB, dbHelpers } from '../database.js';
import { requireAdmin, logAdminAction } from '../middleware/auth.js';

const router = express.Router();

// ==================== ROBUX PACKAGES ====================

// GET - Obtener todos los paquetes de Robux
router.get('/robux', async (req, res) => {
  try {
    const db = getDB('products');
    await db.read();
    
    const packages = db.data.robuxPackages || [];
    
    // Filtrar solo activos para clientes
    const activePackages = packages.filter(p => p.active);
    
    res.json({ success: true, data: activePackages });
  } catch (error) {
    console.error('Error obteniendo paquetes:', error);
    res.status(500).json({ success: false, error: 'Error al obtener paquetes' });
  }
});

// POST - Crear paquete de Robux (ADMIN)
router.post('/robux', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { amount, price, discount, popular } = req.body;
    
    if (!amount || !price) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
    }
    
    const db = getDB('products');
    await db.read();
    
    const newPackage = {
      id: dbHelpers.generateId(db.data.robuxPackages),
      amount: parseInt(amount),
      price: parseFloat(price),
      discount: parseInt(discount) || 0,
      popular: popular || false,
      active: true,
      createdAt: new Date().toISOString()
    };
    
    db.data.robuxPackages.push(newPackage);
    await db.write();
    
    res.json({ success: true, data: newPackage });
  } catch (error) {
    console.error('Error creando paquete:', error);
    res.status(500).json({ success: false, error: 'Error al crear paquete' });
  }
});

// PUT - Actualizar paquete de Robux (ADMIN)
router.put('/robux/:id', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const db = getDB('products');
    await db.read();
    
    const updated = dbHelpers.updateItem(db.data.robuxPackages, id, updates);
    
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Paquete no encontrado' });
    }
    
    await db.write();
    
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error actualizando paquete:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar paquete' });
  }
});

// DELETE - Eliminar paquete de Robux (ADMIN)
router.delete('/robux/:id', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDB('products');
    await db.read();
    
    const deleted = dbHelpers.deleteItem(db.data.robuxPackages, id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Paquete no encontrado' });
    }
    
    await db.write();
    
    res.json({ success: true, message: 'Paquete eliminado' });
  } catch (error) {
    console.error('Error eliminando paquete:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar paquete' });
  }
});

// ==================== IN-GAME PRODUCTS ====================

// GET - Obtener productos in-game
router.get('/ingame', async (req, res) => {
  try {
    const db = getDB('products');
    await db.read();
    
    const products = db.data.inGameProducts || [];
    
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ success: false, error: 'Error al obtener productos' });
  }
});

// POST - Crear producto in-game (ADMIN)
router.post('/ingame', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { game, itemName, itemType, categoryOrder, productOrder, classificationBadge, robuxAmount, price, description, image, rarity, rarityColor, isLimited, active } = req.body;
    
    // Validación: robuxAmount es opcional para Limiteds
    if (!game || !itemName || !price) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
    }
    
    if (!isLimited && !robuxAmount) {
      return res.status(400).json({ success: false, error: 'La cantidad de Robux es requerida para productos regulares' });
    }
    
    const db = getDB('products');
    await db.read();
    
    const newProduct = {
      id: dbHelpers.generateId(db.data.inGameProducts),
      game,
      itemName,
      itemType: itemType || 'Items',
      categoryOrder: categoryOrder !== undefined ? parseInt(categoryOrder) : 999, // Orden de la categoría (por defecto al final)
      productOrder: productOrder !== undefined ? parseInt(productOrder) : 999, // Orden individual del producto
      classificationBadge: classificationBadge || '', // Nuevo campo de badge personalizable
      robuxAmount: robuxAmount ? parseInt(robuxAmount) : null, // Puede ser null para Limiteds
      price: parseFloat(price),
      description: description || '',
      image: image || '',
      rarity: rarity || '', // Permitir vacío, no forzar 'COMMON'
      rarityColor: rarityColor || '#ff6b6b', // Color personalizado para la rareza
      isLimited: isLimited || false,
      active: active !== false,
      createdAt: new Date().toISOString()
    };
    
    db.data.inGameProducts.push(newProduct);
    await db.write();
    
    console.log(`✅ Producto in-game creado: ${itemName} (${game})`);
    
    res.json({ success: true, data: newProduct });
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({ success: false, error: 'Error al crear producto' });
  }
});

// PUT - Actualizar producto in-game (ADMIN)
router.put('/ingame/:id', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Validar robuxAmount si se está actualizando
    if ('robuxAmount' in updates && 'isLimited' in updates) {
      if (!updates.isLimited && !updates.robuxAmount) {
        return res.status(400).json({ 
          success: false, 
          error: 'La cantidad de Robux es requerida para productos regulares' 
        });
      }
    }
    
    // Procesar updates: permitir robuxAmount null y rarity vacío
    if ('robuxAmount' in updates) {
      updates.robuxAmount = updates.robuxAmount ? parseInt(updates.robuxAmount) : null;
    }
    
    if ('rarity' in updates && !updates.rarity) {
      updates.rarity = ''; // Permitir vacío
    }
    
    if ('rarityColor' in updates && !updates.rarityColor) {
      updates.rarityColor = '#ff6b6b'; // Color por defecto si está vacío
    }
    
    if ('categoryOrder' in updates) {
      updates.categoryOrder = parseInt(updates.categoryOrder);
    }
    
    if ('productOrder' in updates) {
      updates.productOrder = parseInt(updates.productOrder);
    }
    
    const db = getDB('products');
    await db.read();
    
    const updated = dbHelpers.updateItem(db.data.inGameProducts, id, updates);
    
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }
    
    await db.write();
    
    console.log(`✅ Producto in-game actualizado: ${updated.itemName}`);
    
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar producto' });
  }
});

// DELETE - Eliminar producto in-game (ADMIN)
router.delete('/ingame/:id', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDB('products');
    await db.read();
    
    const deleted = dbHelpers.deleteItem(db.data.inGameProducts, id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }
    
    await db.write();
    
    console.log(`✅ Producto in-game eliminado: ${deleted.itemName}`);
    
    res.json({ success: true, message: 'Producto eliminado' });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar producto' });
  }
});

export default router;
