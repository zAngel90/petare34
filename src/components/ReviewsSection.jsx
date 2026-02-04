import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageSquare, ArrowRight, User } from 'lucide-react';
import { API_CONFIG } from '../config/api';
import './ReviewsSection.css';

const ReviewsSection = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopReviews();
  }, []);

  const fetchTopReviews = async () => {
    try {
      setLoading(true);
      
      // Fetch top featured reviews
      const reviewsResponse = await fetch(`${API_CONFIG.BASE_URL}/reviews?status=approved&featured=true&limit=6`);
      const reviewsData = await reviewsResponse.json();
      
      // Fetch stats
      const statsResponse = await fetch(`${API_CONFIG.BASE_URL}/reviews/stats`);
      const statsData = await statsResponse.json();

      if (reviewsData.success) {
        setReviews(reviewsData.data);
      }

      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="review-stars-mini">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star}
            size={14}
            fill={star <= rating ? '#ffd700' : 'none'}
            color="#ffd700"
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return null; // O un skeleton loader
  }

  if (reviews.length === 0) {
    return null; // No mostrar si no hay reseñas
  }

  return (
    <section className="reviews-section-home">
      <div className="reviews-section-header">
        <div className="section-title-group">
          <h2>
            <MessageSquare size={28} />
            Lo Que Dicen Nuestros Clientes
          </h2>
          {stats && (
            <div className="reviews-stats-mini">
              <div className="stat-rating">
                <span className="stat-number">{stats.averageRating}</span>
                <div className="stat-stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star}
                      size={16}
                      fill={star <= Math.round(stats.averageRating) ? '#ffd700' : 'none'}
                      color="#ffd700"
                    />
                  ))}
                </div>
              </div>
              <span className="stat-count">Basado en {stats.approved} reseñas</span>
            </div>
          )}
        </div>
        <Link to="/reviews" className="see-all-reviews-link">
          Ver todas las reseñas
          <ArrowRight size={18} />
        </Link>
      </div>

      <div className="reviews-grid">
        {reviews.map(review => (
          <div key={review.id} className="review-card-mini">
            <div className="review-card-mini-header">
              {renderStars(review.rating)}
              {review.verified && (
                <span className="verified-mini">✓ Verificado</span>
              )}
            </div>

            {review.title && (
              <h4 className="review-card-mini-title">{review.title}</h4>
            )}

            <p className="review-card-mini-comment">
              {review.comment.length > 120 
                ? `${review.comment.substring(0, 120)}...` 
                : review.comment
              }
            </p>

            {review.images && review.images.length > 0 && (
              <div className="review-images-mini">
                {review.images.slice(0, 3).map((image, index) => (
                  <img 
                    key={index}
                    src={image} 
                    alt={`Review ${index + 1}`}
                  />
                ))}
              </div>
            )}

            <div className="review-card-mini-footer">
              <div className="reviewer-mini">
                <div className="reviewer-avatar-mini">
                  {review.userAvatar ? (
                    <img src={review.userAvatar} alt={review.userName} />
                  ) : (
                    <User size={16} />
                  )}
                </div>
                <span className="reviewer-name-mini">{review.userName}</span>
              </div>
              <span className="review-date-mini">
                {new Date(review.createdAt).toLocaleDateString('es-ES', {
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="reviews-section-cta">
        <Link to="/reviews" className="btn-view-all-reviews">
          <MessageSquare size={20} />
          Ver Todas las Reseñas
        </Link>
      </div>
    </section>
  );
};

export default ReviewsSection;
