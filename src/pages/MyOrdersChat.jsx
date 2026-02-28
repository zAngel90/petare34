import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Send, Package, X, Paperclip, Image as ImageIcon, Video } from 'lucide-react';
import { API_CONFIG } from '../config/api';
import { io } from 'socket.io-client';
import './MyOrdersChat.css';

function MyOrdersChat() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Redirigir si no está autenticado (solo después de cargar)
  useEffect(() => {
    // Esperar a que el contexto de auth se cargue
    const checkAuth = setTimeout(() => {
      if (!isAuthenticated && !user) {
        navigate('/login');
      }
    }, 500);

    return () => clearTimeout(checkAuth);
  }, [isAuthenticated, user, navigate]);

  // Conectar socket
  useEffect(() => {
    if (isAuthenticated && user) {
      const userToken = localStorage.getItem('user-token');
      
      const newSocket = io(API_CONFIG.SOCKET_URL, {
        auth: {
          token: userToken
        },
        transports: ['websocket', 'polling']
      });
      
      newSocket.on('connect', () => {
        console.log('✅ Socket conectado para order-chat');
        console.log('🔌 Socket ID:', newSocket.id);
        newSocket.emit('user:connected', {
          userId: user.id,
          username: user.username
        });
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket desconectado');
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Error de conexión socket:', error);
      });

      const handleOrderMessage = (data) => {
        console.log('💬 Mensaje recibido en tiempo real:', data);
        console.log('📋 Agregando a mensajes...');
        setMessages(prev => {
          console.log('📝 Mensajes actuales:', prev.length);
          const newMessages = [...prev, data];
          console.log('📝 Nuevos mensajes:', newMessages.length);
          return newMessages;
        });
      };

      // Escuchar TODOS los eventos para debug
      newSocket.onAny((eventName, ...args) => {
        console.log('🔔 Evento recibido:', eventName, args);
      });

      newSocket.on('order-message:sent', handleOrderMessage);
      console.log('🎧 Listener registrado para order-message:sent');

      setSocket(newSocket);

      return () => {
        console.log('🧹 Limpiando socket...');
        newSocket.off('order-message:sent', handleOrderMessage);
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]); // ❌ Removido selectedOrder de dependencias

  // Cargar pedidos del usuario
  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/orders/my-orders?userEmail=${user.email}`);
      const data = await response.json();
      
      if (data.success) {
        // Filtrar solo pedidos que tienen chat activo (no rechazados, cancelados o con chat eliminado)
        const ordersWithChat = data.data.filter(order => 
          order.status !== 'rejected' && 
          order.status !== 'cancelled' &&
          !order.chatDeleted
        );
        setOrders(ordersWithChat);
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    }
  };

  // Cargar mensajes de un pedido
  const loadMessages = async (orderId) => {
    try {
      const token = localStorage.getItem('user-token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/order-chat/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.data.messages || []);
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  // Seleccionar pedido
  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    loadMessages(order.id);
  };

  // Enviar mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !selectedOrder) return;

    const messageData = {
      message: inputMessage.trim()
    };

    try {
      const token = localStorage.getItem('user-token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/order-chat/${selectedOrder.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(messageData)
      });

      const data = await response.json();

      if (data.success) {
        // NO agregar aquí, esperar a que llegue por socket
        setInputMessage('');
      } else {
        alert('Error al enviar mensaje: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      alert('Error al enviar mensaje');
    }
  };

  // Seleccionar archivo
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

  // Enviar archivo
  const handleSendFile = async () => {
    if (!selectedFile || !selectedOrder) return;

    setUploading(true);

    try {
      const token = localStorage.getItem('user-token');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('senderType', 'user');
      formData.append('senderName', user.username || user.email);

      const response = await fetch(`${API_CONFIG.BASE_URL}/order-chat/${selectedOrder.id}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // NO agregar aquí, esperar a que llegue por socket
        setSelectedFile(null);
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

  // Auto-scroll desactivado
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);

  // Cargar pedidos al montar
  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  return (
    <div className="my-orders-chat">
      <div className="orders-chat-container">
        {/* Sidebar con lista de pedidos */}
        <div className="orders-sidebar">
          <div className="orders-sidebar-header">
            <MessageCircle size={24} />
            <h2>Chats de Pedidos</h2>
          </div>
          
          <div className="orders-list">
            {orders.length === 0 ? (
              <div className="no-orders">
                <Package size={48} />
                <p>No tienes pedidos activos</p>
              </div>
            ) : (
              orders.map(order => (
                <div
                  key={order.id}
                  className={`order-item ${selectedOrder?.id === order.id ? 'active' : ''}`}
                  onClick={() => handleSelectOrder(order)}
                >
                  <div className="order-item-header">
                    <span className="order-id">Pedido #{order.id}</span>
                    <span className={`order-status status-${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="order-item-details">
                    <p className="order-product-name">
                      {order.productType === 'robux' 
                        ? `${order.amount} Robux`
                        : (order.productDetails?.items && order.productDetails.items.length > 0
                            ? order.productDetails.items.map(item => item.name).join(', ')
                            : order.productDetails?.productName || 'Producto In-Game')}
                    </p>
                    <div className="order-meta-info">
                      <span className="order-price">{order.currency} {order.price}</span>
                      <span className="order-date">
                        {new Date(order.createdAt).toLocaleDateString('es-ES', { 
                          day: '2-digit', 
                          month: 'short' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat área */}
        <div className="order-chat-area">
          {selectedOrder ? (
            <>
              {/* Header del chat */}
              <div className="order-chat-header">
                <div>
                  <h3>Pedido #{selectedOrder.id} - {user?.username || user?.email}</h3>
                  <p>
                    {selectedOrder.robloxUsername && (
                      <span style={{ color: '#ffd16d', fontWeight: '600', marginRight: '12px' }}>
                        👤 Usuario Roblox: {selectedOrder.robloxUsername}
                      </span>
                    )}
                    {selectedOrder.productType === 'robux' 
                      ? `${selectedOrder.amount} Robux`
                      : (selectedOrder.productDetails?.items && selectedOrder.productDetails.items.length > 0
                          ? selectedOrder.productDetails.items.map(item => item.name).join(', ')
                          : selectedOrder.productDetails?.productName || 'Producto')}
                    {' - '}
                    {selectedOrder.currency} {selectedOrder.price}
                  </p>
                </div>
                <span className={`order-status-badge status-${selectedOrder.status}`}>
                  {selectedOrder.status}
                </span>
              </div>

              {/* Mensajes */}
              <div className="order-messages">
                {messages.map((msg, idx) => {
                  // Compatibilidad con mensajes antiguos que usan "sender" y nuevos que usan "senderType"
                  const senderType = msg.senderType || msg.sender;
                  return (
                  <div
                    key={idx}
                    className={`order-message ${senderType === 'user' ? 'user-msg' : 'admin-msg'} ${msg.fileUrl ? 'has-media-msg' : ''}`}
                  >
                    <div className={`message-bubble ${msg.fileUrl ? 'has-media' : ''}`}>
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
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Preview de archivo */}
              {selectedFile && (
                <div className="file-preview-order">
                  {selectedFile.type.startsWith('image/') && (
                    <img 
                      src={URL.createObjectURL(selectedFile)} 
                      alt="Preview" 
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: '500' }}>{selectedFile.name}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="btn-remove">
                    <X size={16} />
                  </button>
                  <button onClick={handleSendFile} disabled={uploading} className="btn-send-file">
                    {uploading ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              )}

              {/* Input */}
              <form className="order-chat-input" onSubmit={handleSendMessage}>
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
                  <Paperclip size={20} />
                </button>
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                />
                <button type="submit" disabled={!inputMessage.trim()}>
                  <Send size={20} />
                </button>
              </form>
            </>
          ) : (
            <div className="no-order-selected">
              <MessageCircle size={64} />
              <h3>Selecciona un pedido</h3>
              <p>Elige un pedido de la lista para ver el chat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyOrdersChat;
