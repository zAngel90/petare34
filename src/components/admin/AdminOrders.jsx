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
  Package,
  Zap
} from 'lucide-react';
import DeliveryMethodBadge from '../DeliveryMethodBadge';
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
  const [processingGamepass, setProcessingGamepass] = useState(false);
  const [viewingProof, setViewingProof] = useState(null);
  const { getAuthHeaders } = useAdminAuth();

  const showNotification = (title, message, type = 'success') => {
    setModalContent({ title, message, type });
    setShowModal(true);
    setTimeout(() => setShowModal(false), 3000);
  };

  const handleProcessGamepass = async (orderId) => {
    if (!confirm('¿Estás seguro de procesar este gamepass con RBX Crate?')) {
      return;
    }

    setProcessingGamepass(true);
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS.BASE}/${orderId}/process-gamepass`,
        {
          method: 'POST',
          headers: getAuthHeaders()
        }
      );

      const data = await response.json();

      if (data.success) {
        showNotification('¡Éxito!', data.message || 'Gamepass procesado correctamente con RBX Crate', 'success');
        fetchOrders(); // Recargar órdenes
        setSelectedOrder(null); // Cerrar modal
      } else {
        // Mostrar error completo del backend
        const errorMsg = data.error || 'Error desconocido';
        const details = data.details || '';
        showNotification('Error', `${errorMsg}\n${details}`, 'error');
      }
    } catch (error) {
      showNotification('Error', error.message || 'Error al procesar gamepass con RBX Crate', 'error');
    } finally {
      setProcessingGamepass(false);
    }
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

  const handleChangeStatus = async (orderId, newStatus) => {
    if (!confirm(`¿Cambiar estado de la orden a "${newStatus}"?`)) {
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/orders/${orderId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      const data = await response.json();

      if (data.success) {
        showNotification('¡Éxito!', `Orden actualizada a: ${newStatus}`, 'success');
        fetchOrders();
        setSelectedOrder(null);
      } else {
        showNotification('Error', data.error || 'Error al actualizar la orden', 'error');
      }
    } catch (error) {
      showNotification('Error', error.message || 'Error al actualizar la orden', 'error');
    } finally {
      setVerifying(false);
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
                    <span>{order.amount} Robux</span>
                    {(order.deliveryMethod || order.productDetails?.deliveryMethod) && (
                      <DeliveryMethodBadge method={order.deliveryMethod || order.productDetails.deliveryMethod} size="small" />
                    )}
                    {!order.deliveryMethod && !order.productDetails?.deliveryMethod && order.productDetails?.gamepassId && (
                      <DeliveryMethodBadge method="gamepass" size="small" />
                    )}
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

              {order.status === 'processing' && (
                <div className="order-card-actions">
                  <button
                    className="btn-approve"
                    onClick={() => handleChangeStatus(order.id, 'completed')}
                    disabled={verifying}
                  >
                    <CheckCircle size={18} />
                    Completar
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleChangeStatus(order.id, 'rejected')}
                    disabled={verifying}
                  >
                    <XCircle size={18} />
                    Cancelar
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

              {(order.status === 'completed' || order.status === 'rejected' || order.status === 'cancelled') && (
                <div className="order-card-actions">
                  <button
                    className="btn-details"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye size={18} />
                    Ver Detalles
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
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
                <p style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span>{selectedOrder.amount} Robux</span>
                  {(selectedOrder.deliveryMethod || selectedOrder.productDetails?.deliveryMethod) && (
                    <DeliveryMethodBadge method={selectedOrder.deliveryMethod || selectedOrder.productDetails.deliveryMethod} size="medium" />
                  )}
                  {!selectedOrder.deliveryMethod && !selectedOrder.productDetails?.deliveryMethod && selectedOrder.productDetails?.gamepassId && (
                    <DeliveryMethodBadge method="gamepass" size="medium" />
                  )}
                </p>
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
                  <button
                    onClick={() => setViewingProof(selectedOrder.paymentProof)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      padding: 0, 
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    <img 
                      src={selectedOrder.paymentProof} 
                      alt="Comprobante de pago"
                      className="proof-image"
                      style={{ maxWidth: '100%', borderRadius: '8px', border: '2px solid #ffd700' }}
                    />
                  </button>
                  <small style={{ color: '#888', marginTop: '8px', display: 'block' }}>
                    Haz clic para ver en tamaño completo
                  </small>
                </div>
              )}

              {selectedOrder.adminNotes && (
                <div className="detail-group">
                  <label>Notas Admin</label>
                  <p>{selectedOrder.adminNotes}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {/* Sección de botones de estado */}
              <div className="status-actions-group">
                {selectedOrder.status === 'awaiting_verification' && (
                  <>
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
                  </>
                )}
                
                {selectedOrder.status === 'awaiting_verification' && (
                  <button
                    className="btn-processing"
                    onClick={() => handleChangeStatus(selectedOrder.id, 'processing')}
                    disabled={verifying}
                  >
                    <Clock size={18} />
                    Marcar como En Proceso
                  </button>
                )}
                
                {selectedOrder.status === 'processing' && (
                  <button
                    className="btn-complete"
                    onClick={() => handleChangeStatus(selectedOrder.id, 'completed')}
                    disabled={verifying}
                  >
                    <CheckCircle size={18} />
                    Marcar como Completado
                  </button>
                )}
                
                {(selectedOrder.status === 'awaiting_verification' || selectedOrder.status === 'processing') && (
                  <button
                    className="btn-cancel"
                    onClick={() => handleChangeStatus(selectedOrder.id, 'rejected')}
                    disabled={verifying}
                  >
                    <XCircle size={18} />
                    Cancelar Orden
                  </button>
                )}
              </div>

              {/* Sección de Gamepass - SEPARADA Y DESTACADA */}
              {selectedOrder.productDetails?.placeId && (
                <div className="gamepass-section">
                  <div className="gamepass-badge">
                    <Zap size={16} />
                    <span>Compra automática con RBX Crate disponible</span>
                  </div>
                  <button
                    className="btn-process-gamepass"
                    onClick={() => handleProcessGamepass(selectedOrder.id)}
                    disabled={processingGamepass}
                  >
                    <Zap size={20} />
                    {processingGamepass ? 'Procesando Gamepass...' : 'Comprar Gamepass Automáticamente'}
                  </button>
                </div>
              )}
            </div>
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

      {/* Modal de Comprobante de Pago */}
      {viewingProof && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="proof-modal" onClick={(e) => e.stopPropagation()}>
            <div className="proof-header">
              <h3>Comprobante de Pago</h3>
              <button 
                className="close-btn" 
                onClick={() => setViewingProof(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}
              >
                <XCircle size={32} />
              </button>
            </div>
            <div className="proof-content">
              <img 
                src={viewingProof} 
                alt="Comprobante" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '75vh', 
                  objectFit: 'contain',
                  borderRadius: '8px'
                }} 
              />
            </div>
            <div className="proof-footer">
              <a 
                href={viewingProof} 
                download 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-download"
              >
                Descargar Comprobante
              </a>
              <button 
                onClick={() => setViewingProof(null)}
                style={{
                  padding: '12px 24px',
                  background: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginLeft: '10px'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
