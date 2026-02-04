import { Link } from 'react-router-dom';
import {
  Facebook,
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
              <a href="https://www.facebook.com/profile.php?id=61584730418441" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://www.instagram.com/rlsrobuxstore/" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="https://www.tiktok.com/@rlsrobuxstore" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="TikTok">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a href="https://wa.me/message/VZYKMCR3JCGCP1" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="WhatsApp">
                <MessageCircle size={20} />
              </a>
              <a href="https://discord.gg/euDsmE3dCJ" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Discord">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
              <a href="https://www.youtube.com/@rlsrobuxstore" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="YouTube">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Productos</h4>
              <Link to="/robux">Robux</Link>
              <Link to="/catalogo">Catálogo Completo</Link>
              <Link to="/reviews">Reseñas</Link>
            </div>

            <div className="footer-column">
              <h4>Soporte</h4>
              <Link to="/about">Sobre Nosotros</Link>
              <Link to="/faq">Preguntas Frecuentes</Link>
              <Link to="/contact">Contacto</Link>
              <Link to="/help">Centro de Ayuda</Link>
              <Link to="/status">Estado del Servicio</Link>
            </div>

            <div className="footer-column">
              <h4>Legal</h4>
              <Link to="/terms">Términos de Servicio</Link>
              <Link to="/privacy">Política de Privacidad</Link>
              <Link to="/refund">Política de Reembolso</Link>
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
