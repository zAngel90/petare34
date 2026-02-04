import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Download,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { API_CONFIG } from '../config/api';
import './MyOrders.css';

const MyOrders = () => {
  const { user, getAuthHeaders } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/orders/my-orders?userEmail=${user.email}`
      );

      const data = await response.json();

      if (data.success) {
        // Ya vienen ordenadas del backend
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error cargando órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statuses = {
      'awaiting_verification': {
        label: 'Esperando Verificación',
        icon: Clock,
        color: '#ff9500',
        description: 'Tu pago está siendo verificado'
      },
      'processing': {
        label: 'En Proceso',
        icon: Package,
        color: '#007aff',
        description: 'Estamos procesando tu pedido'
      },
      'completed': {
        label: 'Completado',
        icon: CheckCircle,
        color: '#00d084',
        description: 'Pedido entregado exitosamente'
      },
      'rejected': {
        label: 'Rechazado',
        icon: XCircle,
        color: '#ff4757',
        description: 'El pago no pudo ser verificado'
      },
      'cancelled': {
        label: 'Cancelado',
        icon: XCircle,
        color: '#888',
        description: 'Pedido cancelado'
      }
    };

    return statuses[status] || statuses['processing'];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
                         order.id?.toString().includes(searchTerm.toLowerCase()) ||
                         order.robloxUsername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.productType?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const OrderModal = ({ order, onClose }) => {
    const statusInfo = getStatusInfo(order.status);
    
    // Función auxiliar para obtener nombre del producto
    const getProductName = () => {
      if (order.productType === 'robux') {
        return `${order.amount} Robux`;
      }
      return order.productDetails?.productName || 'Producto In-Game';
    };
    const StatusIcon = statusInfo.icon;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Detalles del Pedido</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <div className="modal-body">
            {/* Estado */}
            <div className="order-status-banner" style={{ background: `${statusInfo.color}20`, borderLeft: `4px solid ${statusInfo.color}` }}>
              <StatusIcon size={32} style={{ color: statusInfo.color }} />
              <div>
                <h3 style={{ color: statusInfo.color }}>{statusInfo.label}</h3>
                <p>{statusInfo.description}</p>
              </div>
            </div>

            {/* Info General */}
            <div className="order-detail-section">
              <h4>Información General</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">ID de Orden</span>
                  <span className="detail-value">#{order.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Fecha</span>
                  <span className="detail-value">{formatDate(order.createdAt)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Método de Pago</span>
                  <span className="detail-value">{order.paymentMethod}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total</span>
                  <span className="detail-value total-price">${order.price?.toFixed(2) || '0.00'} {order.currency || 'USD'}</span>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="order-detail-section">
              <h4>Productos</h4>
              <div className="order-items-list">
                <div className="order-item-detail">
                  <div className="item-info">
                    <span className="item-name">{getProductName()}</span>
                    <span className="item-quantity">x1</span>
                  </div>
                  <span className="item-price">${order.price?.toFixed(2) || '0.00'} {order.currency || 'USD'}</span>
                </div>
              </div>
            </div>

            {/* Comprobante */}
            {order.paymentProof && (
              <div className="order-detail-section">
                <h4>Comprobante de Pago</h4>
                <div className="payment-proof-preview">
                  <img 
                    src={order.paymentProof}
                    alt="Comprobante"
                    className="proof-image"
                  />
                  <a 
                    href={order.paymentProof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-download"
                  >
                    <Download size={18} />
                    Descargar Comprobante
                  </a>
                </div>
              </div>
            )}

            {/* Notas Admin */}
            {order.adminNotes && (
              <div className="order-detail-section">
                <h4>Notas del Administrador</h4>
                <div className="admin-notes">
                  <AlertCircle size={18} />
                  <p>{order.adminNotes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="my-orders-container">
        <div className="orders-error">
          <AlertCircle size={64} />
          <h2>No has iniciado sesión</h2>
          <p>Inicia sesión para ver tus pedidos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-orders-container">
      <div className="orders-header">
        <div>
          <h1>Mis Pedidos</h1>
          <p>Historial de todas tus compras</p>
        </div>
        <div className="orders-stats">
          <div className="stat-badge">
            <Package size={20} />
            <span>{orders.length} pedidos</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="orders-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por ID o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            Todos
          </button>
          <button
            className={`filter-btn ${filterStatus === 'awaiting_verification' ? 'active' : ''}`}
            onClick={() => setFilterStatus('awaiting_verification')}
          >
            <Clock size={16} />
            Pendientes
          </button>
          <button
            className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('completed')}
          >
            <CheckCircle size={16} />
            Completados
          </button>
          <button
            className={`filter-btn ${filterStatus === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilterStatus('rejected')}
          >
            <XCircle size={16} />
            Rechazados
          </button>
        </div>
      </div>

      {/* Lista de Órdenes */}
      {loading ? (
        <div className="orders-loading">
          <div className="spinner"></div>
          <p>Cargando pedidos...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="orders-empty">
          <Package size={64} />
          <h2>No hay pedidos</h2>
          <p>
            {searchTerm || filterStatus !== 'all' 
              ? 'No se encontraron pedidos con estos filtros' 
              : 'Aún no has realizado ninguna compra'}
          </p>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div className="order-id">
                    <Package size={20} />
                    <span>Pedido #{order.id}</span>
                  </div>
                  <div 
                    className="order-status"
                    style={{ 
                      background: `${statusInfo.color}20`,
                      color: statusInfo.color,
                      border: `1px solid ${statusInfo.color}40`
                    }}
                  >
                    <StatusIcon size={16} />
                    {statusInfo.label}
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-items-preview">
                    <div className="item-preview">
                      <span className="item-preview-name">
                        {order.productType === 'robux' 
                          ? `${order.amount} Robux` 
                          : order.productDetails?.productName || 'Producto In-Game'}
                      </span>
                      <span className="item-preview-qty">x1</span>
                    </div>
                  </div>

                  <div className="order-meta">
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                    <span className="order-total">{order.price} {order.currency}</span>
                  </div>
                </div>

                <div className="order-card-footer">
                  <button 
                    className="btn-view-order"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye size={18} />
                    Ver Detalles
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalles */}
      {selectedOrder && (
        <OrderModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
};

export default MyOrders;
