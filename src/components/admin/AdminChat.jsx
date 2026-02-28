import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, User, Clock, CheckCircle, Trash2, Paperclip, X, Image as ImageIcon, Video } from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { io } from 'socket.io-client';
import './AdminChat.css';

const AdminChat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { getAuthHeaders } = useAdminAuth();

  // Debug: Ver cuando cambia selectedFile
  useEffect(() => {
    console.log('🔄 selectedFile cambió:', selectedFile);
  }, [selectedFile]);

  // Inicializar Socket.IO
  useEffect(() => {
    const newSocket = io(API_CONFIG.SOCKET_URL);

    newSocket.on('connect', () => {
      console.log('💬 Admin conectado al chat');
      
      // Identificarse como admin
      newSocket.emit('user:identify', {
        userId: 'admin',
        userName: 'Admin',
        userType: 'admin'
      });
    });

    newSocket.on('message:received', (data) => {
      console.log('📨 Nuevo mensaje recibido:', data);
      
      // Siempre actualizar lista de conversaciones
      loadConversations();
      
      // Si estamos viendo esta conversación, agregar el mensaje
      setSelectedConversation(current => {
        if (current && data.conversationId === current.id) {
          setMessages(prev => {
            // Evitar duplicados
            const exists = prev.some(m => 
              m.message === data.message && 
              m.senderType === data.senderType &&
              Math.abs(new Date(m.createdAt) - new Date(data.timestamp)) < 1000
            );
            
            if (exists) {
              return prev;
            }
            
            return [...prev, {
              id: data.id || (Date.now() + Math.random()),
              message: data.message || '',
              senderName: data.senderName,
              senderType: data.senderType,
              createdAt: data.createdAt || data.timestamp,
              fileUrl: data.fileUrl || null, // ✅ Agregar fileUrl
              fileType: data.fileType || null // ✅ Agregar fileType
            }];
          });
          setShouldAutoScroll(true);
        }
        return current;
      });
    });

    newSocket.on('user:online', (data) => {
      console.log('👤 Usuario online:', data.userName);
      setOnlineUsers(prev => new Set([...prev, data.userId]));
    });

    newSocket.on('user:offline', (data) => {
      console.log('👤 Usuario offline:', data.userId);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    newSocket.on('typing:user', (data) => {
      setTypingUsers(prev => new Set([...prev, data.conversationId]));
    });

    newSocket.on('typing:user:stop', (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.conversationId);
        return newSet;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []); // Quitar dependencia de selectedConversation

  // Cargar conversaciones
  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000); // Actualizar cada 10s
    return () => clearInterval(interval);
  }, []);

  // Cargar mensajes cuando se selecciona conversación
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Auto-scroll solo cuando hay nuevos mensajes, no al cargar conversación
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);
  const prevMessagesLengthRef = useRef(0);
  
  useEffect(() => {
    // Solo hacer scroll si:
    // 1. Auto-scroll está activado
    // 2. Se agregó un mensaje nuevo (no carga inicial)
    if (shouldAutoScroll && messages.length > 0 && messages.length > prevMessagesLengthRef.current) {
      scrollToBottom();
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, shouldAutoScroll]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/chat/conversations?isAdmin=true`,
        { headers: getAuthHeaders() }
      );

      const data = await response.json();

      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      // Desactivar auto-scroll al cargar mensajes iniciales
      setShouldAutoScroll(false);
      
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/chat/conversations/${conversationId}/messages`,
        { headers: getAuthHeaders() }
      );

      const data = await response.json();

      console.log('📥 Mensajes cargados:', data); // Debug

      if (data.success) {
        setMessages(data.data);
        
        // Solo reactivar auto-scroll para futuros mensajes, sin hacer scroll inicial
        setTimeout(() => {
          setShouldAutoScroll(true);
        }, 100);
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (!confirm('¿Estás seguro de eliminar esta conversación? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/chat/${chatId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        console.log('🗑️ Chat eliminado correctamente');
        setSelectedConversation(null);
        setMessages([]);
        loadConversations();
      } else {
        alert('Error al eliminar el chat: ' + data.error);
      }
    } catch (error) {
      console.error('Error eliminando chat:', error);
      alert('Error al eliminar el chat');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validar tamaño (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 10MB');
        return;
      }

      // Validar tipo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/avi', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        alert('Tipo de archivo no válido. Solo se permiten imágenes y videos.');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSendFile = async () => {
    console.log('🚀 handleSendFile iniciado');
    console.log('📎 selectedFile:', selectedFile);
    console.log('💬 selectedConversation:', selectedConversation);
    
    if (!selectedFile || !selectedConversation) {
      console.log('❌ No hay archivo o conversación seleccionada');
      return;
    }

    console.log('⏳ Iniciando upload...');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sender', 'Soporte');
      formData.append('senderType', 'admin');

      console.log('📦 FormData creado:', {
        file: selectedFile.name,
        sender: 'Soporte',
        senderType: 'admin'
      });

      // Obtener solo el token sin Content-Type (FormData lo maneja automáticamente)
      const authHeaders = getAuthHeaders();
      const headersWithoutContentType = {};
      if (authHeaders.Authorization) {
        headersWithoutContentType.Authorization = authHeaders.Authorization;
      }

      console.log('🔑 Headers:', headersWithoutContentType);

      const url = `${API_CONFIG.BASE_URL}/chat/${selectedConversation.id}/upload`;
      console.log('🌐 URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: headersWithoutContentType,
        body: formData
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📥 Response data:', data);

      if (data.success) {
        console.log('✅ Archivo enviado correctamente');
        // Agregar mensaje con archivo
        setMessages(prev => [...prev, data.data]);
        setSelectedFile(null);
        
        // Emitir por socket
        if (socket) {
          socket.emit('message:send', {
            conversationId: selectedConversation.id,
            userId: selectedConversation.userId,
            ...data.data
          });
        }

        loadConversations();
      } else {
        console.log('❌ Error del servidor:', data.error);
        alert('Error al enviar archivo: ' + data.error);
      }
    } catch (error) {
      console.error('💥 Error enviando archivo:', error);
      alert('Error al enviar archivo: ' + error.message);
    } finally {
      console.log('🏁 Upload finalizado');
      setUploading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || !selectedConversation) return;

    const messageData = {
      conversationId: selectedConversation.id,
      senderId: 'admin',
      senderName: 'Soporte',
      senderType: 'admin',
      message: inputMessage.trim(),
      userId: selectedConversation.userId
    };

    // Agregar mensaje localmente
    setMessages(prev => [...prev, {
      ...messageData,
      id: Date.now(),
      createdAt: new Date().toISOString()
    }]);

    setInputMessage('');
    
    // Activar auto-scroll al enviar mensaje
    setShouldAutoScroll(true);

    try {
      // Enviar a la API
      await fetch(`${API_CONFIG.BASE_URL}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(messageData)
      });

      // Enviar por socket
      if (socket) {
        socket.emit('message:send', messageData);
      }

      // Actualizar conversaciones
      loadConversations();
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  const handleConversationClick = (conversation) => {
    console.log('🔄 Cambiando a conversación:', conversation);
    setSelectedConversation(conversation);
    setMessages([]);
    setShouldAutoScroll(false);
    // Los mensajes se cargarán por el useEffect que depende de selectedConversation
  };

  const handleStatusChange = async (conversationId, newStatus) => {
    try {
      await fetch(
        `${API_CONFIG.BASE_URL}/chat/conversations/${conversationId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      loadConversations();
      
      if (selectedConversation && selectedConversation.id === conversationId) {
        setSelectedConversation(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  };

  return (
    <div className="admin-chat">
      <div className="admin-section">
        <h2>Chat de Soporte</h2>
        <p>Gestiona las conversaciones con los usuarios</p>
      </div>

      <div className="chat-container">
        {/* Lista de Conversaciones */}
        <div className="conversations-list">
          <div className="conversations-header">
            <h3>Conversaciones</h3>
            <span className="conversations-count">{conversations.length}</span>
          </div>

          {conversations.length === 0 ? (
            <div className="empty-conversations">
              <MessageCircle size={48} />
              <p>No hay conversaciones activas</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''} ${conv.unreadCount > 0 ? 'unread' : ''}`}
                onClick={() => handleConversationClick(conv)}
              >
                <div className="conversation-avatar">
                  <User size={24} />
                  {onlineUsers.has(conv.userId) && (
                    <div className="online-indicator"></div>
                  )}
                </div>

                <div className="conversation-info">
                  <div className="conversation-header-row">
                    <strong>{conv.userName}</strong>
                    <span className="conversation-time">
                      {conv.lastMessageAt
                        ? new Date(conv.lastMessageAt).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : ''}
                    </span>
                  </div>
                  <p className="conversation-last-message">
                    {conv.lastMessage || 'Sin mensajes'}
                  </p>
                  <div className="conversation-meta">
                    <span className={`status-badge ${conv.status}`}>
                      {conv.status === 'open' ? 'Abierta' : conv.status === 'resolved' ? 'Resuelta' : 'Cerrada'}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="unread-badge">{conv.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Área de Mensajes */}
        <div className="messages-area">
          {selectedConversation ? (
            <>
              {/* Header de conversación */}
              <div className="messages-header">
                <div className="user-info">
                  <div className="user-avatar-large">
                    <User size={32} />
                    {onlineUsers.has(selectedConversation.userId) && (
                      <div className="online-indicator"></div>
                    )}
                  </div>
                  <div>
                    <h3>{selectedConversation.userName}</h3>
                    <p className="user-email">{selectedConversation.userEmail}</p>
                  </div>
                </div>
                <button 
                  className="btn-delete-chat"
                  onClick={() => handleDeleteChat(selectedConversation.id)}
                  title="Eliminar conversación"
                >
                  <Trash2 size={18} />
                  Eliminar Chat
                </button>
              </div>

              {/* Mensajes */}
              <div className="messages-content">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message ${msg.senderType === 'admin' ? 'admin-msg' : 'user-msg'}`}
                  >
                    <div className="message-bubble">
                      <strong>{msg.senderType === 'admin' ? 'Tú' : msg.senderName}</strong>
                      
                      {/* Mostrar archivo si existe */}
                      {msg.fileUrl && (
                        <div style={{ marginTop: '8px' }}>
                          {msg.fileType === 'image' ? (
                            <img 
                              src={`${API_CONFIG.SERVER_URL}${msg.fileUrl}`} 
                              alt="Imagen" 
                              style={{
                                maxWidth: '250px',
                                width: '100%',
                                height: 'auto',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                              }}
                              onClick={() => window.open(`${API_CONFIG.SERVER_URL}${msg.fileUrl}`, '_blank')}
                            />
                          ) : (
                            <video 
                              src={`${API_CONFIG.SERVER_URL}${msg.fileUrl}`} 
                              controls 
                              style={{
                                maxWidth: '300px',
                                width: '100%',
                                borderRadius: '8px'
                              }}
                            />
                          )}
                        </div>
                      )}
                      
                      {msg.message && <p>{msg.message}</p>}
                      <span className="msg-time">
                        {new Date(msg.createdAt).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}

                {typingUsers.has(selectedConversation.id) && (
                  <div className="message user-msg">
                    <div className="message-bubble">
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Preview de archivo seleccionado */}
              {selectedFile && (
                <div 
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    padding: '12px',
                    margin: '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {/* Miniatura de la imagen */}
                  {selectedFile.type.startsWith('image/') && (
                    <img 
                      src={URL.createObjectURL(selectedFile)} 
                      alt="Preview" 
                      style={{ 
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }} 
                    />
                  )}
                  
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ color: '#888', fontSize: '12px' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  
                  {/* Botones */}
                  <button 
                    onClick={() => setSelectedFile(null)}
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#999',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <X size={18} />
                  </button>
                  
                  <button 
                    onClick={handleSendFile}
                    disabled={uploading}
                    type="button"
                    style={{
                      padding: '8px 16px',
                      background: uploading ? '#555' : '#667eea',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {uploading ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              )}

              {/* Input */}
              <form className="messages-input" onSubmit={handleSendMessage}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                />
                <button 
                  type="button"
                  className="btn-attach"
                  onClick={() => fileInputRef.current?.click()}
                  title="Adjuntar archivo"
                >
                  <Paperclip size={20} />
                </button>
                <input
                  type="text"
                  placeholder="Escribe tu respuesta..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                />
                <button type="submit" disabled={!inputMessage.trim()}>
                  <Send size={20} />
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <div className="no-conversation-selected">
              <MessageCircle size={64} />
              <h3>Selecciona una conversación</h3>
              <p>Elige una conversación para ver los mensajes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
