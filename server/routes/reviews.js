import express from 'express';
import { getDB } from '../database.js';

const router = express.Router();
const db = { reviews: null };

// Helper para obtener db reviews
const getReviewsDB = () => {
  if (!db.reviews) {
    db.reviews = getDB('reviews');
  }
  return db.reviews;
};

// Helper para generar ID
const generateId = (items) => {
  return items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
};

// GET /api/reviews - Obtener todas las reseñas (con filtros)
router.get('/', async (req, res) => {
  try {
    const reviewsDB = getReviewsDB();
    await reviewsDB.read();
    let reviews = reviewsDB.data.reviews || [];

    // Filtros
    const { status, featured, minRating, rating, userId, productType, limit } = req.query;

    if (status) {
      reviews = reviews.filter(r => r.status === status);
    }

    if (featured === 'true') {
      reviews = reviews.filter(r => r.featured === true);
    }

    if (minRating) {
      reviews = reviews.filter(r => r.rating >= parseInt(minRating));
    }

    // Filtro por rating exacto
    if (rating) {
      reviews = reviews.filter(r => r.rating === parseInt(rating));
    }

    if (userId) {
      reviews = reviews.filter(r => r.userId === parseInt(userId));
    }

    if (productType) {
      reviews = reviews.filter(r => r.productType === productType);
    }

    // Enriquecer con detalles de orden
    const ordersDB = getDB('orders');
    await ordersDB.read();
    const orders = ordersDB.data.orders || [];

    reviews = reviews.map(review => {
      if (review.orderId) {
        const order = orders.find(o => o.id === review.orderId);
        if (order) {
          console.log(`📦 Enriching review ${review.id} with order ${order.id}:`, {
            productName: order.productDetails?.productName,
            packageName: order.productDetails?.packageName,
            itemName: order.productDetails?.itemName,
            productType: order.productType
          });
          return {
            ...review,
            orderDetails: {
              // Prioridad: productName > itemName > packageName
              productName: order.productDetails?.productName || order.productDetails?.itemName || null,
              packageName: order.productDetails?.packageName || null,
              productType: order.productType
            }
          };
        } else {
          console.log(`⚠️ Order ${review.orderId} not found for review ${review.id}`);
        }
      }
      return review;
    });

    // Ordenar por fecha (más recientes primero)
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limitar resultados
    if (limit) {
      reviews = reviews.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: reviews,
      total: reviews.length
    });
  } catch (error) {
    console.error('Error obteniendo reseñas:', error);
    res.status(500).json({ success: false, error: 'Error al obtener reseñas' });
  }
});

// GET /api/reviews/stats - Obtener estadísticas de reseñas
router.get('/stats', async (req, res) => {
  try {
    const reviewsDB = getReviewsDB();
    await reviewsDB.read();
    const reviews = reviewsDB.data.reviews || [];
    const approvedReviews = reviews.filter(r => r.status === 'approved');

    const stats = {
      total: reviews.length,
      approved: approvedReviews.length,
      pending: reviews.filter(r => r.status === 'pending').length,
      rejected: reviews.filter(r => r.status === 'rejected').length,
      averageRating: approvedReviews.length > 0 
        ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
        : 0,
      ratingDistribution: {
        5: approvedReviews.filter(r => r.rating === 5).length,
        4: approvedReviews.filter(r => r.rating === 4).length,
        3: approvedReviews.filter(r => r.rating === 3).length,
        2: approvedReviews.filter(r => r.rating === 2).length,
        1: approvedReviews.filter(r => r.rating === 1).length,
      }
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
  }
});

// GET /api/reviews/:id - Obtener una reseña específica
router.get('/:id', async (req, res) => {
  try {
    const reviewsDB = getReviewsDB();
    await reviewsDB.read();
    const reviews = reviewsDB.data.reviews || [];
    const review = reviews.find(r => r.id === parseInt(req.params.id));

    if (!review) {
      return res.status(404).json({ success: false, error: 'Reseña no encontrada' });
    }

    res.json({ success: true, data: review });
  } catch (error) {
    console.error('Error obteniendo reseña:', error);
    res.status(500).json({ success: false, error: 'Error al obtener reseña' });
  }
});

// POST /api/reviews - Crear nueva reseña (requiere userId)
router.post('/', async (req, res) => {
  try {
    const { userId, userName, userAvatar, rating, title, comment, images, productType, orderId } = req.body;

    // Validaciones
    if (!userId || !userName || !rating || !comment) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan campos requeridos: userId, userName, rating, comment' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'La calificación debe ser entre 1 y 5' 
      });
    }

    // Verificar si el usuario ya dejó una reseña para este producto/orden
    const reviewsDB = getReviewsDB();
    await reviewsDB.read();
    const reviews = reviewsDB.data.reviews || [];
    
    if (orderId) {
      const existingReview = reviews.find(r => r.userId === userId && r.orderId === orderId);
      if (existingReview) {
        return res.status(400).json({ 
          success: false, 
          error: 'Ya has dejado una reseña para esta orden' 
        });
      }
    }

    const newReview = {
      id: generateId(reviews),
      userId,
      userName,
      userAvatar: userAvatar || null,
      rating,
      title: title || '',
      comment,
      images: images || [],
      productType: productType || 'general',
      orderId: orderId || null,
      verified: orderId ? true : false, // Verificado si tiene orderId
      featured: false,
      helpful: 0,
      status: 'pending', // pending, approved, rejected
      adminResponse: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    reviewsDB.data.reviews.push(newReview);
    await reviewsDB.write();

    console.log(`✅ Nueva reseña creada: ID ${newReview.id} por ${userName}`);

    res.status(201).json({
      success: true,
      data: newReview,
      message: 'Reseña creada exitosamente. Pendiente de aprobación.'
    });
  } catch (error) {
    console.error('Error creando reseña:', error);
    res.status(500).json({ success: false, error: 'Error al crear reseña' });
  }
});

