import express from 'express';
import multer from 'multer';
import path from 'path';
import { getDB } from '../database.js';
import { isAuthenticated, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configurar multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(7);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// GET - Obtener mensajes de un pedido específico
router.get('/:orderId', isAuthenticated, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.admin?.email;

    const db = getDB('orderChats');
    await db.read();

    // Obtener orden para verificar permisos
    const ordersDb = getDB('orders');
    await ordersDb.read();
    const order = ordersDb.data.orders.find(o => o.id === parseInt(orderId));

    if (!order) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }

    // Verificar que el usuario sea el dueño de la orden o admin
    if (!isAdmin && order.userId !== userId) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para ver este chat' });
    }

    // Buscar chat de la orden
    const chat = db.data.chats.find(c => c.orderId === parseInt(orderId));

    if (!chat) {
      return res.json({ 
        success: true, 
        data: { 
          orderId: parseInt(orderId), 
          messages: [] 
        } 
      });
    }

    res.json({ success: true, data: chat });
  } catch (error) {
    console.error('Error obteniendo chat de orden:', error);
    res.status(500).json({ success: false, error: 'Error al obtener chat' });
  }
});

// POST - Enviar mensaje en el chat de un pedido
router.post('/:orderId/message', isAuthenticated, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { message } = req.body;
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const isAdmin = req.admin?.email;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, error: 'El mensaje no puede estar vacío' });
    }

    // Obtener orden para verificar permisos
    const ordersDb = getDB('orders');
    await ordersDb.read();
    const order = ordersDb.data.orders.find(o => o.id === parseInt(orderId));

    if (!order) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }

    // Verificar que el usuario sea el dueño de la orden o admin
    if (!isAdmin && order.userId !== userId) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para enviar mensajes en este chat' });
    }

    const db = getDB('orderChats');
    await db.read();

    // Buscar o crear chat
    let chat = db.data.chats.find(c => c.orderId === parseInt(orderId));

    if (!chat) {
      chat = {
        orderId: parseInt(orderId),
        userId: order.userId,
        userEmail: order.userEmail,
        messages: [],
        createdAt: new Date().toISOString()
      };
      db.data.chats.push(chat);
    }

    // Agregar mensaje
    const newMessage = {
      orderId: parseInt(orderId),
      senderType: isAdmin ? 'admin' : 'user',
      senderName: isAdmin ? 'Soporte' : (order.robloxUsername || userEmail),
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    chat.messages.push(newMessage);
    chat.lastMessageAt = newMessage.timestamp;

    await db.write();

    console.log(`💬 Nuevo mensaje en orden #${orderId} de ${isAdmin ? 'admin' : 'usuario'}`);

    // Emitir por socket para tiempo real
    const io = req.app.get('io');
    if (io) {
      io.emit('order-message:sent', newMessage);
      console.log('📡 Mensaje emitido por socket');
    }

    res.json({ success: true, data: newMessage });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ success: false, error: 'Error al enviar mensaje' });
  }
});

// POST - Enviar archivo en chat de pedido
router.post('/:orderId/upload', upload.single('file'), async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { senderType, senderName } = req.body;
    
    console.log('📎 Subiendo archivo para pedido:', orderId);
    console.log('📎 File:', req.file);
    console.log('📎 Sender:', senderType, senderName);
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se envió ningún archivo' });
    }

    const db = getDB('orderChats');
    await db.read();

    if (!db.data.chats) {
      db.data.chats = [];
    }

    // Buscar o crear chat para este pedido
    let chat = db.data.chats.find(c => c.orderId === orderId);
    
    if (!chat) {
      chat = {
        orderId: orderId,
        messages: [],
        createdAt: new Date().toISOString()
      };
      db.data.chats.push(chat);
    }

    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    const fileUrl = `/uploads/${req.file.filename}`;

    const newMessage = {
      orderId: orderId,
      senderName: senderName || 'Usuario',
      senderType: senderType || 'user',
      message: '',
      fileUrl: fileUrl,
      fileType: fileType,
      timestamp: new Date().toISOString()
    };

    chat.messages.push(newMessage);
    await db.write();

    console.log('✅ Archivo enviado en pedido:', orderId);

    // Emitir por socket para tiempo real
    const io = req.app.get('io');
    if (io) {
      io.emit('order-message:sent', newMessage);
      console.log('📡 Archivo emitido por socket');
    }

    res.json({ success: true, data: newMessage });
  } catch (error) {
    console.error('❌ Error subiendo archivo:', error);
    res.status(500).json({ success: false, error: error.message || 'Error al subir archivo' });
  }
});

// DELETE - Eliminar chat de un pedido (ADMIN)
router.delete('/:orderId', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    // Verificar que la orden existe
    const ordersDb = getDB('orders');
    await ordersDb.read();
    const order = ordersDb.data.orders.find(o => o.id === orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }

    // Eliminar mensajes del chat si existen
    const db = getDB('orderChats');
    await db.read();

    if (!db.data.chats) {
      db.data.chats = [];
    }

    const chatIndex = db.data.chats.findIndex(c => c.orderId === orderId);
    
    if (chatIndex !== -1) {
      // Si hay chat, eliminarlo
      db.data.chats.splice(chatIndex, 1);
      await db.write();
    }

    // Marcar la orden como "chat eliminado" para ocultarla (aunque no tenga mensajes)
    order.chatDeleted = true;
    order.chatDeletedAt = new Date().toISOString();
    await ordersDb.write();

    console.log('💬 Chat eliminado y orden ocultada:', orderId);
    res.json({ success: true, message: 'Chat eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando chat:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar chat' });
  }
});

export default router;
