import express from 'express';
import { getDB, dbHelpers } from '../database.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET - Obtener conversaciones (ADMIN - todas, USER - solo suyas)
router.get('/conversations', async (req, res) => {
  try {
    const { userId, isAdmin } = req.query;

    const db = getDB('chat');
    await db.read();

    if (!db.data.conversations) {
      db.data.conversations = [];
    }

    let conversations = db.data.conversations;

    // Si es usuario normal, solo sus conversaciones
    if (!isAdmin && userId) {
      conversations = conversations.filter(c => c.userId === parseInt(userId));
    }

    // Ordenar por último mensaje
    conversations.sort((a, b) => 
      new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt)
    );

    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    res.status(500).json({ success: false, error: 'Error al obtener conversaciones' });
  }
});

// GET - Obtener mensajes de una conversación
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const convIdNum = parseInt(conversationId);

    const db = getDB('chat');
    await db.read();

    if (!db.data.messages) {
      db.data.messages = [];
    }

    const messages = db.data.messages
      .filter(m => m.conversationId === convIdNum || m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    console.log(`📥 Obteniendo mensajes de conversación ${conversationId}:`, messages.length);

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({ success: false, error: 'Error al obtener mensajes' });
  }
});

// POST - Crear conversación (cuando usuario inicia chat)
router.post('/conversations', async (req, res) => {
  try {
    const { userId, userName, userEmail } = req.body;

    if (!userId || !userName) {
      return res.status(400).json({ success: false, error: 'Datos de usuario requeridos' });
    }

    const db = getDB('chat');
    await db.read();

    if (!db.data.conversations) {
      db.data.conversations = [];
    }

    // Verificar si ya existe una conversación para este usuario
    let conversation = db.data.conversations.find(c => c.userId === parseInt(userId));

    if (conversation) {
      // Ya existe, devolverla
      console.log(`💬 Conversación existente encontrada: ${conversation.id} - Usuario: ${userName}`);
      return res.json({ success: true, data: conversation });
    }

    // Crear nueva conversación
    conversation = {
      id: dbHelpers.generateId(db.data.conversations),
      userId: parseInt(userId),
      userName,
      userEmail: userEmail || '',
      status: 'open', // open, closed, resolved
      unreadCount: 0,
      lastMessage: '',
      lastMessageAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.data.conversations.push(conversation);
    await db.write();

    console.log(`💬 Nueva conversación creada: ${conversation.id} - Usuario: ${userName}`);

    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Error creando conversación:', error);
    res.status(500).json({ success: false, error: 'Error al crear conversación' });
  }
});

// POST - Enviar mensaje
router.post('/messages', async (req, res) => {
  try {
    const { conversationId, senderId, senderName, senderType, message } = req.body;

    if (!conversationId || !senderId || !message || !senderType) {
      return res.status(400).json({ success: false, error: 'Datos incompletos' });
    }

    const db = getDB('chat');
    await db.read();

    if (!db.data.messages) {
      db.data.messages = [];
    }

    const convIdNum = parseInt(conversationId);

    // Crear mensaje
    const newMessage = {
      id: dbHelpers.generateId(db.data.messages),
      conversationId: convIdNum,
      senderId,
      senderName,
      senderType, // 'user' o 'admin'
      message,
      read: false,
      createdAt: new Date().toISOString()
    };

    db.data.messages.push(newMessage);

    // Actualizar conversación
    const conversation = db.data.conversations.find(c => c.id === convIdNum);
    if (conversation) {
      conversation.lastMessage = message;
      conversation.lastMessageAt = newMessage.createdAt;
      conversation.updatedAt = newMessage.createdAt;
      
      // Incrementar contador de no leídos si el mensaje es del admin al usuario
      if (senderType === 'admin') {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
      }
    } else {
      console.warn(`⚠️ Conversación ${convIdNum} no encontrada para actualizar`);
    }

    await db.write();

    console.log(`💬 Mensaje enviado en conversación ${convIdNum} - ${senderType}: ${message.substring(0, 30)}...`);

    res.json({ success: true, data: newMessage });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ success: false, error: 'Error al enviar mensaje' });
  }
});

// PUT - Marcar mensajes como leídos
router.put('/conversations/:conversationId/read', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;
    const convIdNum = parseInt(conversationId);

    const db = getDB('chat');
    await db.read();

    // Marcar mensajes como leídos
    if (db.data.messages) {
      db.data.messages
        .filter(m => (m.conversationId === convIdNum || m.conversationId === conversationId) && !m.read)
        .forEach(m => m.read = true);
    }

    // Resetear contador en la conversación
    const conversation = db.data.conversations.find(c => c.id === convIdNum);
    if (conversation) {
      conversation.unreadCount = 0;
    }

    await db.write();

    res.json({ success: true, message: 'Mensajes marcados como leídos' });
  } catch (error) {
    console.error('Error marcando mensajes como leídos:', error);
    res.status(500).json({ success: false, error: 'Error al marcar mensajes' });
  }
});

// PUT - Cambiar estado de conversación (ADMIN)
router.put('/conversations/:conversationId/status', requireAdmin, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { status } = req.body;

    if (!['open', 'closed', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Estado inválido' });
    }

    const db = getDB('chat');
    await db.read();

    const conversation = db.data.conversations.find(c => c.id === conversationId);
    
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversación no encontrada' });
    }

    conversation.status = status;
    conversation.updatedAt = new Date().toISOString();

    await db.write();

    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar estado' });
  }
});

export default router;
