import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Download,
  AlertCircle,
  Search,
  Filter,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  DollarSign
} from 'lucide-react';
import { API_CONFIG } from '../config/api';
import './MyOrders.css';

const MyOrders = () => {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Calcular estadísticas
  const stats = {
    total: orders.length,
    completed: orders.filter(o => o.status === 'completed').length,
    pending: orders.filter(o => o.status === 'awaiting_verification' || o.status === 'processing').length,
    totalSpent: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0)
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
        <button 
          className="btn-order-chats"
          onClick={() => navigate('/my-orders-chat')}
        >
          <MessageSquare size={18} />
          Chats de Pedidos
        </button>
      </div>

      {/* Estadísticas */}
      <div className="orders-stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ffd16d20', color: '#ffd16d' }}>
            <ShoppingBag size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Pedidos</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#00d08420', color: '#00d084' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Completados</span>
            <span className="stat-value">{stats.completed}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ff950020', color: '#ff9500' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pendientes</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#667eea20', color: '#667eea' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Gastado</span>
            <span className="stat-value">${stats.totalSpent.toFixed(2)}</span>
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
                          : order.productDetails?.items && Array.isArray(order.productDetails.items)
                            ? order.productDetails.items.map(item => item.name).join(', ')
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
                    onClick={() => navigate(`/order/${order.id}`)}
                  >
                    <Eye size={18} />
                    Ver Detalles Completos
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
