import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2, Paperclip, Image as ImageIcon, Video } from 'lucide-react';
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user, isAuthenticated } = useAuth();

  // Inicializar Socket.IO (siempre conectado si está autenticado)
  useEffect(() => {
    if (isAuthenticated) {
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
        console.log('Mensaje recibido por socket:', data);
        
        const newMessage = {
          id: data.id || Date.now(),
          message: data.message,
          senderName: data.senderName,
          senderType: data.senderType,
          createdAt: data.createdAt || data.timestamp,
          fileUrl: data.fileUrl || null,
          fileType: data.fileType || null
        };
        
        setMessages(prev => [...prev, newMessage]);
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
  }, [isAuthenticated, user]);

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

  const handleFileSelect = (e) => {
    console.log('🔍 FileSelect triggered (Usuario)');
    const file = e.target.files[0];
    console.log('📎 Archivo seleccionado:', file);
    
    if (file) {
      console.log('📏 Tamaño:', file.size, 'Tipo:', file.type);
      
      // Validar tamaño (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 10MB');
        return;
      }

      // Validar tipo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/avi', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        alert('Tipo de archivo no válido. Solo se permiten imágenes y videos.');
        console.log('❌ Tipo no válido:', file.type);
        return;
      }

      console.log('✅ Archivo válido, guardando en state...');
      setSelectedFile(file);
      console.log('✅ setSelectedFile ejecutado');
    } else {
      console.log('❌ No se seleccionó ningún archivo');
    }
  };

  const handleSendFile = async () => {
    if (!selectedFile || !conversationId) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sender', user.username);
      formData.append('senderType', 'user');

      const response = await fetch(`${API_CONFIG.BASE_URL}/chat/${conversationId}/upload`, {
        method: 'POST',
        // NO enviar headers cuando se usa FormData, el navegador lo maneja automáticamente
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Agregar mensaje con archivo
        setMessages(prev => [...prev, data.data]);
        setSelectedFile(null);
        
        // Emitir por socket
        if (socket) {
          socket.emit('message:send', {
            conversationId,
            ...data.data
          });
        }
      } else {
        alert('Error al enviar archivo: ' + data.error);
      }
    } catch (error) {
      console.error('Error enviando archivo:', error);
      alert('Error al enviar archivo');
    } finally {
      setUploading(false);
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
                      
                      {/* Mostrar archivo si existe */}
                      {msg.fileUrl && (
                        <div style={{ marginTop: '6px' }}>
                          {msg.fileType === 'image' ? (
                            <img 
                              src={`${API_CONFIG.SERVER_URL}${msg.fileUrl}`} 
                              alt="Imagen" 
                              style={{
                                maxWidth: '200px',
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
                                maxWidth: '250px',
                                width: '100%',
                                borderRadius: '8px'
                              }}
                            />
                          )}
                        </div>
                      )}
                      
                      {msg.message && <p>{msg.message}</p>}
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

              {/* Preview de archivo seleccionado */}
              {selectedFile && (
                <div 
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    padding: '10px',
                    margin: '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {/* Miniatura de la imagen */}
                  {selectedFile.type.startsWith('image/') && (
                    <img 
                      src={URL.createObjectURL(selectedFile)} 
                      alt="Preview" 
                      style={{ 
                        width: '50px',
                        height: '50px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }} 
                    />
                  )}
                  
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontSize: '12px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ color: '#888', fontSize: '11px' }}>
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
                    <X size={16} />
                  </button>
                  
                  <button 
                    onClick={handleSendFile}
                    disabled={uploading}
                    type="button"
                    style={{
                      padding: '6px 12px',
                      background: uploading ? '#555' : '#667eea',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
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
              <form className="chat-widget-input" onSubmit={handleSendMessage}>
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
                  <Paperclip size={18} />
                </button>
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
