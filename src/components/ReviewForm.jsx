import { useState } from 'react';
import { Star, Upload, X, Send, AlertCircle } from 'lucide-react';
import { API_CONFIG } from '../config/api';
import './ReviewForm.css';

const ReviewForm = ({ user, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    comment: '',
    images: []
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRatingClick = (rating) => {
    setFormData({ ...formData, rating });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Validar que no exceda 3 imágenes
    if (formData.images.length + files.length > 3) {
      setError('Máximo 3 imágenes permitidas');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formDataUpload = new FormData();
      files.forEach(file => {
        formDataUpload.append('images', file);
      });

      const response = await fetch(`${API_CONFIG.BASE_URL}/upload/review-images`, {
        method: 'POST',
        body: formDataUpload
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          ...formData,
          images: [...formData.images, ...data.data.images]
        });
      } else {
        setError(data.error || 'Error al subir imágenes');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      setError('Error al subir imágenes');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (formData.rating === 0) {
      setError('Por favor selecciona una calificación');
      return;
    }

    if (formData.comment.trim().length < 10) {
      setError('El comentario debe tener al menos 10 caracteres');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const reviewData = {
        userId: user.id,
        userName: user.username || user.email,
        userAvatar: user.avatar || null,
        rating: formData.rating,
        title: formData.title,
        comment: formData.comment,
        images: formData.images,
        productType: 'general'
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Error al crear reseña');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Error al enviar reseña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <div className="review-form-header">
        <h2>Dejar una Reseña</h2>
        <button type="button" className="close-btn" onClick={onCancel}>
          <X size={24} />
        </button>
      </div>

      {error && (
        <div className="review-form-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Rating */}
      <div className="form-group">
        <label className="form-label required">Calificación</label>
        <div className="rating-selector">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              className="star-btn"
              onClick={() => handleRatingClick(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              <Star 
                size={32}
                fill={(hoverRating || formData.rating) >= star ? '#ffd700' : 'none'}
                color="#ffd700"
              />
            </button>
          ))}
        </div>
        <p className="rating-text">
          {formData.rating === 0 && 'Selecciona una calificación'}
          {formData.rating === 1 && '⭐ Muy malo'}
          {formData.rating === 2 && '⭐⭐ Malo'}
          {formData.rating === 3 && '⭐⭐⭐ Regular'}
          {formData.rating === 4 && '⭐⭐⭐⭐ Bueno'}
          {formData.rating === 5 && '⭐⭐⭐⭐⭐ Excelente'}
        </p>
      </div>

      {/* Title */}
      <div className="form-group">
        <label className="form-label">Título (opcional)</label>
        <input 
          type="text"
          className="form-input"
          placeholder="Resume tu experiencia"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          maxLength={100}
        />
      </div>

      {/* Comment */}
      <div className="form-group">
        <label className="form-label required">Comentario</label>
        <textarea 
          className="form-textarea"
          placeholder="Cuéntanos sobre tu experiencia..."
          value={formData.comment}
          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          rows={5}
          minLength={10}
          maxLength={1000}
          required
        />
        <div className="char-count">
          {formData.comment.length} / 1000 caracteres
        </div>
      </div>

      {/* Images Upload */}
      <div className="form-group">
        <label className="form-label">
          Imágenes (opcional)
          <span className="label-hint">Máximo 3 imágenes</span>
        </label>
        
        <div className="images-upload-area">
          {formData.images.length < 3 && (
            <label className="upload-box">
              <input 
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <Upload size={24} />
              <span>{uploading ? 'Subiendo...' : 'Subir Imágenes'}</span>
              <small>JPG, PNG, WEBP (Max 5MB c/u)</small>
            </label>
          )}

          {formData.images.map((image, index) => (
            <div key={index} className="image-preview">
              <img src={image} alt={`Preview ${index + 1}`} />
              <button 
                type="button"
                className="remove-image-btn"
                onClick={() => removeImage(index)}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notice */}
      <div className="review-form-notice">
        <AlertCircle size={18} />
        <p>Tu reseña será revisada por nuestro equipo antes de ser publicada.</p>
      </div>

      {/* Actions */}
      <div className="review-form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>
          Cancelar
        </button>
        <button 
          type="submit" 
          className="btn-submit" 
          disabled={submitting || uploading}
        >
          <Send size={18} />
          {submitting ? 'Enviando...' : 'Enviar Reseña'}
        </button>
      </div>
    </form>
  );
};

export default ReviewForm;
