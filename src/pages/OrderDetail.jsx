import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  CreditCard, 
  User, 
  Download,
  AlertCircle,
  ShoppingBag,
  DollarSign
} from 'lucide-react';
import { API_CONFIG } from '../config/api';
import OrderProgress from '../components/OrderProgress';
import OrderChatWidget from '../components/OrderChatWidget';
import './OrderDetail.css';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);

  useEffect(() => {
    if (user && orderId) {
      loadOrderDetails();
    }
  }, [user, orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/orders/my-orders?userEmail=${user.email}`
      );

      const data = await response.json();

      if (data.success) {
        const foundOrder = data.data.find(o => o.id === parseInt(orderId));
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError('Pedido no encontrado');
        }
      } else {
        setError('Error al cargar el pedido');
      }
    } catch (error) {
      console.error('Error cargando detalles del pedido:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProductName = () => {
    if (!order) return '';
    
    if (order.productType === 'robux') {
      return `${order.amount} Robux`;
    }
    
    if (order.productDetails?.items && Array.isArray(order.productDetails.items)) {
      return order.productDetails.items.map(item => item.name).join(', ');
    }
    
    return order.productDetails?.productName || 'Producto In-Game';
  };

  const getDeliveryMethodLabel = () => {
    if (!order) return '';
    
    if (order.productType === 'robux') {
      const method = order.deliveryMethod;
      if (method === 'gamepass') return '🎫 Gamepass';
      if (method === 'group') return '👥 Grupo';
      if (method === 'direct') return '⚡ Directo';
    }
    
    return 'Entrega estándar';
  };

  if (!user) {
    return (
      <div className="order-detail-container">
        <div className="order-error">
          <AlertCircle size={64} />
          <h2>No has iniciado sesión</h2>
          <p>Inicia sesión para ver los detalles del pedido</p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="order-detail-container">
        <div className="order-loading">
          <div className="spinner-large"></div>
          <p>Cargando detalles del pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-detail-container">
        <div className="order-error">
          <AlertCircle size={64} />
          <h2>Error</h2>
          <p>{error || 'No se pudo cargar el pedido'}</p>
          <button onClick={() => navigate('/orders')} className="btn-primary">
            Volver a Mis Pedidos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-detail-container">
      {/* Header con botón de volver */}
      <div className="order-detail-header">
        <button className="btn-back" onClick={() => navigate('/orders')}>
          <ArrowLeft size={20} />
          Volver a Mis Pedidos
        </button>
        <div className="order-detail-title">
          <Package size={32} />
          <div>
            <h1>Pedido #{order.id}</h1>
            <p>Realizado el {formatDate(order.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Grid principal */}
      <div className="order-detail-grid">
        {/* Columna izquierda */}
        <div className="order-detail-main">
          {/* Timeline de progreso */}
          <div className="detail-section">
            <h2>Estado del Pedido</h2>
            <OrderProgress status={order.status} />
          </div>

          {/* Información del producto */}
          <div className="detail-section">
            <h2>
              <ShoppingBag size={24} />
              Detalles del Producto
            </h2>
            <div className="product-info-card">
              <div className="product-main-info">
                <div className="product-icon">
                  <Package size={40} />
                </div>
                <div className="product-details">
                  <h3>{getProductName()}</h3>
                  <div className="product-meta">
                    <span className="product-type">
                      {order.productType === 'robux' ? 'Robux' : 'Item In-Game'}
                    </span>
                    {order.productType === 'robux' && (
                      <span className="delivery-method">
                        {getDeliveryMethodLabel()}
                      </span>
                    )}
                  </div>
                  {order.robloxUsername && (
                    <div className="roblox-user-info">
                      <User size={16} />
                      <span>Usuario: {order.robloxUsername}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="product-price">
                <DollarSign size={20} />
                <span>{order.price} {order.currency}</span>
              </div>
            </div>
          </div>

          {/* Información de pago */}
          <div className="detail-section">
            <h2>
              <CreditCard size={24} />
              Información de Pago
            </h2>
            <div className="payment-info-grid">
              <div className="info-item">
                <span className="info-label">Método de Pago</span>
                <span className="info-value">{order.paymentMethod}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Monto Total</span>
                <span className="info-value total-amount">
                  {order.price} {order.currency}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Fecha de Pago</span>
                <span className="info-value">{formatDate(order.createdAt)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Estado de Pago</span>
                <span className={`payment-status status-${order.status}`}>
                  {order.status === 'completed' ? 'Verificado' : 
                   order.status === 'rejected' ? 'Rechazado' : 
                   order.status === 'awaiting_verification' ? 'Pendiente' : 
                   'En Verificación'}
                </span>
              </div>
            </div>
          </div>

          {/* Comprobante de pago */}
          {order.paymentProof && (
            <div className="detail-section">
              <h2>
                <Download size={24} />
                Comprobante de Pago
              </h2>
              <div className="payment-proof-container">
                <div 
                  className="proof-image-wrapper"
                  onClick={() => setShowProofModal(true)}
                >
                  <img 
                    src={order.paymentProof}
                    alt="Comprobante de pago"
                    className="proof-image"
                  />
                  <div className="proof-overlay">
                    <span>Click para ver en tamaño completo</span>
                  </div>
                </div>
                <a 
                  href={order.paymentProof}
                  download
                  className="btn-download-proof"
                >
                  <Download size={18} />
                  Descargar Comprobante
                </a>
              </div>
            </div>
          )}

          {/* Notas del administrador */}
          {order.adminNotes && (
            <div className="detail-section">
              <h2>
                <AlertCircle size={24} />
                Notas del Administrador
              </h2>
              <div className="admin-notes-box">
                <AlertCircle size={20} />
                <p>{order.adminNotes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha - Sidebar */}
        <div className="order-detail-sidebar">
          {/* Resumen del Pedido */}
          <div className="detail-section sidebar-summary">
            <h3>
              <Package size={20} />
              Resumen del Pedido
            </h3>
            
            <div className="sidebar-order-info">
              <div className="sidebar-info-row">
                <span className="sidebar-label">ID del Pedido</span>
                <span className="sidebar-value">#{order.id}</span>
              </div>
              
              <div className="sidebar-info-row">
                <span className="sidebar-label">Tipo</span>
                <span className="sidebar-value">
                  {order.productType === 'robux' ? 'Robux' : 'Item In-Game'}
                </span>
              </div>

              {order.productType === 'robux' ? (
                <>
                  <div className="sidebar-info-row">
                    <span className="sidebar-label">Cantidad</span>
                    <span className="sidebar-value highlight">{order.amount} Robux</span>
                  </div>
                  <div className="sidebar-info-row">
                    <span className="sidebar-label">Método de Entrega</span>
                    <span className="sidebar-value">{getDeliveryMethodLabel()}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="sidebar-info-row">
                    <span className="sidebar-label">Producto</span>
                    <span className="sidebar-value product-name">{getProductName()}</span>
                  </div>
                  {order.productDetails?.items && order.productDetails.items.length > 0 && (
                    <div className="sidebar-items-list">
                      <span className="sidebar-label">Items:</span>
                      {order.productDetails.items.map((item, idx) => (
                        <div key={idx} className="sidebar-item">
                          <span className="item-name-sidebar">{item.name}</span>
                          <span className="item-quantity-sidebar">x{item.quantity || 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {order.robloxUsername && (
                <div className="sidebar-info-row">
                  <span className="sidebar-label">Usuario Roblox</span>
                  <span className="sidebar-value">{order.robloxUsername}</span>
                </div>
              )}

              <div className="sidebar-divider"></div>

              <div className="sidebar-info-row total-row">
                <span className="sidebar-label">Total Pagado</span>
                <span className="sidebar-value total">{order.price} {order.currency}</span>
              </div>
            </div>
          </div>

          {/* Chat Widget */}
          <OrderChatWidget orderId={order.id} user={user} />
          
          {/* Información de ayuda */}
          <div className="detail-section info-box">
            <h3>¿Necesitas ayuda?</h3>
            <p>
              Utiliza el chat para comunicarte directamente con nuestro equipo de soporte.
              Responderemos lo más pronto posible.
            </p>
            <div className="contact-info">
              <div className="contact-item">
                <Calendar size={16} />
                <span>Lun - Dom: 9:00 AM - 10:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Comprobante */}
      {showProofModal && (
        <div className="proof-modal-overlay" onClick={() => setShowProofModal(false)}>
          <div className="proof-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="proof-modal-close" onClick={() => setShowProofModal(false)}>
              ✕
            </button>
            <img 
              src={order.paymentProof}
              alt="Comprobante de pago - Tamaño completo"
              className="proof-modal-image"
            />
            <div className="proof-modal-actions">
              <a 
                href={order.paymentProof}
                download
                className="btn-modal-download"
              >
                <Download size={18} />
                Descargar
              </a>
              <a 
                href={order.paymentProof}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-modal-open"
              >
                Abrir en nueva pestaña
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
