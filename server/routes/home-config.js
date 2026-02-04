import express from 'express';
import { getDB, dbHelpers } from '../database.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ========================================
//  SLIDES DEL CARRUSEL
// ========================================

// Obtener todos los slides (público)
router.get('/slides', async (req, res) => {
  try {
    const db = getDB('homeConfig');
    await db.read();
    
    const slides = db.data.slides
      .filter(slide => slide.active)
      .sort((a, b) => a.order - b.order);
    
    res.json({
      success: true,
      data: slides
    });
  } catch (error) {
    console.error('Error obteniendo slides:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener slides'
    });
  }
});

// Obtener todos los slides (admin - incluye inactivos)
router.get('/slides/all', requireAdmin, async (req, res) => {
  try {
    const db = getDB('homeConfig');
    await db.read();
    
    const slides = db.data.slides.sort((a, b) => a.order - b.order);
    
    res.json({
      success: true,
      data: slides
    });
  } catch (error) {
    console.error('Error obteniendo slides:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener slides'
    });
  }
});

// Crear slide
router.post('/slides', requireAdmin, async (req, res) => {
  try {
    const db = getDB('homeConfig');
    await db.read();
    
    const { type, title, description, image, buttons, active, order } = req.body;
    
    const newSlide = {
      id: dbHelpers.generateId(db.data.slides),
      type: type || 'corporate',
      title: title || '',
      description: description || '',
      image: image || '',
      buttons: buttons || [],
      active: active !== undefined ? active : true,
      order: order || db.data.slides.length + 1,
      createdAt: new Date().toISOString()
    };
    
    db.data.slides.push(newSlide);
    await db.write();
    
    res.json({
      success: true,
      data: newSlide
    });
  } catch (error) {
    console.error('Error creando slide:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear slide'
    });
  }
});

// Actualizar slide
router.put('/slides/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB('homeConfig');
    await db.read();
    
    const { id } = req.params;
    const updates = req.body;
    
    const updatedSlide = dbHelpers.updateItem(db.data.slides, id, updates);
    
    if (!updatedSlide) {
      return res.status(404).json({
        success: false,
        message: 'Slide no encontrado'
      });
    }
    
    await db.write();
    
    res.json({
      success: true,
      data: updatedSlide
    });
  } catch (error) {
    console.error('Error actualizando slide:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar slide'
    });
  }
});

// Eliminar slide
router.delete('/slides/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB('homeConfig');
    await db.read();
    
    const { id } = req.params;
    const deleted = dbHelpers.deleteItem(db.data.slides, id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Slide no encontrado'
      });
    }
    
    await db.write();
    
    res.json({
      success: true,
      message: 'Slide eliminado'
    });
  } catch (error) {
    console.error('Error eliminando slide:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar slide'
    });
  }
});

// ========================================
//  PRODUCTOS DESTACADOS
// ========================================

// Obtener productos destacados (público)
router.get('/featured-products', async (req, res) => {
  try {
    const db = getDB('homeConfig');
    await db.read();
    
    const topSales = db.data.featuredProducts.topSales
      .filter(p => p.active)
      .sort((a, b) => a.order - b.order);
    
    const trending = db.data.featuredProducts.trending
      .filter(p => p.active)
      .sort((a, b) => a.order - b.order);
    
    res.json({
      success: true,
      data: {
        topSales,
        trending
      }
    });
  } catch (error) {
    console.error('Error obteniendo productos destacados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos destacados'
    });
  }
});

// Obtener productos destacados (admin - incluye inactivos)
router.get('/featured-products/all', requireAdmin, async (req, res) => {
  try {
    const db = getDB('homeConfig');
    await db.read();
    
    res.json({
      success: true,
      data: db.data.featuredProducts
    });
  } catch (error) {
    console.error('Error obteniendo productos destacados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos destacados'
    });
  }
});

// Actualizar productos Top Ventas
router.put('/featured-products/top-sales', requireAdmin, async (req, res) => {
  try {
    const db = getDB('homeConfig');
    await db.read();
    
    db.data.featuredProducts.topSales = req.body;
    await db.write();
    
    res.json({
      success: true,
      data: db.data.featuredProducts.topSales
    });
  } catch (error) {
    console.error('Error actualizando Top Ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar Top Ventas'
    });
  }
});

// Actualizar productos Trending
router.put('/featured-products/trending', requireAdmin, async (req, res) => {
  try {
    const db = getDB('homeConfig');
    await db.read();
    
    db.data.featuredProducts.trending = req.body;
    await db.write();
    
    res.json({
      success: true,
      data: db.data.featuredProducts.trending
    });
  } catch (error) {
    console.error('Error actualizando Trending:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar Trending'
    });
  }
});

export default router;
