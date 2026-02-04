import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, User, Clock, CheckCircle } from 'lucide-react';
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
  const messagesEndRef = useRef(null);
  const { getAuthHeaders } = useAdminAuth();

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
              id: Date.now() + Math.random(),
              message: data.message,
              senderName: data.senderName,
              senderType: data.senderType,
              createdAt: data.timestamp
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
                      <p>{msg.message}</p>
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

              {/* Input */}
              <form className="messages-input" onSubmit={handleSendMessage}>
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
