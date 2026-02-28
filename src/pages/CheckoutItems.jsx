import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Check, ShoppingCart, CreditCard, CheckCircle, X } from 'lucide-react';
import RobloxUserSearch from '../components/RobloxUserSearch';
import API_CONFIG from '../config/api';
import './CheckoutItems.css';

function CheckoutItems() {
  const navigate = useNavigate();
  const { items: cart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Estados del checkout por pasos
  const [currentStep, setCurrentStep] = useState(1); // 1: Verificar, 2: Pagar, 3: Listo
  const [selectedUser, setSelectedUser] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Cargar métodos de pago
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/payment-methods`);
      const data = await response.json();
      if (data.success) {
        setPaymentMethods(data.data.filter(pm => pm.active));
      }
    } catch (error) {
      console.error('Error cargando métodos de pago:', error);
    }
  };

  // Manejar cambio de archivo y generar preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentProof(file);
      
      // Crear URL de preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Limpiar preview
  const clearPaymentProof = () => {
    setPaymentProof(null);
    setPaymentProofPreview(null);
  };

  // Filtrar solo items de juegos (no robux)
  const itemsInCart = cart.filter(item => item.type === 'game-item');
  const total = itemsInCart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  // Avanzar al siguiente paso
  const handleNextStep = () => {
    if (currentStep === 1 && !selectedUser) {
      alert('Por favor verifica tu usuario de Roblox');
      return;
    }
    if (currentStep === 2 && (!paymentMethod || !paymentProof)) {
      alert('Por favor selecciona un método de pago y sube el comprobante');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  // Confirmar orden final
  const handleConfirmOrder = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('user-token');
      
      // Paso 1: Subir el comprobante de pago primero
      let paymentProofUrl = null;
      if (paymentProof) {
        console.log('📤 Subiendo comprobante...', paymentProof);
        const uploadFormData = new FormData();
        uploadFormData.append('file', paymentProof);
        
        const uploadResponse = await fetch(`${API_CONFIG.BASE_URL}/upload/payment-proof`, {
          method: 'POST',
          body: uploadFormData
        });
        
        const uploadData = await uploadResponse.json();
        console.log('📥 Respuesta upload:', uploadData);
        
        if (!uploadData.success) {
          alert('Error al subir el comprobante de pago: ' + (uploadData.error || 'Error desconocido'));
          setLoading(false);
          return;
        }
        
        // Construir URL completa (quitamos /api del final porque uploads está en la raíz)
        const baseUrlWithoutApi = API_CONFIG.BASE_URL.replace(/\/api$/, '');
        paymentProofUrl = `${baseUrlWithoutApi}${uploadData.data.url}`;
        console.log('✅ URL del comprobante:', paymentProofUrl);
      } else {
        console.log('⚠️ No hay comprobante de pago para subir');
      }
      
      // Paso 2: Crear la orden con la URL del comprobante
      const orderPayload = {
        userId: user?.id || null,
        userEmail: user?.email || 'guest@example.com',
        robloxUsername: selectedUser.name,
        robloxUserId: selectedUser.id,
        productType: 'ingame',
        productDetails: {
          items: itemsInCart
        },
        amount: itemsInCart.length,
        price: total,
        currency: 'PEN',
        paymentMethod: paymentMethod,
        paymentProofUrl: paymentProofUrl
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await response.json();

      if (data.success) {
        clearCart();
        navigate('/orders');
      } else {
        alert('Error al crear el pedido: ' + data.error);
        setCurrentStep(2);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar el pedido');
      setCurrentStep(2);
    } finally {
      setLoading(false);
    }
  };

  if (itemsInCart.length === 0) {
    return (
      <div className="checkout-items-page">
        <div className="empty-cart">
          <h2>No hay items en el carrito</h2>
          <button onClick={() => navigate('/catalogo')}>Ir al Catálogo</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-items-page">
      <div className="checkout-container">
        <h1>Checkout - Game Items</h1>

        <div className="checkout-items-horizontal">
          {/* Columna Izquierda: Steps y Formulario */}
          <div className="checkout-items-left">
            {/* Progress Steps */}
            <div className="checkout-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-icon">
              {currentStep > 1 ? <Check size={24} /> : '1'}
            </div>
            <span className="step-label">Verificar</span>
          </div>
          <div className="step-divider"></div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-icon">
              {currentStep > 2 ? <Check size={24} /> : '2'}
            </div>
            <span className="step-label">Pagar</span>
          </div>
          <div className="step-divider"></div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-icon">3</div>
            <span className="step-label">Listo</span>
          </div>
        </div>

            {/* Step 1: Verificar Usuario */}
            {currentStep === 1 && (
              <div className="step-content">
                <h2 className="step-title">Verificar Usuario de Roblox</h2>
            <p className="step-description">
              Busca y verifica tu cuenta de Roblox para recibir los items
            </p>
            
            <RobloxUserSearch 
              onUserSelect={setSelectedUser}
              selectedUser={selectedUser}
            />

            <div style={{ marginTop: '40px' }}>
              <button 
                className="btn-next"
                onClick={handleNextStep}
                disabled={!selectedUser}
              >
                Continuar <Check size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Método de Pago */}
        {currentStep === 2 && (
          <div className="step-content">
            <h2 className="step-title">Método de Pago</h2>
            <p className="step-description">
              Selecciona tu método de pago y sube el comprobante
            </p>

            <div className="verified-user-info">
              <Check size={16} className="check-icon" />
              <span>Usuario verificado: <strong>{selectedUser.name}</strong></span>
            </div>

            <div className="form-group">
              <label><CreditCard size={18} /> Selecciona Método de Pago *</label>
              <div className="payment-methods-grid">
                {paymentMethods.map(pm => (
                  <button
                    key={pm.id}
                    type="button"
                    className={`payment-method-btn ${paymentMethod === pm.id ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod(pm.id)}
                  >
                    {pm.logo ? (
                      <img src={pm.logo} alt={pm.name} className="payment-logo" />
                    ) : (
                      <div className="payment-icon-placeholder">
                        <CreditCard size={32} />
                      </div>
                    )}
                    <span className="payment-name">{pm.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mostrar información del método de pago seleccionado */}
            {paymentMethod && (
              <div className="payment-info-section">
                {(() => {
                  const selectedMethod = paymentMethods.find(pm => pm.id === paymentMethod);
                  return (
                    <>
                      <h3 className="payment-info-title">Información de Pago</h3>
                      
                      {/* Mostrar QR si existe */}
                      {selectedMethod?.qrImage && (
                        <div className="payment-qr-container">
                          <img 
                            src={selectedMethod.qrImage} 
                            alt="Código QR" 
                            className="payment-qr-image"
                          />
                          <p className="qr-label">Escanea este código QR para pagar</p>
                        </div>
                      )}

                      {/* Mostrar configuración/datos de pago */}
                      {selectedMethod?.config && Object.keys(selectedMethod.config).length > 0 && (
                        <div className="payment-details">
                          {Object.entries(selectedMethod.config).map(([key, value]) => (
                            <div key={key} className="payment-detail-item">
                              <span className="detail-key">{key}:</span>
                              <span className="detail-value">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            <div className="form-group">
              <label>Comprobante de Pago *</label>
              
              {!paymentProofPreview ? (
                <div className="file-upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    id="payment-proof"
                    required
                  />
                  <label htmlFor="payment-proof" className="file-upload-label">
                    <CreditCard size={20} />
                    <span>Subir comprobante de pago</span>
                  </label>
                </div>
              ) : (
                <div className="payment-proof-preview">
                  <div className="preview-header">
                    <span className="preview-title">
                      <Check size={18} />
                      Comprobante subido
                    </span>
                    <button 
                      type="button"
                      className="remove-proof-btn"
                      onClick={clearPaymentProof}
                    >
                      <X size={18} />
                      Cambiar
                    </button>
                  </div>
                  <div className="preview-image-container">
                    <img 
                      src={paymentProofPreview} 
                      alt="Comprobante de pago" 
                      className="preview-image"
                    />
                  </div>
                  <p className="preview-filename">{paymentProof.name}</p>
                </div>
              )}
            </div>

            <div className="step-actions">
              <button 
                className="btn-back"
                onClick={() => setCurrentStep(1)}
              >
                Volver
              </button>
              <button 
                className="btn-next"
                onClick={handleNextStep}
                disabled={!paymentMethod || !paymentProof}
              >
                Continuar <Check size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmación */}
        {currentStep === 3 && (
          <div className="step-content">
            <div className="confirmation-icon">
              <CheckCircle size={64} />
            </div>
            <h2 className="step-title">Confirmar Pedido</h2>
            <p className="step-description">
              Revisa los detalles de tu pedido antes de confirmar
            </p>

            <div className="confirmation-details">
              <div className="detail-item">
                <span className="detail-label">Usuario de Roblox:</span>
                <span className="detail-value">{selectedUser.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Método de Pago:</span>
                <span className="detail-value">
                  {paymentMethods.find(pm => pm.id === paymentMethod)?.name}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Comprobante:</span>
                <span className="detail-value">{paymentProof?.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total a Pagar:</span>
                <span className="detail-value total">S/ {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="step-actions">
              <button 
                className="btn-back"
                onClick={() => setCurrentStep(2)}
                disabled={loading}
              >
                Volver
              </button>
              <button 
                className="btn-confirm"
                onClick={handleConfirmOrder}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </div>
        )}
          </div>

          {/* Columna Derecha: Resumen */}
          <div className="checkout-items-right">
            {/* Resumen del pedido - siempre visible */}
            <div className="order-summary">
              <h2><ShoppingCart size={20} /> Resumen del Pedido</h2>
              <div className="order-items-list">
                {itemsInCart.map((item, idx) => (
                  <div key={idx} className="order-item">
                    {item.image && <img src={item.image} alt={item.name} className="item-image" />}
                    <div className="item-info">
                      <div className="item-name">{item.name}</div>
                      <div className="item-quantity">Cantidad: {item.quantity}</div>
                    </div>
                    <div className="item-price">S/ {(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div className="order-total">
                <strong>Total:</strong>
                <strong>S/ {total.toFixed(2)}</strong>
              </div>
            </div>

            {/* Simulación animada del checkout */}
            <div className="checkout-simulation">
              <h3 className="simulation-title">¿Cómo comprar?</h3>
              <div className="simulation-screen">
                {/* Mini interfaz simulada */}
                <div className="sim-step sim-verify">
                  <div className="sim-label">1. Usuario</div>
                  <div className="sim-input"></div>
                </div>
                <div className="sim-step sim-payment">
                  <div className="sim-label">2. Método</div>
                  <div className="sim-button"></div>
                </div>
                <div className="sim-step sim-upload">
                  <div className="sim-label">3. Comprobante</div>
                  <div className="sim-upload-box"></div>
                </div>
                <div className="sim-step sim-confirm">
                  <div className="sim-confirm-btn">Confirmar</div>
                </div>
                
                {/* Cursor animado */}
                <div className="animated-cursor">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="#FFD700" stroke="#000" strokeWidth="1"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutItems;
