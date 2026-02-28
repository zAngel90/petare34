import express from 'express';
import { getDB, dbHelpers } from '../database.js';
import { requireAdmin, logAdminAction } from '../middleware/auth.js';
import { processGamepassOrder } from '../services/rbxcrate.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// GET - Obtener órdenes del usuario autenticado (USER)
router.get('/my-orders', async (req, res) => {
  try {
    const { userId, userEmail } = req.query;
    
    if (!userId && !userEmail) {
      return res.status(400).json({ success: false, error: 'userId o userEmail requerido' });
    }
    
    const db = getDB('orders');
    await db.read();
    
    let orders = db.data.orders || [];
    
    // Filtrar por usuario
    if (userId) {
      orders = orders.filter(o => o.userId === parseInt(userId));
    } else if (userEmail) {
      orders = orders.filter(o => o.userEmail === userEmail);
    }
    
    // Ordenar por fecha (más reciente primero)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error obteniendo órdenes del usuario:', error);
    res.status(500).json({ success: false, error: 'Error al obtener órdenes' });
  }
});

// GET - Obtener órdenes por userId (para reviews)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const db = getDB('orders');
    await db.read();
    
    // Filtrar órdenes del usuario
    let orders = (db.data.orders || []).filter(o => o.userId === parseInt(userId));
    
    // Ordenar por fecha (más reciente primero)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error obteniendo órdenes del usuario:', error);
    res.status(500).json({ success: false, error: 'Error al obtener órdenes' });
  }
});

// GET - Obtener órdenes recientes públicas (para mostrar en páginas públicas)
router.get('/recent', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    const db = getDB('orders');
    await db.read();
    
    // Solo órdenes completadas con robloxUserId
    let orders = (db.data.orders || [])
      .filter(o => o.status === 'completed' && o.robloxUserId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit));
    
    // Obtener avatares de la API de Roblox
    const userIds = orders.map(o => o.robloxUserId).filter(Boolean).join(',');
    let avatars = {};
    
    if (userIds) {
      try {
        const avatarResponse = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds}&size=48x48&format=Png&isCircular=false`);
        const avatarData = await avatarResponse.json();
        
        if (avatarData.data) {
          avatarData.data.forEach(item => {
            avatars[item.targetId] = item.imageUrl;
          });
        }
      } catch (err) {
        console.error('Error obteniendo avatares de Roblox:', err);
      }
    }
    
    // Formatear con avatar de Roblox y nombre entrecortado
    const anonymizedOrders = orders.map(order => {
      const username = order.robloxUsername || 'Usuario';
      const maskedName = username.length > 3 
        ? username.substring(0, 2) + '***' + username.substring(username.length - 1)
        : username.substring(0, 1) + '***';
      
      return {
        user: maskedName,
        amount: order.amount,
        time: formatTimeAgo(order.createdAt),
        avatar: avatars[order.robloxUserId] || null
      };
    });
    
    res.json({ success: true, data: anonymizedOrders });
  } catch (error) {
    console.error('Error obteniendo órdenes recientes:', error);
    res.status(500).json({ success: false, error: 'Error al obtener órdenes recientes' });
  }
});

// Función helper para formatear tiempo relativo
function formatTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'hace un momento';
  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  return `hace ${Math.floor(diffDays / 7)}sem`;
}

// GET - Obtener todas las órdenes (ADMIN)
router.get('/', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { status } = req.query;
    
    const db = getDB('orders');
    await db.read();
    
    let orders = db.data.orders || [];
    
    // Filtrar por estado si se especifica
    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    
    // Ordenar por fecha (más reciente primero)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    res.status(500).json({ success: false, error: 'Error al obtener órdenes' });
  }
});

// GET - Obtener orden por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDB('orders');
    await db.read();
    
    const order = dbHelpers.findById(db.data.orders, id);
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error obteniendo orden:', error);
    res.status(500).json({ success: false, error: 'Error al obtener orden' });
  }
});

// POST - Crear nueva orden (REQUIERE comprobante de pago)
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      robloxUsername,
      robloxUserId,
      productType,
      deliveryMethod, // ⭐ Método de entrega (gamepass o grupo)
      productDetails,
      amount,
      price,
      currency,
      paymentMethod,
      paymentProofUrl // ⭐ OBLIGATORIO - URL del comprobante subido
    } = req.body;
    
    // Validar campos obligatorios
    if (!userEmail || !robloxUsername || !productType || !amount || !price) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
    }
    
    // ⭐ VALIDAR que el comprobante sea obligatorio
    if (!paymentProofUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'Debes subir el comprobante de pago antes de crear la orden' 
      });
    }
    
    const db = getDB('orders');
    await db.read();
    
    const newOrder = {
      id: dbHelpers.generateId(db.data.orders),
      userId: userId || null,
      userEmail,
      robloxUsername,
      robloxUserId: robloxUserId || null,
      productType, // 'robux', 'gamepass', 'ingame'
      deliveryMethod: deliveryMethod || null, // ⭐ 'gamepass' o 'grupo'
      productDetails, // Detalles del producto (gamepass ID, nombre, etc.)
      amount: parseInt(amount),
      price: parseFloat(price),
      currency: currency || 'USD',
      paymentMethod: paymentMethod || null,
      status: 'awaiting_verification', // ⭐ NUEVO - esperando verificación del admin
      paymentProof: paymentProofUrl, // ⭐ Guardar URL del comprobante
      adminNotes: '',
      verifiedAt: null, // ⭐ Fecha de verificación por admin
      verifiedBy: null, // ⭐ Admin que verificó
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.data.orders.push(newOrder);
    await db.write();
    
    console.log(`✅ Nueva orden creada: #${newOrder.id} - Esperando verificación`);
    
    // Enviar notificación a administradores
    try {
      const settingsDb = getDB('settings');
      await settingsDb.read();
      
      const emailConfig = settingsDb.data.emailNotifications;
      
      if (emailConfig && emailConfig.enabled && emailConfig.notifyOnNewOrder && emailConfig.adminEmails && emailConfig.adminEmails.length > 0) {
        await emailService.sendOrderNotificationToAdmins(newOrder, emailConfig.adminEmails);
        console.log(`📧 Notificación enviada a ${emailConfig.adminEmails.length} administrador(es)`);
      }
    } catch (emailError) {
      console.error('⚠️ Error enviando notificación por email:', emailError);
      // No fallar la creación de la orden si el email falla
    }
    
    res.json({ success: true, data: newOrder });
  } catch (error) {
    console.error('Error creando orden:', error);
    res.status(500).json({ success: false, error: 'Error al crear orden' });
  }
});

