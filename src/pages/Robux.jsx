import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, DollarSign, Zap, CheckCircle, Users, Shield, ShoppingCart, HelpCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import RobloxUserSearch from '../components/RobloxUserSearch';
import GamePassSelector from '../components/GamePassSelector';
import CommunityVerification from '../components/CommunityVerification';
import Checkout from '../components/Checkout';
import NotificationModal from '../components/NotificationModal';
import { API_CONFIG } from '../config/api';
import './Robux.css';

const Robux = () => {
  const [robuxPackages, setRobuxPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(10000);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('gamepass');
  const [selectedCurrency, setSelectedCurrency] = useState('PEN');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGamePass, setSelectedGamePass] = useState(null);
  const [communityVerification, setCommunityVerification] = useState(null);
  const [recentPurchasesOpacity, setRecentPurchasesOpacity] = useState(1);
  const [currencies, setCurrencies] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gamepassHelp, setGamepassHelp] = useState(null);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  
  const summaryRef = useRef(null);
  const recentRef = useRef(null);

  // Fetch Robux packages, currencies, and exchange rates from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch packages
        const packagesResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS.ROBUX}`);
        const packagesData = await packagesResponse.json();
        
        if (packagesData.success) {
          setRobuxPackages(packagesData.data);
          if (packagesData.data.length > 0) {
            setSelectedPackage(packagesData.data[0]);
            setSelectedAmount(packagesData.data[0].amount);
          }
        }

        // Fetch currencies (las tasas están incluidas en las monedas)
        const currenciesResponse = await fetch(`${API_CONFIG.BASE_URL}/currencies`);
        const currenciesData = await currenciesResponse.json();
        console.log('💰 Monedas cargadas:', currenciesData);
        if (currenciesData.success) {
          // Filtrar solo la moneda principal
          const primaryCurrency = currenciesData.data.find(c => c.isPrimary && c.active);
          const activeCurrencies = primaryCurrency ? [primaryCurrency] : currenciesData.data.filter(c => c.active);
          console.log('💰 Moneda principal:', activeCurrencies);
          setCurrencies(activeCurrencies);
          
          // Establecer automáticamente la moneda principal
          if (primaryCurrency) {
            setSelectedCurrency(primaryCurrency.code);
          }
          
          // Crear mapa de tasas desde las monedas
          const ratesMap = {};
          activeCurrencies.forEach(currency => {
            ratesMap[currency.code] = currency.rate;
          });
          console.log('📊 Mapa de tasas:', ratesMap);
          setExchangeRates(ratesMap);
        }

        // Fetch gamepass help configuration
        const settingsResponse = await fetch(`${API_CONFIG.BASE_URL}/settings`);
        const settingsData = await settingsResponse.json();
        console.log('🔍 Settings data:', settingsData);
        console.log('🔍 Gamepass help:', settingsData.data?.gamepassHelp);
        if (settingsData.success && settingsData.data.gamepassHelp && settingsData.data.gamepassHelp.enabled) {
          console.log('✅ Gamepass help enabled, setting state');
          setGamepassHelp(settingsData.data.gamepassHelp);
        } else {
          console.log('❌ Gamepass help not enabled or not found');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingPackages(false);
      }
    };

    fetchData();
  }, []);

  // Fetch órdenes recientes
  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/orders/recent?limit=6`);
        const data = await response.json();
        
        if (data.success) {
          setRecentPurchases(data.data);
        }
      } catch (error) {
        console.error('Error fetching recent orders:', error);
      } finally {
        setLoadingRecent(false);
      }
    };

    fetchRecentOrders();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchRecentOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reset gamepass when method changes
  useEffect(() => {
    if (selectedMethod !== 'gamepass') {
      setSelectedGamePass(null);
    }
  }, [selectedMethod]);

  const handleVerificationChange = (verification) => {
    setCommunityVerification(verification);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (summaryRef.current && recentRef.current) {
        const summaryRect = summaryRef.current.getBoundingClientRect();
        const recentRect = recentRef.current.getBoundingClientRect();
        
        // Check if summary overlaps with recent purchases
        const isOverlapping = !(
          summaryRect.bottom < recentRect.top ||
          summaryRect.top > recentRect.bottom
        );
        
        if (isOverlapping) {
          // Calculate opacity based on overlap
          const overlapAmount = Math.min(
            summaryRect.bottom - recentRect.top,
            recentRect.bottom - summaryRect.top
          );
          const maxOverlap = 200; // pixels
          const opacity = Math.max(0, 1 - (overlapAmount / maxOverlap));
          setRecentPurchasesOpacity(opacity);
        } else {
          setRecentPurchasesOpacity(1);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Los amounts ahora vienen del backend
  const amounts = robuxPackages.map(pkg => pkg.amount);
  
  // Los precios ya están guardados en la moneda correcta (PEN)
  // NO necesitamos convertir, solo retornar el precio tal cual
  const convertPrice = (price) => {
    return price;
  };

  // Función para formatear precio con símbolo y separadores
  const formatPrice = (price) => {
    // Convertir a número si no lo es
    const numPrice = parseFloat(price) || 0;
    
    const currency = currencies.find(c => c.code === selectedCurrency);
    if (!currency) {
      return `$${numPrice.toFixed(2)}`;
    }

    // Formatear con los decimales configurados (siempre 2 decimales)
    const decimals = 2;
    const priceFormatted = numPrice.toLocaleString('es-PE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    
    return `${currency.symbol}${priceFormatted}`;
  };

  const methods = [
    { id: 'gamepass', name: 'Gamepass' },
    { id: 'grupo', name: 'Grupo' }
  ];


  // Calcular precio basado en el paquete seleccionado o monto personalizado
  let discount = 0;
  let basePriceWithDiscount = 0;
  let priceBeforeDiscount = 0;
  let totalPrice = 0;
  let savedAmount = 0;

  if (selectedPackage) {
    // Paquete predefinido
    discount = selectedPackage.discount || 0;
    basePriceWithDiscount = selectedPackage.price;
    
    // Si hay descuento, calcular precio original
    const originalPriceBeforeDiscount = discount > 0 
      ? basePriceWithDiscount / (1 - discount / 100) 
      : basePriceWithDiscount;
    
    priceBeforeDiscount = originalPriceBeforeDiscount;
    totalPrice = basePriceWithDiscount;
    savedAmount = priceBeforeDiscount - totalPrice;
  } else if (customAmount && !isNaN(customAmount) && parseInt(customAmount) > 0) {
    // Monto personalizado - calcular precio según tasa FIJA de Robux
    // Tasa: 1 Robux = 0.03 PEN (3 centavos de sol)
    const ROBUX_RATE_PEN = 0.03;
    
    // Precio = cantidad de Robux * tasa de Robux
    totalPrice = parseInt(customAmount) * ROBUX_RATE_PEN;
    priceBeforeDiscount = totalPrice;
    discount = 0;
    savedAmount = 0;
  }

  return (
    <div className="robux-purchase-page">
      <div className="purchase-container">
        {/* Header */}
        <div className="purchase-header">
          <Link to="/catalogo" className="back-btn">
            <ArrowLeft size={20} />
            Volver
          </Link>
        </div>

        {/* Main Content */}
        <div className="purchase-content">
          {/* Left Side */}
          <div className="purchase-left">
            <div className="purchase-title-section">
              <div className="robux-icon-large">
                <img src="/robux-logo.svg" alt="Robux" />
              </div>
              <div>
                <h1>Comprar Robux</h1>
                <p>Selecciona el monto y método de entrega preferido.</p>
                <div className="quick-features">
                  <span className="feature-badge">
                    <DollarSign size={14} />
                    Mejor precio
                  </span>
                  <span className="feature-badge">
                    <Zap size={14} />
                    Entrega rápida
                  </span>
                  <span className="feature-badge">
                    <CheckCircle size={14} />
                    +50,000 órdenes
                  </span>
                </div>
              </div>
            </div>

            {/* Amount Selection */}
            <div className="section">
              <h3>CANTIDAD</h3>
              {loadingPackages ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                  Cargando paquetes...
                </div>
              ) : robuxPackages.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                  No hay paquetes disponibles
                </div>
              ) : (
                <div className="amounts-grid">
                  {robuxPackages.map((pkg) => (
                    <button
                      key={pkg.id}
                      className={`amount-btn ${selectedPackage?.id === pkg.id ? 'active' : ''} ${pkg.popular ? 'most-sold' : ''}`}
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setSelectedAmount(pkg.amount);
                        setCustomAmount(''); // Limpiar campo personalizado
                      }}
                    >
                      <img src="/robux-logo.svg" alt="R$" className="robux-icon-small" />
                      {pkg.amount.toLocaleString()}
                      {pkg.popular && <span className="badge-sold">Popular</span>}
                      {pkg.discount > 0 && <span className="badge-discount">-{pkg.discount}%</span>}
                    </button>
                  ))}
                  <div className="custom-amount">
                    <img src="/robux-logo.svg" alt="R$" className="robux-icon-small" />
                    <input
                      type="number"
                      placeholder="Ingresa cantidad..."
                      min={selectedMethod === 'gamepass' ? 2500 : 30}
                      value={customAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCustomAmount(value);
                        // Deseleccionar paquete y actualizar selectedAmount si es un número válido
                        if (value && !isNaN(value) && parseInt(value) > 0) {
                          setSelectedPackage(null);
                          setSelectedAmount(parseInt(value));
                        }
                      }}
                      onBlur={() => {
                        // Al perder el foco, asegurar que esté seleccionado
                        if (customAmount && !isNaN(customAmount) && parseInt(customAmount) > 0) {
                          setSelectedPackage(null);
                          setSelectedAmount(parseInt(customAmount));
                        }
                      }}
                      onFocus={() => {
                        // Al hacer focus, deseleccionar cualquier paquete
                        setSelectedPackage(null);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Method Selection */}
            <div className="section">
              <h3>MÉTODO</h3>
              <div className="methods-row">
                {methods.map((method) => (
                  <button
                    key={method.id}
                    className={`method-btn ${selectedMethod === method.id ? 'active' : ''}`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <Users size={20} />
                    {method.name}
                    {method.discount && <span className="discount-badge">{method.discount}</span>}
                  </button>
                ))}
              </div>
              <div className="method-info">
                {selectedMethod === 'gamepass' && (
                  <p className="method-note">
                    💡 Monto mínimo: <strong>2,500 Robux</strong> | Puedes personalizar tu paquete
                  </p>
                )}
                {selectedMethod === 'grupo' && (
                  <p className="method-note">
                    💡 Monto mínimo: <strong>30 Robux</strong> | Puedes personalizar tu paquete
                  </p>
                )}
              </div>
            </div>

            {/* Currency Selection - Oculto si solo hay una moneda */}
            {currencies.length > 1 && (
              <div className="section">
                <h3>MONEDA LOCAL</h3>
                <div className="currencies-row">
                  {currencies.map((currency) => (
                    <button
                      key={currency.code}
                      className={`currency-btn ${selectedCurrency === currency.code ? 'active' : ''}`}
                      onClick={() => setSelectedCurrency(currency.code)}
                    >
                      <span className="flag">{currency.flag}</span>
                      {currency.code}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Roblox User Search */}
            <div className="section">
              <RobloxUserSearch 
                onUserSelect={setSelectedUser}
                selectedUser={selectedUser}
              />
            </div>

            {/* GamePass Selector (solo si método es gamepass) */}
            {selectedMethod === 'gamepass' && (
              <>
                {/* Aviso importante - Desactivar precios regionales */}
                <div className="section">
                  <div className="important-notice-robux">
                    <AlertCircle size={20} />
                    <div className="notice-content-robux">
                      <strong>⚠️ Importante: Desactiva los Precios Regionales</strong>
                      <p>Recuerda desactivar los precios regionales en tu Gamepass antes de publicarlo. El precio debe coincidir exactamente con el que se muestra abajo.</p>
                    </div>
                  </div>
                </div>

                <div className="section">
                  <GamePassSelector 
                    userId={selectedUser?.id}
                    selectedAmount={selectedAmount}
                    onGamePassSelect={setSelectedGamePass}
                    selectedGamePass={selectedGamePass}
                  />
                </div>
              </>
            )}

            {/* Ayuda para crear gamepass */}
            {selectedMethod === 'gamepass' && gamepassHelp && (
              <div className="section">
                <div className="gamepass-help-robux">
                  <button 
                    type="button"
                    className="help-toggle-btn-robux"
                    onClick={() => setShowHelp(!showHelp)}
                  >
                    <HelpCircle size={20} />
                    <span>{gamepassHelp.title || '¿Cómo crear un Gamepass?'}</span>
                    {showHelp ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {showHelp && (
                    <div className="help-content-robux">
                      <p className="help-description-robux">{gamepassHelp.description}</p>
                      
                      {gamepassHelp.videoUrl && (
                        <div className="help-video-robux">
                          <video 
                            src={gamepassHelp.videoUrl} 
                            controls 
                            className="video-player-robux"
                          >
                            Tu navegador no soporta el reproductor de video.
                          </video>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Community Verification (solo si método es grupo) */}
            {selectedMethod === 'grupo' && (
              <div className="section">
                <CommunityVerification 
                  robloxUserId={selectedUser?.id}
                  robloxUsername={selectedUser?.name}
                  onVerificationChange={handleVerificationChange}
                />
              </div>
            )}

          </div>

          {/* Right Sidebar - Summary */}
          <div className="purchase-right">
            <div className="summary-card" ref={summaryRef}>
              <div className="summary-header">
                <Shield size={18} />
                Resumen
              </div>

              <div className="summary-amount">
                <span className="amount-label">{selectedAmount.toLocaleString()}</span>
                <span className="amount-text">Robux</span>
                <button className="edit-btn">
                  <img src="/robux-logo.svg" alt="R$" className="robux-icon-tiny" />
                </button>
              </div>

              <div className="summary-details">
                <div className="detail-row">
                  <span>Método</span>
                  <span>{methods.find(m => m.id === selectedMethod)?.name}</span>
                </div>
                {selectedUser && (
                  <div className="detail-row">
                    <span>Usuario</span>
                    <span className="user-summary">{selectedUser.name}</span>
                  </div>
                )}
                {selectedGamePass && (
                  <div className="detail-row">
                    <span>Game Pass</span>
                    <span className="gamepass-summary">{selectedGamePass.name}</span>
                  </div>
                )}
                {selectedMethod === 'grupo' && communityVerification && (
                  <div className="detail-row">
                    <span>Entrega</span>
                    <span className={`delivery-summary ${communityVerification.deliveryType}`}>
                      {communityVerification.deliveryTime}
                    </span>
                  </div>
                )}
              </div>

              <div className="summary-total">
                {discount > 0 && (
                  <div className="detail-row" style={{marginBottom: '8px', opacity: 0.7}}>
                    <span>Precio base</span>
                    <span style={{textDecoration: 'line-through'}}>{formatPrice(priceBeforeDiscount)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="detail-row" style={{marginBottom: '12px', color: '#00d084'}}>
                    <span>Descuento ({discount}%)</span>
                    <span>-{formatPrice(savedAmount)}</span>
                  </div>
                )}
                <div className="total-row">
                  <span>Total a pagar</span>
                  <div className="total-amount">
                    <span className="total-price">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>

              <button 
                className="buy-btn"
                disabled={
                  !selectedUser || 
                  (selectedMethod === 'gamepass' && !selectedGamePass) ||
                  (selectedMethod === 'grupo' && (!communityVerification || !communityVerification.isRegistered)) ||
                  (selectedMethod === 'gamepass' && selectedAmount < 2500) ||
                  (selectedMethod === 'grupo' && selectedAmount < 30)
                }
                onClick={() => setShowCheckout(true)}
              >
                <ShoppingCart size={20} />
                COMPRAR
              </button>
              
              {selectedMethod === 'grupo' && selectedUser && (!communityVerification || !communityVerification.isRegistered) && (
                <div className="buy-disabled-message">
                  ⚠️ Debes unirte a las 10 comunidades y registrarte para poder comprar
                </div>
              )}
              
              {selectedMethod === 'gamepass' && selectedAmount < 2500 && (
                <div className="buy-disabled-message">
                  ⚠️ El monto mínimo para Gamepass es 2,500 Robux
                </div>
              )}
              
              {selectedMethod === 'grupo' && selectedAmount < 30 && (
                <div className="buy-disabled-message">
                  ⚠️ El monto mínimo para Grupo es 30 Robux
                </div>
              )}

              <div className="rating">
                <span className="stars">⭐⭐⭐⭐⭐</span>
                <span className="rating-text">(4.9)</span>
              </div>
            </div>

            {/* Recent Purchases */}
            <div 
              className="recent-purchases" 
              ref={recentRef}
              style={{ opacity: recentPurchasesOpacity, transition: 'opacity 0.3s ease' }}
            >
              <div className="recent-header">
                <span>COMPRAS RECIENTES</span>
                <span className="live-badge">● EN VIVO</span>
              </div>
              <div className="purchases-list">
                {loadingRecent ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    Cargando compras...
                  </div>
                ) : recentPurchases.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No hay compras recientes
                  </div>
                ) : (
                  recentPurchases.map((purchase, index) => (
                    <div key={index} className="purchase-item">
                      <div className="purchase-user">
                        <div className="user-avatar">
                          {purchase.avatar ? (
                            <img src={purchase.avatar} alt={purchase.user} />
                          ) : (
                            <div className="avatar-placeholder">👤</div>
                          )}
                        </div>
                        <div>
                          <div className="user-name">{purchase.user}</div>
                          <div className="user-time">{purchase.time}</div>
                        </div>
                      </div>
                      <div className="purchase-amount">
                        +{purchase.amount.toLocaleString()}
                        <img src="/robux-logo.svg" alt="R$" className="robux-icon-tiny" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <Checkout
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        orderData={{
          type: 'robux',
          product: selectedPackage,
          amount: selectedAmount,
          price: formatPrice(totalPrice),
          currency: selectedCurrency,
          user: selectedUser,
          gamepass: selectedGamePass,
          // Agregar datos de descuento
          discount: discount,
          priceBeforeDiscount: discount > 0 ? formatPrice(priceBeforeDiscount) : null,
          savedAmount: discount > 0 ? formatPrice(savedAmount) : null
        }}
        onSuccess={(order) => {
          setShowCheckout(false);
          setShowSuccessModal(true);
          console.log('Orden creada:', order);
        }}
      />

      {/* Modal de éxito */}
      <NotificationModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        type="success"
        title="¡Orden Creada!"
        message="Tu orden ha sido creada exitosamente. El administrador procesará tu pago pronto y te notificaremos cuando esté completada."
      />
    </div>
  );
};

export default Robux;
