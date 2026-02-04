import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Star, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Trash2,
  Clock,
  Filter,
  User,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import './AdminReviews.css';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved, rejected
  const [selectedReview, setSelectedReview] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [filterStatus]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/reviews?${params}`);
      const data = await response.json();

      if (data.success) {
        setReviews(data.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/reviews/stats`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUpdateStatus = async (reviewId, newStatus) => {
    if (!confirm(`¿Cambiar estado a ${newStatus}?`)) return;

    try {
      setProcessing(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        fetchReviews();
        fetchStats();
        if (selectedReview?.id === reviewId) {
          setSelectedReview(data.data);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleFeatured = async (reviewId, currentFeatured) => {
    try {
      setProcessing(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ featured: !currentFeatured })
      });

      const data = await response.json();

      if (data.success) {
        fetchReviews();
        if (selectedReview?.id === reviewId) {
          setSelectedReview(data.data);
        }
      }
    } catch (error) {
      console.error('Error toggling featured:', error);
      alert('Error al actualizar');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddResponse = async (reviewId) => {
    if (!adminResponse.trim()) {
      alert('Escribe una respuesta');
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminResponse: adminResponse.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setAdminResponse('');
        fetchReviews();
        if (selectedReview?.id === reviewId) {
          setSelectedReview(data.data);
        }
        alert('Respuesta agregada');
      }
    } catch (error) {
      console.error('Error adding response:', error);
      alert('Error al agregar respuesta');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!confirm('¿Eliminar esta reseña permanentemente?')) return;

    try {
      setProcessing(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        fetchReviews();
        fetchStats();
        setSelectedReview(null);
        alert('Reseña eliminada');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Error al eliminar');
    } finally {
      setProcessing(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="stars-display">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star}
            size={16}
            fill={star <= rating ? '#ffd700' : 'none'}
            color="#ffd700"
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Pendiente', color: '#ff9500', icon: Clock },
      approved: { label: 'Aprobada', color: '#00d084', icon: CheckCircle },
      rejected: { label: 'Rechazada', color: '#ff4757', icon: XCircle }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className="status-badge" style={{ '--badge-color': badge.color }}>
        <Icon size={14} />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="admin-reviews">
      <div className="admin-reviews-header">
        <h2>
          <MessageSquare size={24} />
          Gestión de Reseñas
        </h2>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="reviews-stats-cards">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(255, 215, 0, 0.15)' }}>
              <MessageSquare size={24} color="#ffd700" />
            </div>
            <div className="stat-card-content">
              <h3>{stats.total}</h3>
              <p>Total Reseñas</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(0, 208, 132, 0.15)' }}>
              <CheckCircle size={24} color="#00d084" />
            </div>
            <div className="stat-card-content">
              <h3>{stats.approved}</h3>
              <p>Aprobadas</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(255, 149, 0, 0.15)' }}>
              <Clock size={24} color="#ff9500" />
            </div>
            <div className="stat-card-content">
              <h3>{stats.pending}</h3>
              <p>Pendientes</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(255, 215, 0, 0.15)' }}>
              <Star size={24} color="#ffd700" />
            </div>
            <div className="stat-card-content">
              <h3>{stats.averageRating}</h3>
              <p>Promedio</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="reviews-filters">
        <div className="filter-label">
          <Filter size={18} />
          Filtrar por estado:
        </div>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            Todas
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            <Clock size={16} />
            Pendientes
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'approved' ? 'active' : ''}`}
            onClick={() => setFilterStatus('approved')}
          >
            <CheckCircle size={16} />
            Aprobadas
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilterStatus('rejected')}
          >
            <XCircle size={16} />
            Rechazadas
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="reviews-list-container">
        {loading ? (
          <div className="loading-state">Cargando reseñas...</div>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={64} />
            <p>No hay reseñas con este filtro</p>
          </div>
        ) : (
          <div className="reviews-table">
            {reviews.map(review => (
              <div key={review.id} className="review-row">
                <div className="review-row-main">
                  <div className="review-user-info">
                    <div className="review-avatar">
                      {review.userAvatar ? (
                        <img src={review.userAvatar} alt={review.userName} />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div className="review-user-details">
                      <div className="review-user-name">
                        {review.userName}
                        {review.verified && <span className="verified-icon">✓</span>}
                      </div>
                      <div className="review-date">
                        <Calendar size={12} />
                        {new Date(review.createdAt).toLocaleString('es-ES')}
                      </div>
                    </div>
                  </div>

                  <div className="review-content-preview">
                    {renderStars(review.rating)}
                    {review.title && <h4>{review.title}</h4>}
                    <p>{review.comment.substring(0, 150)}{review.comment.length > 150 ? '...' : ''}</p>
                    {review.images && review.images.length > 0 && (
                      <div className="has-images">
                        <ImageIcon size={14} />
                        {review.images.length} imagen(es)
                      </div>
                    )}
                  </div>

                  <div className="review-row-actions">
                    {getStatusBadge(review.status)}
                    {review.featured && <span className="featured-tag">⭐ Destacada</span>}
                    <button 
                      className="btn-view-review"
                      onClick={() => setSelectedReview(review)}
                    >
                      <Eye size={16} />
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="review-modal">
          <div className="modal-overlay" onClick={() => setSelectedReview(null)} />
          <div className="modal-content-review">
            <div className="modal-header-review">
              <h3>Detalles de la Reseña</h3>
              <button className="close-modal-btn" onClick={() => setSelectedReview(null)}>×</button>
            </div>

            <div className="modal-body-review">
              {/* User Info */}
              <div className="review-detail-section">
                <div className="review-detail-user">
                  <div className="review-avatar-large">
                    {selectedReview.userAvatar ? (
                      <img src={selectedReview.userAvatar} alt={selectedReview.userName} />
                    ) : (
                      <User size={32} />
                    )}
                  </div>
                  <div>
                    <h4>{selectedReview.userName}</h4>
                    <p className="review-detail-date">
                      {new Date(selectedReview.createdAt).toLocaleString('es-ES')}
                    </p>
                  </div>
                  {selectedReview.verified && (
                    <span className="verified-badge-large">✓ Compra Verificada</span>
                  )}
                </div>
              </div>

              {/* Rating & Content */}
              <div className="review-detail-section">
                <div className="review-rating-large">
                  {renderStars(selectedReview.rating)}
                  <span className="rating-number">{selectedReview.rating}/5</span>
                </div>
                {selectedReview.orderId && (
                  <div className="review-order-badge" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: 'rgba(0, 208, 132, 0.15)',
                    color: '#00d084',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    border: '1px solid rgba(0, 208, 132, 0.3)',
                    marginBottom: '16px'
                  }}>
                    <CheckCircle size={18} />
                    Pedido #{selectedReview.orderId} (Reseña Verificada)
                  </div>
                )}
                {selectedReview.title && <h3 className="review-title-large">{selectedReview.title}</h3>}
                <p className="review-comment-large">{selectedReview.comment}</p>
              </div>

              {/* Images */}
              {selectedReview.images && selectedReview.images.length > 0 && (
                <div className="review-detail-section">
                  <h4>Imágenes adjuntas</h4>
                  <div className="review-images-grid">
                    {selectedReview.images.map((image, index) => {
                      const imageUrl = image.startsWith('http') ? image : `${API_CONFIG.SERVER_URL}${image}`;
                      return (
                        <img 
                          key={index}
                          src={imageUrl} 
                          alt={`Review ${index + 1}`}
                          onClick={() => window.open(imageUrl, '_blank')}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Admin Response */}
              <div className="review-detail-section">
                <h4>Respuesta del equipo</h4>
                {selectedReview.adminResponse ? (
                  <div className="admin-response-display">
                    {selectedReview.adminResponse}
                  </div>
                ) : (
                  <div className="admin-response-form">
                    <textarea
                      placeholder="Escribe una respuesta..."
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      rows={3}
                    />
                    <button 
                      className="btn-add-response"
                      onClick={() => handleAddResponse(selectedReview.id)}
                      disabled={processing}
                    >
                      Agregar Respuesta
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="review-detail-actions">
                <div className="action-buttons-left">
                  {selectedReview.status !== 'approved' && (
                    <button 
                      className="btn-action btn-approve"
                      onClick={() => handleUpdateStatus(selectedReview.id, 'approved')}
                      disabled={processing}
                    >
                      <CheckCircle size={18} />
                      Aprobar
                    </button>
                  )}
                  {selectedReview.status !== 'rejected' && (
                    <button 
                      className="btn-action btn-reject"
                      onClick={() => handleUpdateStatus(selectedReview.id, 'rejected')}
                      disabled={processing}
                    >
                      <XCircle size={18} />
                      Rechazar
                    </button>
                  )}
                  <button 
                    className="btn-action btn-featured"
                    onClick={() => handleToggleFeatured(selectedReview.id, selectedReview.featured)}
                    disabled={processing}
                  >
                    <Star size={18} />
                    {selectedReview.featured ? 'Quitar Destacada' : 'Marcar Destacada'}
                  </button>
                </div>
                <button 
                  className="btn-action btn-delete"
                  onClick={() => handleDelete(selectedReview.id)}
                  disabled={processing}
                >
                  <Trash2 size={18} />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
