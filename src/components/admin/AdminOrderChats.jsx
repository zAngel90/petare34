import { useState, useEffect, useRef } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { MessageCircle, Send, Package, X, Paperclip, Image as ImageIcon, Video, Trash2, User } from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import { io } from 'socket.io-client';
import './AdminOrderChats.css';

function AdminOrderChats() {
  const { getAuthHeaders } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Conectar socket
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    
    const newSocket = io(API_CONFIG.SOCKET_URL, {
      auth: {
        token: adminToken
      },
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('connect', () => {
      console.log('✅ Socket conectado para admin order-chat');
      console.log('🔌 Socket ID:', newSocket.id);
      newSocket.emit('admin:connected');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket desconectado (admin)');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Error de conexión socket (admin):', error);
    });

    newSocket.on('order-message:sent', (data) => {
      console.log('💬 Mensaje recibido (admin) en tiempo real:', data);
      console.log('📋 Agregando a mensajes...');
      setMessages(prev => {
        console.log('📝 Mensajes actuales:', prev.length);
        const newMessages = [...prev, data];
        console.log('📝 Nuevos mensajes:', newMessages.length);
        return newMessages;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [selectedOrder]);

  // Cargar todos los pedidos con chat activo
  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/orders`, {
        headers: getAuthHeaders()
      });
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
      const response = await fetch(`${API_CONFIG.BASE_URL}/order-chat/${orderId}`, {
        headers: getAuthHeaders()
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

  // Eliminar chat de pedido
  const handleDeleteChat = async (orderId) => {
    if (!confirm('¿Eliminar el chat de este pedido? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/order-chat/${orderId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        console.log('Chat eliminado correctamente');
        setSelectedOrder(null);
        setMessages([]);
        loadOrders();
      } else {
        alert('Error al eliminar el chat: ' + data.error);
      }
    } catch (error) {
      console.error('Error eliminando chat:', error);
      alert('Error al eliminar el chat');
    }
  };

  // Enviar mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !selectedOrder) return;

    const messageData = {
      message: inputMessage.trim()
    };

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/order-chat/${selectedOrder.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(messageData)
      });

      const data = await response.json();

      if (data.success) {
        // NO agregar aquí, esperar a que llegue por socket
        setInputMessage('');
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
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
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('senderType', 'admin');
      formData.append('senderName', 'Soporte');

      const authHeaders = getAuthHeaders();
      const headersWithoutContentType = {};
      if (authHeaders.Authorization) {
        headersWithoutContentType.Authorization = authHeaders.Authorization;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/order-chat/${selectedOrder.id}/upload`, {
        method: 'POST',
        headers: headersWithoutContentType,
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
    loadOrders();
  }, []);

  return (
    <div className="admin-order-chats">
      <div className="order-chats-container">
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
                <p>No hay pedidos activos</p>
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
                    <p className="order-user-email">
                      <User size={14} />
                      <span>{order.userEmail}</span>
                    </p>
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
                  <h3>
                    Pedido #{selectedOrder.id} - {selectedOrder.userEmail}
                    {selectedOrder.username && <span style={{ color: '#aaa', fontWeight: '500', marginLeft: '8px' }}>({selectedOrder.username})</span>}
                  </h3>
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
                          : selectedOrder.productDetails?.productName || 'Producto In-Game')}
                    {' - '}
                    {selectedOrder.currency} {selectedOrder.price}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`order-status-badge status-${selectedOrder.status}`}>
                    {selectedOrder.status}
                  </span>
                  <button 
                    className="btn-delete-chat"
                    onClick={() => handleDeleteChat(selectedOrder.id)}
                    title="Eliminar chat"
                  >
                    <Trash2 size={18} />
                    Eliminar Chat
                  </button>
                </div>
              </div>

              {/* Mensajes */}
              <div className="order-messages">
                {messages.map((msg, idx) => {
                  // Compatibilidad con mensajes antiguos
                  const senderType = msg.senderType || msg.sender;
                  return (
                  <div
                    key={idx}
                    className={`order-message ${senderType === 'admin' ? 'admin-msg' : 'user-msg'} ${msg.fileUrl ? 'has-media-msg' : ''}`}
                  >
                    <div className={`message-bubble ${msg.fileUrl ? 'has-media' : ''}`}>
                      <strong>{senderType === 'admin' ? 'Tú (Soporte)' : msg.senderName}</strong>
                      
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
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#fff' }}>{selectedFile.name}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="btn-remove">
                    <X size={18} />
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

export default AdminOrderChats;
