import { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import './InfoPage.css';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "¿Cómo funciona la compra de Robux?",
      answer: "Selecciona el paquete de Robux que desees, proporciona tu nombre de usuario de Roblox, completa el pago y recibirás tus Robux en minutos a través del método seleccionado (Gamepass o Grupo)."
    },
    {
      question: "¿Cuánto tiempo tarda la entrega?",
      answer: "La entrega es inmediata. Una vez confirmado el pago, procesamos tu pedido en minutos. El tiempo puede variar entre 5-15 minutos dependiendo del método de entrega."
    },
    {
      question: "¿Es seguro comprar aquí?",
      answer: "Sí, completamente seguro. Usamos métodos de entrega oficiales de Roblox (Gamepass y Grupos) y nunca pedimos tu contraseña. Todas las transacciones están protegidas."
    },
    {
      question: "¿Qué métodos de pago aceptan?",
      answer: "Aceptamos múltiples métodos de pago incluyendo tarjetas de crédito/débito, transferencias bancarias y otros métodos locales seguros."
    },
    {
      question: "¿Puedo obtener un reembolso?",
      answer: "Sí, ofrecemos garantía de reembolso si hay algún problema con tu pedido. Contacta a nuestro soporte dentro de las 24 horas posteriores a tu compra."
    },
    {
      question: "¿Cuál es la diferencia entre Gamepass y Grupo?",
      answer: "Gamepass: Monto mínimo 2,500 Robux. Grupo: Monto mínimo 30 Robux. El método por Grupo requiere unirse a 10 comunidades de Roblox."
    },
    {
      question: "¿Necesito dar mi contraseña de Roblox?",
      answer: "NO. Nunca pedimos tu contraseña. Solo necesitamos tu nombre de usuario público de Roblox para realizar la entrega."
    },
    {
      question: "¿Qué hago si no recibo mis Robux?",
      answer: "Contacta inmediatamente a nuestro soporte 24/7 a través de WhatsApp o Discord con tu número de pedido. Resolveremos tu caso de inmediato."
    }
  ];

  return (
    <div className="info-page">
      <div className="info-container">
        <h1>Preguntas Frecuentes</h1>
        <p className="page-subtitle">Encuentra respuestas a las preguntas más comunes</p>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item ${openIndex === index ? 'open' : ''}`}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <div className="faq-question">
                <h3>{faq.question}</h3>
                <ChevronDown size={20} className="faq-icon" />
              </div>
              {openIndex === index && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <section className="info-section">
          <h2>¿No encontraste tu respuesta?</h2>
          <p>Contáctanos directamente y te ayudaremos:</p>
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

export default FAQ;
