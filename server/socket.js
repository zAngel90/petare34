import { Server } from 'socket.io';

export function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*', // En producción, especifica el dominio exacto
      methods: ['GET', 'POST']
    }
  });

  // Almacenar usuarios conectados
  const connectedUsers = new Map(); // userId -> socketId
  const adminSockets = new Set(); // Set de socketIds de admins conectados

  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // Usuario se identifica
    socket.on('user:identify', (data) => {
      const { userId, userName, userType } = data;
      
      if (userType === 'admin') {
        adminSockets.add(socket.id);
        console.log(`👑 Admin conectado: ${userName} (${socket.id})`);
      } else {
        connectedUsers.set(userId, socket.id);
        console.log(`👤 Usuario conectado: ${userName} (ID: ${userId})`);
        
        // Notificar a admins que usuario está online
        adminSockets.forEach(adminSocketId => {
          io.to(adminSocketId).emit('user:online', { userId, userName });
        });
      }
    });

    // Usuario envía mensaje
    socket.on('message:send', (data) => {
      const { conversationId, senderId, senderName, senderType, message, fileUrl, fileType, createdAt, id } = data;

      console.log(`💬 Mensaje de ${senderName} (${senderType}): ${message || (fileType ? `[${fileType}]` : '')}`);

      // Preparar datos completos del mensaje (incluir TODOS los campos)
      const messageData = {
        id: id || Date.now(),
        conversationId,
        senderId,
        senderName,
        senderType,
        message: message || '',
        fileUrl: fileUrl || null,
        fileType: fileType || null,
        createdAt: createdAt || new Date().toISOString(),
        timestamp: createdAt || new Date().toISOString()
      };

      // Enviar mensaje a la conversación
      if (senderType === 'user') {
        // Usuario envía mensaje -> notificar a todos los admins
        adminSockets.forEach(adminSocketId => {
          io.to(adminSocketId).emit('message:received', messageData);
        });
      } else if (senderType === 'admin') {
        // Admin envía mensaje -> enviar al usuario específico
        const userSocketId = connectedUsers.get(data.userId);
        if (userSocketId) {
          io.to(userSocketId).emit('message:received', messageData);
        }
      }

      // Confirmar envío al remitente
      socket.emit('message:sent', { success: true });
    });

    // Mensajes de pedidos (order-chat)
    socket.on('order-message:send', (data) => {
      const { orderId, senderType, senderName, message, fileUrl, fileType, createdAt, id, userId } = data;

      console.log(`Mensaje de pedido #${orderId} de ${senderName} (${senderType})`);

      // Preparar datos completos del mensaje
      const messageData = {
        id: id || Date.now(),
        orderId,
        senderName,
        senderType,
        message: message || '',
        fileUrl: fileUrl || null,
        fileType: fileType || null,
        createdAt: createdAt || new Date().toISOString()
      };

      // Enviar mensaje
      if (senderType === 'user') {
        // Usuario envía mensaje -> notificar a todos los admins
        adminSockets.forEach(adminSocketId => {
          io.to(adminSocketId).emit('order-message:received', messageData);
        });
      } else if (senderType === 'admin') {
        // Admin envía mensaje -> enviar al usuario específico
        const userSocketId = connectedUsers.get(userId);
        if (userSocketId) {
          io.to(userSocketId).emit('order-message:received', messageData);
        }
      }

      // Confirmar envío
      socket.emit('order-message:sent', { success: true });
    });

    // Usuario está escribiendo
    socket.on('typing:start', (data) => {
      const { conversationId, userName, userType } = data;
      
      if (userType === 'user') {
        // Notificar a admins
        adminSockets.forEach(adminSocketId => {
          io.to(adminSocketId).emit('typing:user', { conversationId, userName });
        });
      } else {
        // Admin escribiendo -> notificar al usuario
        const userSocketId = connectedUsers.get(data.userId);
        if (userSocketId) {
          io.to(userSocketId).emit('typing:admin', { conversationId });
        }
      }
    });

    socket.on('typing:stop', (data) => {
      const { conversationId, userType } = data;
      
      if (userType === 'user') {
        adminSockets.forEach(adminSocketId => {
          io.to(adminSocketId).emit('typing:user:stop', { conversationId });
        });
      } else {
        const userSocketId = connectedUsers.get(data.userId);
        if (userSocketId) {
          io.to(userSocketId).emit('typing:admin:stop', { conversationId });
        }
      }
    });

    // Desconexión
    socket.on('disconnect', () => {
      console.log(`🔌 Cliente desconectado: ${socket.id}`);

      // Eliminar de admins si era admin
      if (adminSockets.has(socket.id)) {
        adminSockets.delete(socket.id);
        console.log(`👑 Admin desconectado`);
      }

      // Buscar y eliminar usuario
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          
          // Notificar a admins que usuario salió
          adminSockets.forEach(adminSocketId => {
            io.to(adminSocketId).emit('user:offline', { userId });
          });
          
          break;
        }
      }
    });
  });

  console.log('✅ Socket.IO configurado');

  return io;
}
