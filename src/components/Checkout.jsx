import { useState, useEffect } from 'react';
import { X, Upload, Check, AlertCircle, Loader2, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

const Checkout = ({ 
  isOpen, 
  onClose, 
  orderData, // { type: 'robux' | 'ingame', product, amount, price, currency, user, gamepass }
  onSuccess 
}) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gamepassHelp, setGamepassHelp] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Verificar autenticación
      if (!user) {
        setError('Debes iniciar sesión para realizar una compra');
        setTimeout(() => {
          onClose();
          navigate('/login');
        }, 2000);
        return;
      }
      fetchPaymentMethods();
      if (orderData.type === 'robux') {
        fetchGamepassHelp();
      }
    }
  }, [isOpen, user, orderData.type]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/payment-methods`);
      const data = await response.json();
      
      if (data.success) {
        setPaymentMethods(data.data);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const fetchGamepassHelp = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/settings`);
      const data = await response.json();
      
      if (data.success && data.data.gamepassHelp && data.data.gamepassHelp.enabled) {
        setGamepassHelp(data.data.gamepassHelp);
      }
    } catch (error) {
      console.error('Error fetching gamepass help:', error);
    }
  };

  const handleProofChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no debe superar los 5MB');
      return;
    }

    setProofFile(file);
    setError('');
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadProof = async () => {
    if (!proofFile) return null;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', proofFile);

      const response = await fetch(`${API_CONFIG.BASE_URL}/upload/product-image`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        return `${API_CONFIG.SERVER_URL}${data.data.url}`;
      } else {
        throw new Error('Error al subir comprobante');
      }
    } catch (error) {
      console.error('Error uploading proof:', error);
      setError('Error al subir el comprobante');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedMethod) {
      setError('Selecciona un método de pago');
      return;
    }

    if (!proofFile) {
      setError('Debes subir el comprobante de pago');
      return;
    }

    if (!user || !user.email) {
      setError('Usuario no autenticado correctamente');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Subir comprobante
      const proofUrl = await uploadProof();
      if (!proofUrl) {
        setSubmitting(false);
        return;
      }

      console.log('Usuario actual:', user);

      // Crear orden con los campos que espera el backend
      // Si tiene gamepassId, es gamepass; si no, es robux o ingame
      const productType = orderData.gamepass?.id ? 'gamepass' : orderData.type;
      
      const orderPayload = {
        userId: user.id,
        userEmail: user.email,
        robloxUsername: orderData.user?.name,
        robloxUserId: orderData.user?.id || null,
        productType: productType, // 'gamepass', 'robux' o 'ingame'
        productDetails: {
          productId: orderData.product?.id,
          productName: orderData.product?.name,
          gamepassId: orderData.gamepass?.id,
          gamepassPlaceId: orderData.gamepass?.placeId,
          gamepassRequiredPrice: orderData.gamepass?.requiredPrice, // Precio del gamepass con comisión
          deliveryMethod: orderData.deliveryMethod || (orderData.gamepass?.id ? 'gamepass' : 'directo'), // Guardar método de entrega
          amount: orderData.amount
        },
        amount: orderData.amount,
        price: parseFloat(orderData.price.toString().replace(/[^0-9.]/g, '')), // Limpiar formato
        currency: orderData.currency,
        paymentMethod: selectedMethod.id,
        paymentProofUrl: proofUrl
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await response.json();

      if (data.success) {
        onSuccess && onSuccess(data.data);
        onClose();
      } else {
        setError(data.message || 'Error al crear la orden');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Error al procesar la orden');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="checkout-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-header">
          <h2>Finalizar Compra</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="checkout-body">
          {/* Resumen de la orden */}
          <div className="order-summary">
            <h3>Resumen de tu orden</h3>
            <div className="summary-item">
              <span>Tipo:</span>
              <strong>{orderData.type === 'robux' ? 'Robux' : 'Producto In-Game'}</strong>
            </div>
            {orderData.type === 'robux' && (
              <>
                <div className="summary-item">
                  <span>Cantidad:</span>
                  <strong>{orderData.amount} Robux</strong>
                </div>
                {orderData.gamepass && (
                  <div className="summary-item">
                    <span>Precio del Gamepass:</span>
                    <strong>{orderData.gamepass.price} Robux</strong>
                  </div>
                )}
              </>
            )}
            {orderData.type === 'ingame' && orderData.product && (
              <div className="summary-item">
                <span>Producto:</span>
                <strong>{orderData.product.name}</strong>
              </div>
            )}
            <div className="summary-item">
              <span>Usuario Roblox:</span>
              <strong>{orderData.user?.name || 'N/A'}</strong>
            </div>
            
            {/* Mostrar descuento si aplica */}
            {orderData.discount && orderData.discount > 0 && (
              <>
                <div className="summary-item" style={{opacity: 0.7}}>
                  <span>Precio base:</span>
                  <span style={{textDecoration: 'line-through'}}>
                    {orderData.priceBeforeDiscount} {orderData.currency}
                  </span>
                </div>
                <div className="summary-item" style={{color: '#00d084'}}>
                  <span>Descuento ({orderData.discount}%):</span>
                  <strong>-{orderData.savedAmount} {orderData.currency}</strong>
                </div>
              </>
            )}
            
            <div className="summary-item highlight">
              <span>Total a pagar:</span>
              <strong className="total-price">{orderData.price} {orderData.currency}</strong>
            </div>
          </div>

          {/* Aviso importante para Robux */}
          {orderData.type === 'robux' && (
            <div className="important-notice">
              <AlertCircle size={20} />
              <div className="notice-content">
                <strong>⚠️ Importante: Desactiva los Precios Regionales</strong>
                <p>Recuerda desactivar los precios regionales en tu Gamepass antes de realizar la compra. El precio debe ser exactamente <strong>{orderData.gamepass?.price || 'el indicado'} Robux</strong>.</p>
              </div>
            </div>
          )}

          {/* Ayuda para crear gamepass */}
          {orderData.type === 'robux' && gamepassHelp && (
            <div className="gamepass-help-section">
              <button 
                type="button"
                className="help-toggle-btn"
                onClick={() => setShowHelp(!showHelp)}
              >
                <HelpCircle size={20} />
                <span>{gamepassHelp.title || '¿Cómo crear un Gamepass?'}</span>
                {showHelp ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {showHelp && (
                <div className="help-content">
                  <p className="help-description">{gamepassHelp.description}</p>
                  
                  {gamepassHelp.videoUrl && (
                    <div className="help-video">
                      <video 
                        src={gamepassHelp.videoUrl} 
                        controls 
                        className="video-player"
                      >
                        Tu navegador no soporta el reproductor de video.
                      </video>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="checkout-form">
            {/* Métodos de pago */}
            <div className="form-section">
              <h3>Método de Pago</h3>
              <div className="payment-methods-grid">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`payment-method-card ${selectedMethod?.id === method.id ? 'selected' : ''}`}
                    onClick={() => setSelectedMethod(method)}
                  >
                    {method.logo && (
                      <img src={method.logo} alt={method.name} className="method-logo" />
                    )}
                    {!method.logo && method.icon && (
                      <span className="method-icon">{method.icon}</span>
                    )}
                    <span className="method-name">{method.name}</span>
                    {selectedMethod?.id === method.id && (
                      <Check className="check-icon" size={20} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Info bancaria del método seleccionado */}
            {selectedMethod && selectedMethod.config && Object.keys(selectedMethod.config).length > 0 && (
              <div className="form-section bank-info">
                <h3>Información de Pago</h3>
                <div className="bank-details">
                  {Object.entries(selectedMethod.config).map(([key, value]) => (
                    <div key={key} className="detail-item">
                      <span>{key}:</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Código QR si está disponible */}
            {selectedMethod && selectedMethod.qrImage && (
              <div className="form-section qr-section">
                <h3>Código QR de Pago</h3>
                <div className="qr-container">
                  <img 
                    src={selectedMethod.qrImage} 
                    alt="Código QR de pago" 
                    className="qr-image"
                  />
                  <p className="qr-instruction">
                    Escanea este código QR con tu aplicación de pago para realizar la transferencia
                  </p>
                </div>
              </div>
            )}

            {/* Upload comprobante */}
            <div className="form-section">
              <h3>Comprobante de Pago</h3>
              <div className="upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProofChange}
                  id="proof-upload"
                  className="file-input-hidden"
                />
                <label htmlFor="proof-upload" className="upload-label">
                  <Upload size={32} />
                  <span>Click para subir comprobante</span>
                  <small>Imagen (max 5MB)</small>
                </label>
                {proofPreview && (
                  <div className="proof-preview">
                    <img src={proofPreview} alt="Comprobante" />
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <div className="checkout-actions">
              <button type="button" onClick={onClose} className="btn-cancel" disabled={submitting || uploading}>
                Cancelar
              </button>
              <button type="submit" className="btn-submit" disabled={submitting || uploading}>
                {submitting || uploading ? (
                  <>
                    <Loader2 size={20} className="spinning" />
                    {uploading ? 'Subiendo...' : 'Procesando...'}
                  </>
                ) : (
                  'Confirmar Compra'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
