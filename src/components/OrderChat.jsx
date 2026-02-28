import { useState, useEffect, useRef } from 'react';
import { Send, X, Package } from 'lucide-react';
import { API_CONFIG } from '../config/api';
import './OrderChat.css';

const OrderChat = ({ order, onClose, userType = 'user' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadMessages();
  }, [order.id]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const adminToken = localStorage.getItem('adminToken');
      
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDER_CHAT.GET_MESSAGES}/${order.id}`,
        {
          headers: {
            'Authorization': `Bearer ${userType === 'admin' ? adminToken : token}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessages(data.data.messages || []);
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const adminToken = localStorage.getItem('adminToken');

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDER_CHAT.SEND_MESSAGE}/${order.id}/message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userType === 'admin' ? adminToken : token}`
          },
          body: JSON.stringify({ message: newMessage.trim() })
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessages([...messages, data.data]);
        setNewMessage('');
      } else {
        alert(data.error || 'Error al enviar mensaje');
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      alert('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="order-chat-modal">
      <div className="order-chat-container">
        {/* Header */}
        <div className="order-chat-header">
          <div className="order-info">
            <Package size={20} />
            <div>
              <h3>Chat - Orden #{order.id}</h3>
              <p>{order.amount} Robux - {order.robloxUsername}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Messages */}
        <div className="order-chat-messages">
          {loading ? (
            <div className="loading-messages">Cargando mensajes...</div>
          ) : messages.length === 0 ? (
            <div className="no-messages">
              <p>No hay mensajes aún</p>
              <small>Envía un mensaje para iniciar la conversación</small>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`message ${msg.sender === userType ? 'own-message' : 'other-message'}`}
              >
                <div className="message-header">
                  <span className="sender-label">
                    {msg.sender === 'admin' ? '👤 Soporte' : '🛍️ Cliente'}
                  </span>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleString('es-PE', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="message-content">
                  {msg.message}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form className="order-chat-input" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje sobre este pedido..."
            disabled={sending}
          />
          <button type="submit" disabled={!newMessage.trim() || sending}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderChat;
