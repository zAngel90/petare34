import express from 'express';
import { getDB, dbHelpers } from '../database.js';
import { requireAdmin, logAdminAction } from '../middleware/auth.js';

const router = express.Router();

// GET - Obtener tasa de cambio actual
router.get('/current', async (req, res) => {
  try {
    const db = getDB('settings');
    await db.read();

    if (!db.data.exchangeRate) {
      db.data.exchangeRate = {
        rate: 0.03, // S/0.03 PEN = 1 Robux (por defecto)
        currency: 'PEN',
        lastUpdated: new Date().toISOString(),
        updatedBy: 'system'
      };
      await db.write();
    }

    res.json({ success: true, data: db.data.exchangeRate });
  } catch (error) {
    console.error('Error obteniendo tasa de cambio:', error);
    res.status(500).json({ success: false, error: 'Error al obtener tasa de cambio' });
  }
});

// PUT - Actualizar tasa de cambio (ADMIN)
router.put('/current', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { rate } = req.body;

    if (!rate || rate <= 0) {
      return res.status(400).json({ success: false, error: 'Tasa inválida' });
    }

    const db = getDB('settings');
    await db.read();

    db.data.exchangeRate = {
      rate: parseFloat(rate),
      currency: 'PEN',
      lastUpdated: new Date().toISOString(),
      updatedBy: req.admin?.email || 'admin'
    };

    await db.write();

    console.log(`✅ Tasa de cambio actualizada: S/${rate} PEN = 1 Robux`);

    res.json({ success: true, data: db.data.exchangeRate });
  } catch (error) {
    console.error('Error actualizando tasa de cambio:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar tasa de cambio' });
  }
});

export default router;
