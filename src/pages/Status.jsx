import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, MessageCircle } from 'lucide-react';
import './InfoPage.css';

const Status = () => {
  const [services, setServices] = useState([
    { name: 'Sitio Web', status: 'operational', uptime: '99.9%' },
    { name: 'Sistema de Pagos', status: 'operational', uptime: '99.8%' },
    { name: 'Entrega de Robux', status: 'operational', uptime: '99.9%' },
    { name: 'Soporte al Cliente', status: 'operational', uptime: '100%' },
    { name: 'API de Roblox', status: 'operational', uptime: '99.5%' }
  ]);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'operational':
        return <CheckCircle size={20} className="status-icon operational" />;
      case 'degraded':
        return <AlertCircle size={20} className="status-icon degraded" />;
      case 'down':
        return <AlertCircle size={20} className="status-icon down" />;
      default:
        return <Clock size={20} className="status-icon" />;
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'operational':
        return 'Operacional';
      case 'degraded':
        return 'Degradado';
      case 'down':
        return 'Fuera de Servicio';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className="info-page">
      <div className="info-container">
        <h1>Estado del Servicio</h1>
        <p className="page-subtitle">Monitoreo en tiempo real de nuestros servicios</p>

        <div className="status-banner operational">
          <CheckCircle size={32} />
          <div>
            <h2>Todos los Sistemas Operacionales</h2>
            <p>Todos nuestros servicios están funcionando correctamente</p>
          </div>
        </div>

        <section className="info-section">
          <h2>Estado de Servicios</h2>
          <div className="services-list">
            {services.map((service, index) => (
              <div key={index} className="service-item">
                <div className="service-info">
                  {getStatusIcon(service.status)}
                  <div>
                    <h4>{service.name}</h4>
                    <span className={`status-badge ${service.status}`}>
                      {getStatusText(service.status)}
                    </span>
                  </div>
                </div>
                <div className="service-uptime">
                  <span className="uptime-label">Disponibilidad:</span>
                  <span className="uptime-value">{service.uptime}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="info-section">
          <h3>Última Actualización</h3>
          <p className="last-updated">
            <Clock size={16} /> Actualizado hace menos de 1 minuto
          </p>
        </section>

        <section className="info-section">
          <div className="alert-box info">
            <AlertCircle size={24} />
            <div>
              <h4>¿Experimentas algún problema?</h4>
              <p>Si tienes problemas no listados aquí, contacta a nuestro soporte 24/7</p>
              <div className="contact-methods" style={{ marginTop: '12px' }}>
                <a href="https://wa.me/message/VZYKMCR3JCGCP1" target="_blank" rel="noopener noreferrer" className="contact-btn small">
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
                <a href="https://discord.gg/euDsmE3dCJ" target="_blank" rel="noopener noreferrer" className="contact-btn small">
                  <MessageCircle size={16} />
                  Discord
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Status;
