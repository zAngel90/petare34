import { Link } from 'react-router-dom';
import {
  Twitter,
  Instagram,
  Youtube,
  MessageCircle,
  Mail,
  Shield,
  Clock,
  CreditCard
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img
                src="https://i.postimg.cc/5xqCPXwc/RLS-LOGO.png"
                alt="RLS Store"
                className="footer-logo-img"
              />
            </Link>
            <p className="footer-desc">
              La plataforma #1 para comprar Robux, Game Passes, Limiteds y mas.
              Precios competitivos y entrega instantanea.
            </p>
            <div className="footer-social">
              <a href="#" className="social-link" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" className="social-link" aria-label="Youtube">
                <Youtube size={20} />
              </a>
              <a href="#" className="social-link" aria-label="Discord">
                <MessageCircle size={20} />
              </a>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Productos</h4>
              <Link to="/catalogo?categoria=robux">Robux</Link>
              <Link to="/catalogo?categoria=gamepasses">Game Passes</Link>
              <Link to="/catalogo?categoria=limiteds">Limiteds</Link>
              <Link to="/catalogo?categoria=giftcards">Gift Cards</Link>
              <Link to="/catalogo?categoria=premium">Premium</Link>
            </div>

            <div className="footer-column">
              <h4>Soporte</h4>
              <Link to="/faq">Preguntas Frecuentes</Link>
              <Link to="/contact">Contacto</Link>
              <Link to="/help">Centro de Ayuda</Link>
              <Link to="/status">Estado del Servicio</Link>
            </div>

            <div className="footer-column">
              <h4>Legal</h4>
              <Link to="/terms">Terminos de Servicio</Link>
              <Link to="/privacy">Politica de Privacidad</Link>
              <Link to="/refund">Politica de Reembolso</Link>
              <Link to="/cookies">Cookies</Link>
            </div>
          </div>
        </div>

        <div className="footer-features">
          <div className="feature-item">
            <Shield className="feature-icon" size={24} />
            <div>
              <h5>Pago Seguro</h5>
              <p>Transacciones 100% protegidas</p>
            </div>
          </div>
          <div className="feature-item">
            <Clock className="feature-icon" size={24} />
            <div>
              <h5>Entrega Instantanea</h5>
              <p>Recibe tu producto al instante</p>
            </div>
          </div>
          <div className="feature-item">
            <CreditCard className="feature-icon" size={24} />
            <div>
              <h5>Multiples Metodos</h5>
              <p>PayPal, Tarjetas, Crypto y mas</p>
            </div>
          </div>
          <div className="feature-item">
            <Mail className="feature-icon" size={24} />
            <div>
              <h5>Soporte 24/7</h5>
              <p>Estamos para ayudarte</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 RLS Store. Todos los derechos reservados.</p>
          <p className="disclaimer">
            RLS Store no esta afiliado con Roblox Corporation.
            Roblox y el logo de Roblox son marcas registradas de Roblox Corporation.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
