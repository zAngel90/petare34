import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Shield,
  ArrowRight,
  Tag
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import FileUpload from '../components/FileUpload';
import { API_CONFIG } from '../config/api';
import './Cart.css';

const Cart = () => {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('paypal');
  const [paymentProofUrl, setPaymentProofUrl] = useState(null);
  const [processingOrder, setProcessingOrder] = useState(false);

  const paymentMethods = [
    { id: 'paypal', name: 'PayPal', icon: '💳' },
    { id: 'card', name: 'Tarjeta de Credito', icon: '💳' },
    { id: 'crypto', name: 'Criptomonedas', icon: '₿' },
    { id: 'nequi', name: 'Nequi', icon: '📱' }
  ];

  const discount = couponApplied ? totalPrice * 0.1 : 0;
  const finalTotal = totalPrice - discount;

  const handleApplyCoupon = () => {
    if (couponCode.toLowerCase() === 'roblox10') {
      setCouponApplied(true);
    }
  };

  const handleCheckout = async () => {
    if (!paymentProofUrl) {
      alert('⚠️ Debes subir el comprobante de pago antes de continuar');
      return;
    }

    setProcessingOrder(true);

    try {
      // Crear orden para cada item del carrito
      for (const item of items) {
        const orderData = {
          userEmail: user?.email || 'guest@example.com',
          robloxUsername: user?.robloxUsername || 'Guest',
          robloxUserId: user?.robloxUserId || null,
          productType: item.type || 'robux',
          productDetails: {
            name: item.name,
            description: item.description,
            ...item.details
          },
          amount: item.quantity || item.amount,
          price: item.price * (item.quantity || 1),
          currency: 'USD',
          paymentMethod: selectedPayment,
          paymentProofUrl: paymentProofUrl
        };

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS.BASE}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData)
        });

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Error al crear la orden');
        }
      }

      // Limpiar carrito
      clearCart();
      
      // Mostrar mensaje de éxito
      alert('✅ Orden creada exitosamente. Recibirás una notificación cuando sea verificada.');
      
      // Redirigir
      navigate('/');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('❌ Error al crear la orden: ' + error.message);
    } finally {
      setProcessingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <ShoppingCart size={80} strokeWidth={1} />
          <h2>Tu carrito esta vacio</h2>
          <p>Agrega productos para comenzar tu compra</p>
          <Link to="/" className="continue-shopping">
            Explorar Productos
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="page-header">
        <h1>
          <ShoppingCart size={28} />
          Carrito de Compras
        </h1>
        <button className="clear-cart-btn" onClick={clearCart}>
          <Trash2 size={16} />
          Vaciar Carrito
        </button>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="item-image">
                <div className="item-placeholder">
                  {item.type === 'robux' && 'R$'}
                  {item.type === 'gamepass' && 'GP'}
                  {item.type === 'limited' && 'LTD'}
                  {item.type === 'giftcard' && 'GC'}
                  {item.type === 'premium' && 'P'}
                  {item.type === 'account' && 'ACC'}
                </div>
              </div>

              <div className="item-details">
                <h3>{item.name}</h3>
                <span className="item-type">{item.type}</span>
              </div>

              <div className="item-quantity">
                <button
                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  disabled={item.quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                  <Plus size={16} />
                </button>
              </div>

              <div className="item-price">
                ${(item.price * item.quantity).toFixed(2)}
              </div>

              <button
                className="remove-item-btn"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2>Resumen del Pedido</h2>

          <div className="coupon-section">
            <div className="coupon-input">
              <Tag size={18} />
              <input
                type="text"
                placeholder="Codigo de descuento"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={couponApplied}
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponApplied || !couponCode}
              >
                {couponApplied ? 'Aplicado' : 'Aplicar'}
              </button>
            </div>
            {couponApplied && (
              <span className="coupon-success">Cupon ROBLOX10 aplicado: -10%</span>
            )}
            <span className="coupon-hint">Prueba: ROBLOX10</span>
          </div>

          <div className="summary-details">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            {couponApplied && (
              <div className="summary-row discount">
                <span>Descuento (10%)</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="payment-methods">
            <h3>Metodo de Pago</h3>
            <div className="payment-options">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  className={`payment-option ${selectedPayment === method.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPayment(method.id)}
                >
                  <span className="payment-icon">{method.icon}</span>
                  <span>{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="payment-proof-section">
            <h3>Comprobante de Pago</h3>
            <p className="proof-hint">Sube el comprobante de tu pago para verificar la orden</p>
            <FileUpload
              onUploadComplete={(url) => setPaymentProofUrl(url)}
              type="payment-proof"
              label="Subir comprobante de pago"
              maxSize={5}
            />
          </div>

          {isAuthenticated ? (
            <button 
              className="checkout-btn" 
              onClick={handleCheckout}
              disabled={!paymentProofUrl || processingOrder}
            >
              <CreditCard size={20} />
              {processingOrder ? 'Procesando...' : 'Confirmar Orden'}
            </button>
          ) : (
            <div className="login-prompt">
              <p>Debes iniciar sesion para completar tu compra</p>
              <Link to="/login" className="login-link">
                Iniciar Sesion
                <ArrowRight size={18} />
              </Link>
            </div>
          )}

          <div className="security-badge">
            <Shield size={16} />
            <span>Pago seguro y encriptado</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
