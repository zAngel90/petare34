import { useState, useEffect } from 'react';
import { User, Star, Shield, AlertTriangle, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { accountServices } from '../api/mockData';
import './Accounts.css';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    setTimeout(() => {
      setAccounts(accountServices);
      setLoading(false);
    }, 300);
  }, []);

  const handleBuy = (account) => {
    addItem({
      id: account.id,
      name: account.name,
      price: account.price,
      type: 'account'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando cuentas...</p>
      </div>
    );
  }

  return (
    <div className="accounts-page">
      <div className="page-header">
        <User className="header-icon" size={36} />
        <div>
          <h1>Cuentas de Roblox</h1>
          <p>
            Cuentas verificadas con Robux, progreso en juegos y items exclusivos.
            Todas las cuentas incluyen cambio de email garantizado.
          </p>
        </div>
      </div>

      <div className="warning-banner">
        <AlertTriangle size={20} />
        <div>
          <strong>Importante:</strong>
          <span>
            Todas las cuentas son verificadas y el cambio de email esta garantizado.
            Nunca compartimos la informacion con terceros.
          </span>
        </div>
      </div>

      <div className="accounts-grid">
        {accounts.map((account) => (
          <div key={account.id} className="account-card">
            <div className="account-header">
              <div className="account-avatar">
                <User size={32} />
              </div>
              <div className="account-meta">
                <div className="rating">
                  <Star size={14} fill="#ffd700" stroke="#ffd700" />
                  <span>{account.rating}</span>
                </div>
                <span className="stock">Stock: {account.stock}</span>
              </div>
            </div>

            <h3 className="account-name">{account.name}</h3>

            {account.game && (
              <div className="account-game">
                <span>Juego:</span> {account.game}
              </div>
            )}

            {account.robux && (
              <div className="account-robux">
                <span className="robux-amount">{account.robux.toLocaleString()}</span>
                <span className="robux-label">Robux incluidos</span>
              </div>
            )}

            <ul className="account-features">
              {account.features.map((feature, index) => (
                <li key={index}>
                  <Check size={16} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="account-footer">
              <div className="account-price">
                <span className="price">${account.price.toFixed(2)}</span>
              </div>
              <button
                className="buy-btn"
                onClick={() => handleBuy(account)}
                disabled={account.stock === 0}
              >
                {account.stock > 0 ? 'Comprar' : 'Agotado'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="guarantee-section">
        <h2>Nuestras Garantias</h2>
        <div className="guarantees-grid">
          <div className="guarantee-card">
            <Shield size={32} />
            <h3>Cambio de Email</h3>
            <p>
              Garantizamos el cambio completo de email para que tengas
              control total de la cuenta.
            </p>
          </div>
          <div className="guarantee-card">
            <Check size={32} />
            <h3>Cuentas Verificadas</h3>
            <p>
              Todas las cuentas son verificadas manualmente antes de
              ser listadas en nuestra plataforma.
            </p>
          </div>
          <div className="guarantee-card">
            <Star size={32} />
            <h3>Soporte Post-Venta</h3>
            <p>
              Te ayudamos con cualquier problema hasta 7 dias despues
              de tu compra.
            </p>
          </div>
        </div>
      </div>

      <div className="process-section">
        <h2>Proceso de Compra</h2>
        <div className="process-steps">
          <div className="process-step">
            <div className="step-number">1</div>
            <h4>Selecciona tu cuenta</h4>
            <p>Elige la cuenta que mejor se adapte a tus necesidades</p>
          </div>
          <div className="process-step">
            <div className="step-number">2</div>
            <h4>Realiza el pago</h4>
            <p>Paga de forma segura con tu metodo preferido</p>
          </div>
          <div className="process-step">
            <div className="step-number">3</div>
            <h4>Recibe las credenciales</h4>
            <p>Te enviamos los datos de acceso a tu email</p>
          </div>
          <div className="process-step">
            <div className="step-number">4</div>
            <h4>Cambia el email</h4>
            <p>Asegura tu cuenta cambiando el email asociado</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accounts;
