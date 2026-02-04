import { useState, useEffect } from 'react';
import { Star, ThumbsUp, CheckCircle, MessageSquare, Filter, Plus } from 'lucide-react';
import { API_CONFIG } from '../config/api';
import { useAuth } from '../context/AuthContext';
import ReviewCard from '../components/ReviewCard';
import ReviewForm from '../components/ReviewForm';
import './Reviews.css';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, 5, 4, 3, 2, 1
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: 'approved'
      });

      if (filter !== 'all') {
        params.append('minRating', filter);
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

  const handleReviewCreated = () => {
    setShowForm(false);
    fetchReviews();
    fetchStats();
  };

  const handleHelpful = async (reviewId) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/reviews/${reviewId}/helpful`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        // Actualizar la reseña en el estado
        setReviews(reviews.map(r => 
          r.id === reviewId ? { ...r, helpful: data.data.helpful } : r
        ));
      }
    } catch (error) {
      console.error('Error marking as helpful:', error);
    }
  };

  return (
    <div className="reviews-page">
      {/* Header */}
      <div className="reviews-header">
        <div className="reviews-header-content">
          <h1>
            <MessageSquare size={32} />
            Reseñas de Clientes
          </h1>
          <p>Lee lo que dicen nuestros clientes sobre su experiencia</p>
        </div>

        {user && (
          <button 
            className="btn-add-review"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={20} />
            Dejar una Reseña
          </button>
        )}
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="reviews-stats">
          <div className="stats-main">
            <div className="average-rating">
              <span className="rating-number">{stats.averageRating}</span>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star}
                    size={24}
                    fill={star <= Math.round(stats.averageRating) ? '#ffd700' : 'none'}
                    color="#ffd700"
                  />
                ))}
              </div>
              <p className="stats-total">Basado en {stats.approved} reseñas</p>
            </div>
          </div>

          <div className="stats-distribution">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats.ratingDistribution[rating];
              const percentage = stats.approved > 0 
                ? (count / stats.approved * 100).toFixed(0) 
                : 0;

              return (
                <div key={rating} className="rating-bar-item">
                  <span className="rating-label">{rating} ⭐</span>
                  <div className="rating-bar-container">
                    <div 
                      className="rating-bar-fill" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="rating-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showForm && (
        <div className="review-form-modal">
          <div className="modal-overlay" onClick={() => setShowForm(false)} />
          <div className="modal-content">
            <ReviewForm 
              user={user}
              onSuccess={handleReviewCreated}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="reviews-filters">
        <div className="filter-label">
          <Filter size={18} />
          Filtrar por:
        </div>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todas
          </button>
          {[5, 4, 3, 2, 1].map(rating => (
            <button 
              key={rating}
              className={`filter-btn ${filter === rating ? 'active' : ''}`}
              onClick={() => setFilter(rating)}
            >
              {rating} ⭐
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="reviews-list">
        {loading ? (
          <div className="reviews-loading">
            <div className="spinner"></div>
            <p>Cargando reseñas...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="no-reviews">
            <MessageSquare size={64} />
            <h3>No hay reseñas aún</h3>
            <p>Sé el primero en dejar una reseña</p>
          </div>
        ) : (
          reviews.map(review => (
            <ReviewCard 
              key={review.id}
              review={review}
              onHelpful={handleHelpful}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Reviews;