// PUT /api/reviews/:id - Actualizar reseña (admin o propietario)
router.put('/:id', async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const updates = req.body;

    const reviewsDB = getReviewsDB();
    await reviewsDB.read();
    const reviews = reviewsDB.data.reviews || [];
    const reviewIndex = reviews.findIndex(r => r.id === reviewId);

    if (reviewIndex === -1) {
      return res.status(404).json({ success: false, error: 'Reseña no encontrada' });
    }

    const review = reviews[reviewIndex];

    // Actualizar campos permitidos
    const allowedUpdates = ['status', 'featured', 'adminResponse', 'rating', 'title', 'comment', 'images'];
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        review[field] = updates[field];
      }
    });

    review.updatedAt = new Date().toISOString();

    db.reviews.data.reviews[reviewIndex] = review;
    await db.reviews.write();

    console.log(`✏️ Reseña actualizada: ID ${reviewId}`);

    res.json({
      success: true,
      data: review,
      message: 'Reseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando reseña:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar reseña' });
  }
});

// DELETE /api/reviews/:id - Eliminar reseña (admin)
router.delete('/:id', async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);

    const reviewsDB = getReviewsDB();
    await reviewsDB.read();
    const reviews = reviewsDB.data.reviews || [];
    const reviewIndex = reviews.findIndex(r => r.id === reviewId);

    if (reviewIndex === -1) {
      return res.status(404).json({ success: false, error: 'Reseña no encontrada' });
    }

    reviewsDB.data.reviews.splice(reviewIndex, 1);
    await reviewsDB.write();

    console.log(`🗑️ Reseña eliminada: ID ${reviewId}`);

    res.json({
      success: true,
      message: 'Reseña eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando reseña:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar reseña' });
  }
});

// POST /api/reviews/:id/helpful - Marcar reseña como útil
router.post('/:id/helpful', async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);

    const reviewsDB = getReviewsDB();
    await reviewsDB.read();
    const reviews = reviewsDB.data.reviews || [];
    const reviewIndex = reviews.findIndex(r => r.id === reviewId);

    if (reviewIndex === -1) {
      return res.status(404).json({ success: false, error: 'Reseña no encontrada' });
    }

    const review = reviews[reviewIndex];
    review.helpful = (review.helpful || 0) + 1;
    review.updatedAt = new Date().toISOString();

    reviewsDB.data.reviews[reviewIndex] = review;
    await reviewsDB.write();

    res.json({
      success: true,
      data: { helpful: review.helpful },
      message: 'Gracias por tu feedback'
    });
  } catch (error) {
    console.error('Error marcando reseña como útil:', error);
    res.status(500).json({ success: false, error: 'Error al procesar solicitud' });
  }
});

export default router;