// POST - Procesar gamepass via RBX Crate (ADMIN)
router.post('/:id/process-gamepass', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDB('orders');
    await db.read();
    
    const order = db.data.orders.find(o => o.id === parseInt(id));
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: 'Orden no encontrada' 
      });
    }
    
    // Verificar que sea una orden de robux con método gamepass
    // Aceptar si tiene deliveryMethod=gamepass O si tiene gamepassId en productDetails
    const isGamepassOrder = order.productType === 'robux' && 
      (order.deliveryMethod === 'gamepass' || order.productDetails?.gamepassId);
    
    if (!isGamepassOrder) {
      return res.status(400).json({ 
        success: false, 
        error: 'Esta orden no es de tipo Robux por Gamepass' 
      });
    }
    
    // Verificar que tenga placeId
    if (!order.productDetails?.placeId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Esta orden no tiene placeId. El gamepass debe tener el placeId configurado.' 
      });
    }
    
    console.log('🎫 Admin procesando gamepass con RBX Crate - Orden #' + id);
    
    // Usar gamepassRequiredPrice si existe (precio del gamepass con comisión)
    // Si no, calcular: amount / 0.7
    const gamepassPrice = order.productDetails?.gamepassRequiredPrice 
      ? parseInt(order.productDetails.gamepassRequiredPrice)
      : Math.ceil(parseInt(order.amount) / 0.7);
    
    console.log(`📊 Robux deseados: ${order.amount}, Precio del gamepass: ${gamepassPrice}`);
    
    // Generar un orderId único para RBX Crate (incluye timestamp para evitar duplicados)
    const uniqueOrderId = `${order.id}-${Date.now()}`;
    
    const rbxCrateResult = await processGamepassOrder({
      orderId: uniqueOrderId,
      robloxUsername: order.robloxUsername,
      robuxAmount: gamepassPrice, // Precio del gamepass, NO lo que recibe el cliente
      placeId: parseInt(order.productDetails.placeId),
      isPreOrder: true,
      checkOwnership: false
    });
    
    if (rbxCrateResult.success) {
      console.log('✅ Gamepass procesado exitosamente con RBX Crate');
      
      // Actualizar la orden
      const orderIndex = db.data.orders.findIndex(o => o.id === parseInt(id));
      db.data.orders[orderIndex] = {
        ...db.data.orders[orderIndex],
        rbxCrateOrderId: rbxCrateResult.data.orderId || null,
        rbxCrateStatus: rbxCrateResult.data.status || 'processing',
        rbxCrateResponse: rbxCrateResult.data,
        status: 'processing',
        updatedAt: new Date().toISOString()
      };
      
      await db.write();
      
      res.json({ 
        success: true, 
        message: 'Gamepass procesado exitosamente con RBX Crate',
        data: db.data.orders[orderIndex],
        rbxCrateData: rbxCrateResult.data
      });
    } else {
      console.error('❌ Error procesando gamepass:', rbxCrateResult.error);
      
      // Guardar el error en la orden
      const orderIndex = db.data.orders.findIndex(o => o.id === parseInt(id));
      db.data.orders[orderIndex] = {
        ...db.data.orders[orderIndex],
        rbxCrateError: rbxCrateResult.error,
        rbxCrateErrorAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await db.write();
      
      return res.status(500).json({ 
        success: false, 
        error: rbxCrateResult.error,
        details: 'Error al procesar el gamepass con RBX Crate. Verifica que el placeId y el username sean correctos.'
      });
    }
  } catch (error) {
    console.error('Error procesando gamepass:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error al procesar gamepass con RBX Crate'
    });
  }
});

