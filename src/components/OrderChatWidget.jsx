import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Paperclip, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import { io } from 'socket.io-client';
import './OrderChatWidget.css';

const OrderChatWidget = ({ orderId, user }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Conectar socket
  useEffect(() => {
    if (user && orderId) {
      const userToken = localStorage.getItem('user-token');
      
      const newSocket = io(API_CONFIG.SOCKET_URL, {
        auth: { token: userToken },
        transports: ['websocket', 'polling']
      });
      
      newSocket.on('connect', () => {
        console.log('✅ Socket conectado para order-chat widget');
        newSocket.emit('user:connected', {
          userId: user.id,
          username: user.username
        });
      });

      const handleOrderMessage = (data) => {
        console.log('💬 Mensaje recibido en widget:', data);
        setMessages(prev => [...prev, data]);
      };

      newSocket.on('order-message:sent', handleOrderMessage);
      setSocket(newSocket);

      return () => {
        newSocket.off('order-message:sent', handleOrderMessage);
        newSocket.close();
      };
    }
  }, [user, orderId]);

  // Cargar mensajes
  useEffect(() => {
    if (orderId && user) {
      loadMessages();
    }
  }, [orderId, user]);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('user-token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/order-chat/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.data.messages || []);
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    try {
      const token = localStorage.getItem('user-token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/order-chat/${orderId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: inputMessage.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setInputMessage('');
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 10MB');
        return;
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/avi', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        alert('Tipo de archivo no válido. Solo se permiten imágenes y videos.');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSendFile = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      const token = localStorage.getItem('user-token');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('senderType', 'user');
      formData.append('senderName', user.username || user.email);

      const response = await fetch(`${API_CONFIG.BASE_URL}/order-chat/${orderId}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Error enviando archivo:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="order-chat-widget expanded">
      {/* Header */}
      <div className="widget-header" onClick={() => navigate('/my-orders-chat')}>
        <div className="widget-header-left">
          <MessageCircle size={20} />
          <div>
            <h3>Chat del Pedido</h3>
            <p>Click para ver todos los chats</p>
          </div>
        </div>
        <button className="btn-expand">
          <ExternalLink size={20} />
        </button>
      </div>

      {/* Cuerpo del chat */}
      <>
          {/* Mensajes */}
          <div className="widget-messages">
            {messages.length === 0 ? (
              <div className="no-messages">
                <MessageCircle size={48} />
                <p>No hay mensajes aún</p>
                <span>Inicia una conversación con soporte</span>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const senderType = msg.senderType || msg.sender;
                return (
                  <div
                    key={idx}
                    className={`widget-message ${senderType === 'user' ? 'user-msg' : 'admin-msg'}`}
                  >
                    <div className="message-bubble">
                      <strong>{senderType === 'admin' ? 'Soporte' : 'Tú'}</strong>
                      
                      {msg.fileUrl && (
                        <>
                          {msg.fileType === 'image' ? (
                            <img 
                              src={`${API_CONFIG.SERVER_URL}${msg.fileUrl}`} 
                              alt="Imagen" 
                              onClick={() => window.open(`${API_CONFIG.SERVER_URL}${msg.fileUrl}`, '_blank')}
                            />
                          ) : (
                            <video 
                              src={`${API_CONFIG.SERVER_URL}${msg.fileUrl}`} 
                              controls 
                            />
                          )}
                        </>
                      )}
                      
                      {msg.message && <p>{msg.message}</p>}
                      <span className="msg-time">
                        {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preview de archivo */}
          {selectedFile && (
            <div className="widget-file-preview">
              {selectedFile.type.startsWith('image/') && (
                <img 
                  src={URL.createObjectURL(selectedFile)} 
                  alt="Preview" 
                />
              )}
              <div className="file-info">
                <div className="file-name">{selectedFile.name}</div>
                <div className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</div>
              </div>
              <button onClick={() => setSelectedFile(null)} className="btn-remove-file">
                <X size={16} />
              </button>
              <button onClick={handleSendFile} disabled={uploading} className="btn-send-file">
                {uploading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          )}

          {/* Input */}
          <form className="widget-input" onSubmit={handleSendMessage}>
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
            >
              <Paperclip size={18} />
            </button>
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button type="submit" disabled={!inputMessage.trim()} className="btn-send">
              <Send size={18} />
            </button>
          </form>
      </>
    </div>
  );
};

export default OrderChatWidget;
