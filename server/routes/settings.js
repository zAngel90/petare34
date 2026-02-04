import express from 'express';
import { getDB } from '../database.js';

const router = express.Router();

// GET /api/settings - Obtener configuración general
router.get('/', async (req, res) => {
  try {
    const db = getDB('settings');
    await db.read();
    
    res.json({
      success: true,
      data: db.data
    });
  } catch (error) {
    console.error('Error obteniendo settings:', error);
    res.status(500).json({ success: false, error: 'Error al obtener configuración' });
  }
});

// PUT /api/settings - Actualizar configuración general (parcial)
router.put('/', async (req, res) => {
  try {
    const db = getDB('settings');
    await db.read();
    
    // Actualizar solo los campos enviados
    Object.keys(req.body).forEach(key => {
      db.data[key] = req.body[key];
    });
    
    await db.write();
    
    console.log('✅ Configuración actualizada');
    
    res.json({
      success: true,
      data: db.data,
      message: 'Configuración actualizada'
    });
  } catch (error) {
    console.error('Error actualizando settings:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar configuración' });
  }
});

export default router;
