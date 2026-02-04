import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  ExternalLink,
  FileText,
  User,
  Package
} from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './AdminOrders.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('awaiting_verification');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'success' });
  const { getAuthHeaders } = useAdminAuth();

  const showNotification = (title, message, type = 'success') => {
    setModalContent({ title, message, type });
    setShowModal(true);
    setTimeout(() => setShowModal(false), 3000);
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' 
        ? `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS.BASE}`
        : `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS.BASE}?status=${filter}`;
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (orderId, approved) => {
    setVerifying(true);
    try {
      const newStatus = approved ? 'completed' : 'cancelled';
      const adminNotes = approved ? 'Comprobante verificado y pago aprobado' : 'Comprobante rechazado';
      
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/orders/${orderId}/status`,
        {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            status: newStatus,
            adminNotes
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        fetchOrders();
        setSelectedOrder(null);
        showNotification(
          approved ? '✅ Pago Aprobado' : '❌ Pago Rechazado',
          approved ? 'La orden ha sido completada exitosamente' : 'La orden ha sido cancelada',
          approved ? 'success' : 'error'
        );
      } else {
        showNotification('❌ Error', data.error || 'Error al actualizar la orden', 'error');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      showNotification('❌ Error', 'Error al procesar la orden', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      awaiting_verification: { label: 'Esperando Verificación', color: '#ff9500' },
      processing: { label: 'En Proceso', color: '#007aff' },
      completed: { label: 'Completada', color: '#00d084' },
      rejected: { label: 'Rechazada', color: '#ff4757' },
      cancelled: { label: 'Cancelada', color: '#888' },
    };

    const config = statusConfig[status] || { label: status, color: '#888' };
    
    return (
      <span 
        className="order-status-badge"
        style={{ 
          backgroundColor: `${config.color}15`, 
          color: config.color,
          border: `1px solid ${config.color}30`
        }}
      >
        {config.label}
      </span>
    );
  };

  const filters = [
    { value: 'awaiting_verification', label: 'Pendientes Verificación' },
    { value: 'processing', label: 'En Proceso' },
    { value: 'completed', label: 'Completadas' },
    { value: 'rejected', label: 'Rechazadas' },
    { value: 'all', label: 'Todas' },
  ];

  // Filtrar órdenes por búsqueda
  const filteredOrders = orders.filter(order => 
    order.robloxUsername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id?.toString().includes(searchTerm)
  );

  return (
    <div className="admin-orders">
      <div className="admin-section">
        <div className="section-header">
          <div>
            <h2>Gestión de Órdenes</h2>
            <p>Verifica los comprobantes de pago y gestiona las órdenes</p>
          </div>
          <button className="refresh-btn" onClick={fetchOrders}>
            Actualizar
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Buscar por usuario, email o ID de orden..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="orders-filters">
        {filters.map((f) => (
          <button
            key={f.value}
            className={`filter-btn ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="orders-list">
        {loading ? (
          <div className="loading-state">Cargando órdenes...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>No hay órdenes en esta categoría</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-card-header">
                <div className="order-id">
                  <strong>Orden #{order.id}</strong>
                  {getStatusBadge(order.status)}
                </div>
                <div className="order-amount">
                  ${order.price} {order.currency || 'USD'}
                </div>
              </div>

              <div className="order-card-body">
                <div className="order-info">
                  <div className="info-item">
                    <User size={16} />
                    <span>{order.robloxUsername}</span>
                  </div>
                  <div className="info-item">
                    <Package size={16} />
                    <span>{order.amount} {order.productType}</span>
                  </div>
                  <div className="info-item">
                    <Clock size={16} />
                    <span>{new Date(order.createdAt).toLocaleString('es-ES')}</span>
                  </div>
                </div>

                {/* Enlace al Gamepass si existe */}
                {order.productType === 'robux' && order.productDetails?.gamepassId && (
                  <div className="gamepass-link">
                    <span>Gamepass:</span>
                    <a 
                      href={`https://www.roblox.com/game-pass/${order.productDetails.gamepassId}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="roblox-link"
                    >
                      Abrir en Roblox <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                {order.paymentProof && (
                  <div className="payment-proof">
                    <span>Comprobante:</span>
                    <a 
                      href={order.paymentProof} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="proof-link"
                    >
                      Ver comprobante <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>

              {order.status === 'awaiting_verification' && (
                <div className="order-card-actions">
                  <button
                    className="btn-approve"
                    onClick={() => handleVerifyPayment(order.id, true)}
                    disabled={verifying}
                  >
                    <CheckCircle size={18} />
                    Aprobar
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleVerifyPayment(order.id, false)}
                    disabled={verifying}
                  >
                    <XCircle size={18} />
                    Rechazar
                  </button>
                  <button
                    className="btn-details"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye size={18} />
                    Detalles
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalles de Orden #{selectedOrder.id}</h3>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="detail-group">
                <label>Cliente</label>
                <p>{selectedOrder.userEmail}</p>
                <p>{selectedOrder.robloxUsername} (ID: {selectedOrder.robloxUserId})</p>
              </div>

              <div className="detail-group">
                <label>Producto</label>
                <p>{selectedOrder.amount} {selectedOrder.productType}</p>
                {selectedOrder.productType === 'robux' && selectedOrder.productDetails?.gamepassId && (
                  <a 
                    href={`https://www.roblox.com/game-pass/${selectedOrder.productDetails.gamepassId}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="roblox-gamepass-link"
                  >
                    <ExternalLink size={16} />
                    Ver Gamepass en Roblox (ID: {selectedOrder.productDetails.gamepassId})
                  </a>
                )}
                <p className="detail-secondary">{JSON.stringify(selectedOrder.productDetails)}</p>
              </div>

              <div className="detail-group">
                <label>Pago</label>
                <p>${selectedOrder.price} {selectedOrder.currency}</p>
                <p className="detail-secondary">Método: {selectedOrder.paymentMethod || 'N/A'}</p>
              </div>

              {selectedOrder.paymentProof && (
                <div className="detail-group">
                  <label>Comprobante</label>
                  <a 
                    href={selectedOrder.paymentProof} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="proof-image-link"
                  >
                    <img 
                      src={selectedOrder.paymentProof} 
                      alt="Comprobante de pago"
                      className="proof-image"
                    />
                  </a>
                </div>
              )}

              {selectedOrder.adminNotes && (
                <div className="detail-group">
                  <label>Notas Admin</label>
                  <p>{selectedOrder.adminNotes}</p>
                </div>
              )}
            </div>

            {selectedOrder.status === 'awaiting_verification' && (
              <div className="modal-footer">
                <button
                  className="btn-approve"
                  onClick={() => handleVerifyPayment(selectedOrder.id, true)}
                  disabled={verifying}
                >
                  <CheckCircle size={18} />
                  Aprobar Pago
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleVerifyPayment(selectedOrder.id, false)}
                  disabled={verifying}
                >
                  <XCircle size={18} />
                  Rechazar Pago
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de notificación */}
      {showModal && (
        <div className="notification-modal">
          <div className={`notification-content ${modalContent.type}`}>
            <h3>{modalContent.title}</h3>
            <p>{modalContent.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
