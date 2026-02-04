import { useState, useEffect } from 'react';
import { Gift, Check, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { giftCards } from '../api/mockData';
import './GiftCards.css';

const GiftCards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const { addItem } = useCart();

  useEffect(() => {
    setTimeout(() => {
      setCards(giftCards);
      setLoading(false);
    }, 300);
  }, []);

  const handleAddToCart = (card) => {
    addItem({
      id: card.id,
      name: card.name,
      price: card.price,
      type: 'giftcard'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando gift cards...</p>
      </div>
    );
  }

  return (
    <div className="giftcards-page">
      <div className="page-header">
        <Gift className="header-icon" size={36} />
        <div>
          <h1>Roblox Gift Cards</h1>
          <p>
            Tarjetas de regalo oficiales de Roblox. Perfectas para regalar
            o para ti mismo con descuentos exclusivos.
          </p>
        </div>
      </div>

      <div className="cards-grid">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`gift-card ${selectedCard === card.id ? 'selected' : ''}`}
            onClick={() => setSelectedCard(card.id)}
          >
            {card.discount > 0 && (
              <div className="discount-badge">-{card.discount}%</div>
            )}

            <div className="card-visual">
              <div className="card-design">
                <div className="card-logo">
                  <svg viewBox="0 0 60 60" fill="none">
                    <rect width="60" height="60" rx="8" fill="url(#gcGradient)" />
                    <path d="M18 18h24v24H18V18z" fill="#fff" opacity="0.9"/>
                    <path d="M24 24h12v12H24V24z" fill="#1a1a2e"/>
                    <defs>
                      <linearGradient id="gcGradient" x1="0" y1="0" x2="60" y2="60">
                        <stop stopColor="#00D4AA"/>
                        <stop offset="1" stopColor="#00A3FF"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="card-value">${card.value}</div>
                <div className="card-brand">ROBLOX</div>
              </div>
            </div>

            <div className="card-info">
              <h3>{card.name}</h3>
              <div className="robux-value">
                <span className="robux-icon">R$</span>
                {card.robuxValue.toLocaleString()} Robux
              </div>
              <div className="card-region">
                <CreditCard size={14} />
                {card.region}
              </div>
            </div>

            <div className="card-pricing">
              {card.originalPrice > card.price && (
                <span className="original-price">${parseFloat(card.originalPrice || 0).toFixed(2)}</span>
              )}
              <span className="current-price">${parseFloat(card.price || 0).toFixed(2)}</span>
            </div>

            <button
              className="add-to-cart-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(card);
              }}
            >
              Agregar al Carrito
            </button>
          </div>
        ))}
      </div>

      <div className="benefits-section">
        <h2>Beneficios de las Gift Cards</h2>
        <div className="benefits-list">
          <div className="benefit-item">
            <Check size={20} />
            <span>Entrega instantanea del codigo por email</span>
          </div>
          <div className="benefit-item">
            <Check size={20} />
            <span>Codigos 100% originales y verificados</span>
          </div>
          <div className="benefit-item">
            <Check size={20} />
            <span>Validos en todas las regiones soportadas</span>
          </div>
          <div className="benefit-item">
            <Check size={20} />
            <span>Soporte 24/7 para cualquier problema</span>
          </div>
          <div className="benefit-item">
            <Check size={20} />
            <span>Perfectas para regalar a amigos y familia</span>
          </div>
          <div className="benefit-item">
            <Check size={20} />
            <span>Sin fecha de expiracion</span>
          </div>
        </div>
      </div>

      <div className="how-to-use">
        <h2>Como usar tu Gift Card</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Compra tu tarjeta</h3>
            <p>Selecciona el valor que deseas y completa el pago</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Recibe el codigo</h3>
            <p>Te enviaremos el codigo al email registrado</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Canjea en Roblox</h3>
            <p>Ve a roblox.com/redeem e ingresa tu codigo</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Disfruta tus Robux</h3>
            <p>Los Robux se agregaran automaticamente a tu cuenta</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftCards;
