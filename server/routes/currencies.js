import express from 'express';
import { getDB, dbHelpers } from '../database.js';
import { requireAdmin, logAdminAction } from '../middleware/auth.js';

const router = express.Router();

// GET - Obtener todas las monedas
router.get('/', async (req, res) => {
  try {
    const db = getDB('settings');
    await db.read();

    if (!db.data.currencies) {
      // Monedas por defecto
      db.data.currencies = [
        { id: 1, code: 'USD', name: 'Dólar Estadounidense', symbol: '$', flag: '🇺🇸', rate: 1, active: true, order: 1 },
        { id: 2, code: 'COP', name: 'Peso Colombiano', symbol: '$', flag: '🇨🇴', rate: 4000, active: true, order: 2 },
        { id: 3, code: 'ARS', name: 'Peso Argentino', symbol: '$', flag: '🇦🇷', rate: 350, active: true, order: 3 },
        { id: 4, code: 'MXN', name: 'Peso Mexicano', symbol: '$', flag: '🇲🇽', rate: 18, active: true, order: 4 },
        { id: 5, code: 'PEN', name: 'Sol Peruano', symbol: 'S/', flag: '🇵🇪', rate: 3.7, active: true, order: 5 }
      ];
      await db.write();
    }

    const currencies = db.data.currencies.sort((a, b) => a.order - b.order);
    res.json({ success: true, data: currencies });
  } catch (error) {
    console.error('Error obteniendo monedas:', error);
    res.status(500).json({ success: false, error: 'Error al obtener monedas' });
  }
});

// GET - Obtener moneda por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB('settings');
    await db.read();

    const currency = db.data.currencies?.find(c => c.id === parseInt(id));

    if (!currency) {
      return res.status(404).json({ success: false, error: 'Moneda no encontrada' });
    }

    res.json({ success: true, data: currency });
  } catch (error) {
    console.error('Error obteniendo moneda:', error);
    res.status(500).json({ success: false, error: 'Error al obtener moneda' });
  }
});

// POST - Crear moneda (ADMIN)
router.post('/', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { code, name, symbol, flag, rate, active = true } = req.body;

    if (!code || !name || !symbol || !rate) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
    }

    const db = getDB('settings');
    await db.read();

    if (!db.data.currencies) {
      db.data.currencies = [];
    }

    // Verificar que el código no exista
    const exists = db.data.currencies.find(c => c.code.toUpperCase() === code.toUpperCase());
    if (exists) {
      return res.status(400).json({ success: false, error: 'Ya existe una moneda con ese código' });
    }

    const newCurrency = {
      id: dbHelpers.generateId(db.data.currencies),
      code: code.toUpperCase(),
      name,
      symbol,
      flag: flag || '🌐',
      rate: parseFloat(rate),
      active,
      order: db.data.currencies.length + 1,
      createdAt: new Date().toISOString()
    };

    db.data.currencies.push(newCurrency);
    await db.write();

    console.log(`✅ Moneda creada: ${code} - ${name}`);

    res.json({ success: true, data: newCurrency });
  } catch (error) {
    console.error('Error creando moneda:', error);
    res.status(500).json({ success: false, error: 'Error al crear moneda' });
  }
});

// PUT - Actualizar moneda (ADMIN)
router.put('/:id', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, symbol, flag, rate, active, order } = req.body;

    const db = getDB('settings');
    await db.read();

    const currencyIndex = db.data.currencies?.findIndex(c => c.id === parseInt(id));

    if (currencyIndex === -1) {
      return res.status(404).json({ success: false, error: 'Moneda no encontrada' });
    }

    // Actualizar campos
    if (name) db.data.currencies[currencyIndex].name = name;
    if (symbol) db.data.currencies[currencyIndex].symbol = symbol;
    if (flag) db.data.currencies[currencyIndex].flag = flag;
    if (rate) db.data.currencies[currencyIndex].rate = parseFloat(rate);
    if (active !== undefined) db.data.currencies[currencyIndex].active = active;
    if (order !== undefined) db.data.currencies[currencyIndex].order = order;

    db.data.currencies[currencyIndex].updatedAt = new Date().toISOString();

    await db.write();

    console.log(`✅ Moneda actualizada: ${db.data.currencies[currencyIndex].code}`);

    res.json({ success: true, data: db.data.currencies[currencyIndex] });
  } catch (error) {
    console.error('Error actualizando moneda:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar moneda' });
  }
});

// PUT - Establecer moneda como principal (ADMIN)
router.put('/:id/set-primary', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB('settings');
    await db.read();

    const currencyIndex = db.data.currencies?.findIndex(c => c.id === parseInt(id));

    if (currencyIndex === -1) {
      return res.status(404).json({ success: false, error: 'Moneda no encontrada' });
    }

    // Verificar que la moneda esté activa
    if (!db.data.currencies[currencyIndex].active) {
      return res.status(400).json({ success: false, error: 'No se puede establecer como principal una moneda inactiva' });
    }

    // Remover isPrimary de todas las monedas
    db.data.currencies.forEach(currency => {
      currency.isPrimary = false;
    });

    // Establecer la nueva moneda principal
    db.data.currencies[currencyIndex].isPrimary = true;

    // Actualizar también el campo primaryCurrency en settings
    db.data.primaryCurrency = db.data.currencies[currencyIndex].code;
    db.data.currency = db.data.currencies[currencyIndex].code;

    await db.write();

    console.log(`✅ Moneda principal establecida: ${db.data.currencies[currencyIndex].code}`);

    res.json({ success: true, data: db.data.currencies[currencyIndex] });
  } catch (error) {
    console.error('Error estableciendo moneda principal:', error);
    res.status(500).json({ success: false, error: 'Error al establecer moneda principal' });
  }
});

// DELETE - Eliminar moneda (ADMIN)
router.delete('/:id', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB('settings');
    await db.read();

    const currencyIndex = db.data.currencies?.findIndex(c => c.id === parseInt(id));

    if (currencyIndex === -1) {
      return res.status(404).json({ success: false, error: 'Moneda no encontrada' });
    }

    // No permitir eliminar la moneda principal
    if (db.data.currencies[currencyIndex].isPrimary) {
      return res.status(400).json({ success: false, error: 'No se puede eliminar la moneda principal' });
    }

    const deletedCurrency = db.data.currencies.splice(currencyIndex, 1)[0];

    await db.write();

    console.log(`✅ Moneda eliminada: ${deletedCurrency.code}`);

    res.json({ success: true, message: 'Moneda eliminada' });
  } catch (error) {
    console.error('Error eliminando moneda:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar moneda' });
  }
});

// POST - Calcular conversión
router.post('/convert', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;

    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({ success: false, error: 'Faltan parámetros' });
    }

    const db = getDB('settings');
    await db.read();

    const from = db.data.currencies?.find(c => c.code === fromCurrency);
    const to = db.data.currencies?.find(c => c.code === toCurrency);

    if (!from || !to) {
      return res.status(404).json({ success: false, error: 'Moneda no encontrada' });
    }

    // Convertir a USD primero, luego a la moneda destino
    const amountInUSD = amount / from.rate;
    const convertedAmount = amountInUSD * to.rate;

    res.json({
      success: true,
      data: {
        amount,
        fromCurrency,
        toCurrency,
        convertedAmount: parseFloat(convertedAmount.toFixed(2)),
        rate: to.rate / from.rate
      }
    });
  } catch (error) {
    console.error('Error en conversión:', error);
    res.status(500).json({ success: false, error: 'Error al convertir moneda' });
  }
});

export default router;
