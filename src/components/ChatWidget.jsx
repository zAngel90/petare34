import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { API_CONFIG } from '../config/api';
import './ChatWidget.css';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const { user, isAuthenticated } = useAuth();

  // Inicializar Socket.IO
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      const newSocket = io(API_CONFIG.SOCKET_URL);

      newSocket.on('connect', () => {
        console.log('💬 Conectado al chat');
        
        // Identificarse con el servidor
        newSocket.emit('user:identify', {
          userId: user.id,
          userName: user.username,
          userType: 'user'
        });
      });

      newSocket.on('message:received', (data) => {
        console.log('📨 Mensaje recibido:', data);
        setMessages(prev => [...prev, {
          id: Date.now(),
          message: data.message,
          senderName: data.senderName,
          senderType: data.senderType,
          createdAt: data.timestamp
        }]);
      });

      newSocket.on('typing:admin', () => {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      });

      newSocket.on('typing:admin:stop', () => {
        setIsTyping(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, isOpen, user]);

  // Cargar conversación y mensajes
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadOrCreateConversation();
    }
  }, [isAuthenticated, isOpen]);

  // Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadOrCreateConversation = async () => {
    try {
      // Crear conversación si no existe
      const response = await fetch(`${API_CONFIG.BASE_URL}/chat/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          userName: user.username,
          userEmail: user.email
        })
      });

      const data = await response.json();

      if (data.success) {
        setConversationId(data.data.id);
        loadMessages(data.data.id);
      }
    } catch (error) {
      console.error('Error cargando conversación:', error);
    }
  };

  const loadMessages = async (convId) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/chat/conversations/${convId}/messages`
      );

      const data = await response.json();

      if (data.success) {
        setMessages(data.data);
        // Marcar como leídos
        markAsRead(convId);
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const markAsRead = async (convId) => {
    try {
      await fetch(`${API_CONFIG.BASE_URL}/chat/conversations/${convId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.id })
      });
    } catch (error) {
      console.error('Error marcando como leído:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || !conversationId) return;

    const messageData = {
      conversationId,
      senderId: user.id,
      senderName: user.username,
      senderType: 'user',
      message: inputMessage.trim()
    };

    // Agregar mensaje localmente
    setMessages(prev => [...prev, {
      ...messageData,
      id: Date.now(),
      createdAt: new Date().toISOString()
    }]);

    setInputMessage('');

    try {
      // Enviar a la API
      await fetch(`${API_CONFIG.BASE_URL}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      // Enviar por socket
      if (socket) {
        socket.emit('message:send', messageData);
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  const handleTyping = () => {
    if (socket && conversationId) {
      socket.emit('typing:start', {
        conversationId,
        userName: user.username,
        userType: 'user'
      });

      // Auto-stop después de 3 segundos
      setTimeout(() => {
        socket.emit('typing:stop', {
          conversationId,
          userType: 'user'
        });
      }, 3000);
    }
  };

  if (!isAuthenticated) {
    return null; // No mostrar chat si no está autenticado
  }

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          className="chat-widget-button"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir chat"
        >
          <MessageCircle size={24} />
          <span className="chat-badge">💬</span>
        </button>
      )}

      {/* Ventana de chat */}
      {isOpen && (
        <div className={`chat-widget ${isMinimized ? 'minimized' : ''}`}>
          {/* Header */}
          <div className="chat-widget-header">
            <div className="chat-header-info">
              <div className="chat-status-indicator online"></div>
              <div>
                <h3>Soporte RLS</h3>
                <p className="chat-status-text">En línea</p>
              </div>
            </div>
            <div className="chat-header-actions">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="chat-action-btn"
              >
                <Minimize2 size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="chat-action-btn"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Mensajes */}
          {!isMinimized && (
            <>
              <div className="chat-widget-messages">
                {messages.length === 0 && (
                  <div className="chat-welcome">
                    <MessageCircle size={48} />
                    <h4>¡Bienvenido al soporte!</h4>
                    <p>¿En qué podemos ayudarte hoy?</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-message ${msg.senderType === 'user' ? 'user-message' : 'admin-message'}`}
                  >
                    <div className="message-content">
                      <strong>{msg.senderType === 'admin' ? 'Soporte' : 'Tú'}</strong>
                      <p>{msg.message}</p>
                      <span className="message-time">
                        {new Date(msg.createdAt).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="chat-message admin-message">
                    <div className="message-content">
                      <div className="typing-indicator">
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
              <form className="chat-widget-input" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Escribe tu mensaje..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleTyping}
                />
                <button type="submit" disabled={!inputMessage.trim()}>
                  <Send size={20} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;
