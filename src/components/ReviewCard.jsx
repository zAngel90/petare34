import { useState } from 'react';
import { Star, ThumbsUp, CheckCircle, User, Calendar, Package } from 'lucide-react';
import { API_CONFIG } from '../config/api';
import './ReviewCard.css';

const ReviewCard = ({ review, onHelpful }) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);

  const handleHelpful = () => {
    if (!hasVoted) {
      onHelpful(review.id);
      setHasVoted(true);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="review-stars">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star}
            size={18}
            fill={star <= rating ? '#ffd700' : 'none'}
            color="#ffd700"
          />
        ))}
      </div>
    );
  };

  return (
    <div className="review-card">
      {/* Header */}
      <div className="review-card-header">
        <div className="reviewer-info">
          <div className="reviewer-avatar">
            {review.userAvatar ? (
              <img src={review.userAvatar} alt={review.userName} />
            ) : (
              <User size={24} />
            )}
          </div>
          <div className="reviewer-details">
            <div className="reviewer-name-row">
              <h4 className="reviewer-name">{review.userName}</h4>
              {review.verified && (
                <span className="verified-badge" title="Compra verificada">
                  <CheckCircle size={16} />
                  Verificado
                </span>
              )}
            </div>
            <div className="review-meta">
              <span className="review-date">
                <Calendar size={14} />
                {formatDate(review.createdAt)}
              </span>
              {review.productType && (
                <span className="review-product-type">
                  <Package size={14} />
                  {review.productType === 'robux' ? 'Robux' : review.productType}
                </span>
              )}
              {review.orderId && (
                <span className="review-order-info" title="Pedido verificado">
                  <Package size={14} />
                  Pedido #{review.orderId}
                </span>
              )}
            </div>
          </div>
        </div>

        {renderStars(review.rating)}
      </div>

      {/* Content */}
      <div className="review-card-content">
        {review.title && (
          <h3 className="review-title">{review.title}</h3>
        )}
        <p className="review-comment">{review.comment}</p>

        {/* Images */}
        {review.images && review.images.length > 0 && (
          <div className="review-images">
            {review.images.slice(0, showAllImages ? review.images.length : 3).map((image, index) => {
              const imageUrl = image.startsWith('http') ? image : `${API_CONFIG.SERVER_URL}${image}`;
              return (
                <div key={index} className="review-image-wrapper">
                  <img 
                    src={imageUrl} 
                    alt={`Review image ${index + 1}`}
                    className="review-image"
                    onClick={() => window.open(imageUrl, '_blank')}
                  />
                </div>
              );
            })}
            {review.images.length > 3 && !showAllImages && (
              <button 
                className="show-more-images"
                onClick={() => setShowAllImages(true)}
              >
                +{review.images.length - 3} más
              </button>
            )}
          </div>
        )}

        {/* Admin Response */}
        {review.adminResponse && (
          <div className="admin-response">
            <div className="admin-response-header">
              <strong>Respuesta del equipo:</strong>
            </div>
            <p>{review.adminResponse}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="review-card-footer">
        <button 
          className={`helpful-btn ${hasVoted ? 'voted' : ''}`}
          onClick={handleHelpful}
          disabled={hasVoted}
        >
          <ThumbsUp size={16} />
          {hasVoted ? 'Gracias por tu voto' : 'Útil'} ({review.helpful || 0})
        </button>

        {review.featured && (
          <span className="featured-badge">
            ⭐ Destacada
          </span>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