// PUT - Actualizar estado de la orden (ADMIN)
router.put('/:id/status', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    if (!status) {
      return res.status(400).json({ success: false, error: 'Estado requerido' });
    }
    
    const db = getDB('orders');
    await db.read();
    
    const orderIndex = db.data.orders.findIndex(o => o.id === parseInt(id));
    if (orderIndex === -1) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }
    
    db.data.orders[orderIndex] = {
      ...db.data.orders[orderIndex],
      status,
      adminNotes: adminNotes || db.data.orders[orderIndex].adminNotes,
      verifiedAt: status === 'completed' ? new Date().toISOString() : db.data.orders[orderIndex].verifiedAt,
      verifiedBy: status === 'completed' ? (req.admin?.username || req.admin?.email || 'Admin') : db.data.orders[orderIndex].verifiedBy,
      updatedAt: new Date().toISOString()
    };
    
    await db.write();
    
    console.log(`✅ Orden #${id} actualizada a: ${status}`);
    
    res.json({ success: true, data: db.data.orders[orderIndex] });
  } catch (error) {
    console.error('Error actualizando orden:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar orden' });
  }
});

// PUT - Verificar y aprobar comprobante de pago (ADMIN) - LEGACY
router.put('/:id/verify-payment', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, adminEmail, adminNotes } = req.body;
    
    if (approved === undefined) {
      return res.status(400).json({ success: false, error: 'Debe especificar si se aprueba o rechaza' });
    }
    
    const db = getDB('orders');
    await db.read();
    
    const orderIndex = db.data.orders.findIndex(o => o.id === id);
    
    if (orderIndex === -1) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }
    
    const order = db.data.orders[orderIndex];
    
    // Actualizar orden según aprobación
    const updates = {
      status: approved ? 'processing' : 'rejected',
      verifiedAt: new Date().toISOString(),
      verifiedBy: adminEmail || 'admin',
      updatedAt: new Date().toISOString()
    };
    
    if (adminNotes) {
      updates.adminNotes = adminNotes;
    }
    
    db.data.orders[orderIndex] = { ...order, ...updates };
    await db.write();
    
    console.log(`${approved ? '✅' : '❌'} Orden #${id} ${approved ? 'aprobada' : 'rechazada'} por ${adminEmail}`);
    
    res.json({ success: true, data: db.data.orders[orderIndex] });
  } catch (error) {
    console.error('Error verificando pago:', error);
    res.status(500).json({ success: false, error: 'Error al verificar pago' });
  }
});

