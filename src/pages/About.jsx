import { MessageCircle } from 'lucide-react';
import './InfoPage.css';

const About = () => {
  return (
    <div className="info-page">
      <div className="info-container">
        <h1>Sobre Nosotros</h1>
        
        <section className="info-section">
          <h2>¿Quiénes Somos?</h2>
          <p>
            RLS Robux Store es tu tienda de confianza para la compra de Robux y productos de Roblox.
            Nos especializamos en ofrecer el mejor servicio, los mejores precios y la entrega más rápida del mercado.
          </p>
        </section>

        <section className="info-section">
          <h2>Nuestra Misión</h2>
          <p>
            Proporcionar una experiencia de compra segura, rápida y confiable para todos los jugadores de Roblox,
            con precios competitivos y un servicio al cliente excepcional disponible 24/7.
          </p>
        </section>

        <section className="info-section">
          <h2>¿Por Qué Elegirnos?</h2>
          <ul>
            <li>✅ <strong>100% Seguro:</strong> Transacciones protegidas y verificadas</li>
            <li>⚡ <strong>Entrega Inmediata:</strong> Recibe tus Robux en minutos</li>
            <li>💰 <strong>Mejor Precio:</strong> Ofertas y descuentos exclusivos</li>
            <li>🎧 <strong>Soporte 24/7:</strong> Atención personalizada siempre disponible</li>
            <li>🛡️ <strong>Garantía Total:</strong> Reembolso si algo sale mal</li>
            <li>🔒 <strong>Pago Seguro:</strong> Múltiples métodos de pago confiables</li>
          </ul>
        </section>

        <section className="info-section">
          <h2>Contáctanos</h2>
          <p>
            ¿Tienes preguntas? Estamos aquí para ayudarte:
          </p>
          <div className="contact-methods">
            <a href="https://wa.me/message/VZYKMCR3JCGCP1" target="_blank" rel="noopener noreferrer" className="contact-btn">
              <MessageCircle size={18} />
              WhatsApp
            </a>
            <a href="https://discord.gg/euDsmE3dCJ" target="_blank" rel="noopener noreferrer" className="contact-btn">
              <MessageCircle size={18} />
              Discord
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
