import { Book, ShoppingCart, CreditCard, Package, Shield, AlertCircle, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import './InfoPage.css';

const Help = () => {
  const helpTopics = [
    {
      icon: <ShoppingCart size={32} />,
      title: "Cómo Comprar",
      description: "Guía paso a paso para realizar tu primera compra",
      link: "/faq"
    },
    {
      icon: <CreditCard size={32} />,
      title: "Métodos de Pago",
      description: "Información sobre los métodos de pago disponibles",
      link: "/faq"
    },
    {
      icon: <Package size={32} />,
      title: "Entrega de Pedidos",
      description: "Cómo y cuándo recibirás tus Robux",
      link: "/faq"
    },
    {
      icon: <Shield size={32} />,
      title: "Seguridad",
      description: "Información sobre la seguridad de tus datos",
      link: "/faq"
    }
  ];

  return (
    <div className="info-page">
      <div className="info-container">
        <h1>Centro de Ayuda</h1>
        <p className="page-subtitle">Encuentra soluciones y aprende a usar nuestros servicios</p>

        <div className="help-grid">
          {helpTopics.map((topic, index) => (
            <Link to={topic.link} key={index} className="help-card">
              <div className="help-icon">{topic.icon}</div>
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
            </Link>
          ))}
        </div>

        <section className="info-section">
          <div className="alert-box info">
            <AlertCircle size={24} />
            <div>
              <h4>¿Necesitas ayuda inmediata?</h4>
              <p>Nuestro equipo de soporte está disponible 24/7 para asistirte</p>
            </div>
          </div>
        </section>

        <section className="info-section">
          <h2>Tutoriales Rápidos</h2>
          
          <div className="tutorial-section">
            <h3><ShoppingCart size={20} style={{display: 'inline', marginRight: '8px'}} />Cómo realizar tu primera compra</h3>
            <ol>
              <li>Selecciona el paquete de Robux que desees</li>
              <li>Ingresa tu nombre de usuario de Roblox</li>
              <li>Elige el método de entrega (Gamepass o Grupo)</li>
              <li>Completa el pago de forma segura</li>
              <li>¡Recibe tus Robux en minutos!</li>
            </ol>
          </div>

          <div className="tutorial-section">
            <h3><Package size={20} style={{display: 'inline', marginRight: '8px'}} />Métodos de Entrega</h3>
            <p><strong>Gamepass:</strong> Monto mínimo 2,500 Robux. Entrega rápida mediante gamepass.</p>
            <p><strong>Grupo:</strong> Monto mínimo 30 Robux. Requiere unirse a 10 comunidades de Roblox.</p>
          </div>
        </section>

        <section className="info-section">
          <h2>Contacto de Soporte</h2>
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

export default Help;