// PUT - Actualizar estado de orden (ADMIN)
router.put('/:id/status', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    if (!status) {
      return res.status(400).json({ success: false, error: 'Estado requerido' });
    }
    
    const validStatuses = ['pending', 'awaiting_payment', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Estado inválido' });
    }
    
    const db = getDB('orders');
    await db.read();
    
    const updates = {
      status,
      updatedAt: new Date().toISOString()
    };
    
    if (adminNotes) {
      updates.adminNotes = adminNotes;
    }
    
    if (status === 'completed') {
      updates.completedAt = new Date().toISOString();
    }
    
    const updated = dbHelpers.updateItem(db.data.orders, id, updates);
    
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }
    
    await db.write();
    
    // Auto-eliminar chat de pedido si el estado es final (completed, cancelled, rejected)
    if (status === 'completed' || status === 'cancelled' || status === 'rejected') {
      try {
        const chatDb = getDB('orderChats');
        await chatDb.read();
        
        if (chatDb.data.conversations) {
          const chatIndex = chatDb.data.conversations.findIndex(c => c.orderId === parseInt(id));
          if (chatIndex !== -1) {
            chatDb.data.conversations.splice(chatIndex, 1);
            await chatDb.write();
            console.log(`🗑️ Chat de pedido #${id} eliminado automáticamente (estado: ${status})`);
          }
        }
      } catch (chatError) {
        console.error('Error eliminando chat de pedido:', chatError);
        // No lanzar error, solo loggear
      }
    }
    
    console.log(`✅ Orden #${id} actualizada a: ${status}`);
    
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error actualizando orden:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar orden' });
  }
});

// POST - Subir comprobante de pago
router.post('/:id/payment-proof', async (req, res) => {
  try {
    const { id } = req.params;
    const { proofUrl, transactionId } = req.body;
    
    if (!proofUrl) {
      return res.status(400).json({ success: false, error: 'URL del comprobante requerida' });
    }
    
    const db = getDB('orders');
    await db.read();
    
    const updates = {
      paymentProof: {
        url: proofUrl,
        transactionId: transactionId || '',
        uploadedAt: new Date().toISOString()
      },
      status: 'awaiting_payment'
    };
    
    const updated = dbHelpers.updateItem(db.data.orders, id, updates);
    
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }
    
    await db.write();
    
    console.log(`✅ Comprobante subido para orden #${id}`);
    
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error subiendo comprobante:', error);
    res.status(500).json({ success: false, error: 'Error al subir comprobante' });
  }
});

// DELETE - Cancelar/eliminar orden
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDB('orders');
    await db.read();
    
    const deleted = dbHelpers.deleteItem(db.data.orders, id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }
    
    await db.write();
    
    console.log(`❌ Orden #${id} eliminada`);
    
    res.json({ success: true, message: 'Orden eliminada' });
  } catch (error) {
    console.error('Error eliminando orden:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar orden' });
  }
});

// GET - Estadísticas de órdenes (ADMIN)
router.get('/stats/summary', requireAdmin, async (req, res) => {
  try {
    const db = getDB('orders');
    await db.read();
    
    const orders = db.data.orders || [];
    
    const stats = {
      total: orders.length,
      awaitingVerification: orders.filter(o => o.status === 'awaiting_verification').length, // ⭐ NUEVO
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      completed: orders.filter(o => o.status === 'completed').length,
      rejected: orders.filter(o => o.status === 'rejected').length, // ⭐ NUEVO
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.price, 0),
      pendingRevenue: orders
        .filter(o => o.status === 'awaiting_verification' || o.status === 'processing')
        .reduce((sum, o) => sum + o.price, 0) // ⭐ NUEVO - Revenue pendiente
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
  }
});

export default router;
