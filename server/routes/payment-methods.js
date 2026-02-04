import express from 'express';
import { getDB, dbHelpers } from '../database.js';

const router = express.Router();

// GET - Obtener todos los métodos de pago
router.get('/', async (req, res) => {
  try {
    const db = getDB('paymentMethods');
    await db.read();
    
    let methods = db.data.methods || [];
    
    // Solo mostrar activos para clientes (si no es admin)
    const { includeInactive } = req.query;
    if (!includeInactive) {
      methods = methods.filter(m => m.active);
    }
    
    res.json({ success: true, data: methods });
  } catch (error) {
    console.error('Error obteniendo métodos de pago:', error);
    res.status(500).json({ success: false, error: 'Error al obtener métodos de pago' });
  }
});

// GET - Obtener método de pago por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDB('paymentMethods');
    await db.read();
    
    const method = db.data.methods.find(m => m.id === id);
    
    if (!method) {
      return res.status(404).json({ success: false, error: 'Método no encontrado' });
    }
    
    res.json({ success: true, data: method });
  } catch (error) {
    console.error('Error obteniendo método:', error);
    res.status(500).json({ success: false, error: 'Error al obtener método' });
  }
});

// POST - Crear método de pago (ADMIN)
router.post('/', async (req, res) => {
  try {
    const { name, type, description, icon, logo, qrImage, config, active } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos (name, type)' });
    }
    
    const db = getDB('paymentMethods');
    await db.read();
    
    // Generar ID automáticamente
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    
    const newMethod = {
      id,
      name,
      type, // 'bank', 'crypto', 'ewallet', 'other'
      description: description || '',
      icon: icon || '',
      logo: logo || '',
      qrImage: qrImage || '',
      active: active !== undefined ? active : true,
      config: config || {},
      createdAt: new Date().toISOString()
    };
    
    db.data.methods.push(newMethod);
    await db.write();
    
    console.log(`✅ Método de pago creado: ${name}`);
    
    res.json({ success: true, data: newMethod });
  } catch (error) {
    console.error('Error creando método:', error);
    res.status(500).json({ success: false, error: 'Error al crear método' });
  }
});

// PUT - Actualizar método de pago (ADMIN)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const db = getDB('paymentMethods');
    await db.read();
    
    const index = db.data.methods.findIndex(m => m.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Método no encontrado' });
    }
    
    db.data.methods[index] = {
      ...db.data.methods[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await db.write();
    
    console.log(`✅ Método de pago actualizado: ${id}`);
    
    res.json({ success: true, data: db.data.methods[index] });
  } catch (error) {
    console.error('Error actualizando método:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar método' });
  }
});

// DELETE - Eliminar método de pago (ADMIN)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDB('paymentMethods');
    await db.read();
    
    const index = db.data.methods.findIndex(m => m.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Método no encontrado' });
    }
    
    db.data.methods.splice(index, 1);
    await db.write();
    
    console.log(`❌ Método de pago eliminado: ${id}`);
    
    res.json({ success: true, message: 'Método eliminado' });
  } catch (error) {
    console.error('Error eliminando método:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar método' });
  }
});

export default router;
