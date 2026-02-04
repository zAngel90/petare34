import { useState, useEffect } from 'react';
import { Star, Check, Zap, Crown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { premiumSubscriptions } from '../api/mockData';
import './Premium.css';

const Premium = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    setTimeout(() => {
      setPlans(premiumSubscriptions);
      setLoading(false);
    }, 300);
  }, []);

  const handleSubscribe = (plan) => {
    addItem({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      type: 'premium'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando planes Premium...</p>
      </div>
    );
  }

  return (
    <div className="premium-page">
      <div className="page-header">
        <div className="premium-icon">
          <Crown size={40} />
        </div>
        <h1>Roblox Premium</h1>
        <p>
          Suscribete a Premium y recibe Robux mensuales, descuentos exclusivos
          y la habilidad de comerciar items.
        </p>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${plan.popular ? 'popular' : ''}`}
          >
            {plan.popular && (
              <div className="popular-badge">
                <Star size={14} fill="#fff" />
                Mas Popular
              </div>
            )}

            {plan.discount > 0 && (
              <div className="discount-badge">-{plan.discount}%</div>
            )}

            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="robux-monthly">
                <Zap size={20} />
                <span>{plan.monthlyRobux.toLocaleString()} R$/mes</span>
              </div>
            </div>

            <div className="plan-pricing">
              {plan.originalPrice > plan.price && (
                <span className="original-price">${plan.originalPrice.toFixed(2)}/mes</span>
              )}
              <div className="current-price">
                <span className="price">${plan.price.toFixed(2)}</span>
                <span className="period">/mes</span>
              </div>
            </div>

            <ul className="plan-benefits">
              {plan.benefits.map((benefit, index) => (
                <li key={index}>
                  <Check size={16} />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <button
              className={`subscribe-btn ${plan.popular ? 'primary' : ''}`}
              onClick={() => handleSubscribe(plan)}
            >
              Suscribirse
            </button>
          </div>
        ))}
      </div>

      <div className="premium-benefits">
        <h2>Beneficios de Premium</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">
              <Zap size={28} />
            </div>
            <h3>Robux Mensuales</h3>
            <p>Recibe una cantidad de Robux cada mes automaticamente en tu cuenta</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">
              <Star size={28} />
            </div>
            <h3>10% Bonus en Compras</h3>
            <p>Obtén 10% mas Robux en cada compra que realices</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">
              <Crown size={28} />
            </div>
            <h3>Items Exclusivos</h3>
            <p>Accede a items y avatares exclusivos solo para miembros Premium</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon trade-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4"/>
              </svg>
            </div>
            <h3>Trading de Items</h3>
            <p>Intercambia items limitados con otros jugadores</p>
          </div>
        </div>
      </div>

      <div className="faq-section">
        <h2>Preguntas sobre Premium</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>¿Como funciona la suscripcion?</h4>
            <p>
              Despues de comprar, activaremos Premium en tu cuenta de Roblox.
              Recibiras los Robux inmediatamente y cada mes siguiente.
            </p>
          </div>
          <div className="faq-item">
            <h4>¿Puedo cancelar cuando quiera?</h4>
            <p>
              Si, puedes cancelar tu suscripcion en cualquier momento.
              Mantendras los beneficios hasta el final del periodo pagado.
            </p>
          </div>
          <div className="faq-item">
            <h4>¿El bonus aplica a todas las compras?</h4>
            <p>
              El 10% de bonus aplica a compras de Robux realizadas con
              dinero real, no a compras dentro de juegos.
            </p>
          </div>
          <div className="faq-item">
            <h4>¿Que necesito para el trading?</h4>
            <p>
              Necesitas Premium activo, verificacion de email y tener
              tu cuenta con mas de 30 dias de antiguedad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Premium;
