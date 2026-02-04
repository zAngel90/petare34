import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Zap, Shield, Clock, Star, Users, Package, ChevronRight, Check, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Home.css';
import './CatalogPreview.css';

const Home = () => {
  const { addToCart } = useCart();
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      id: 1,
      title: 'Consigue Robux',
      subtitle: 'De forma rápida y segura',
      description: 'Los mejores precios del mercado',
      ctaText: 'Ver Ofertas',
      ctaLink: '/catalogo?categoria=robux',
      bgImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&q=80',
      bgOverlay: 'linear-gradient(135deg, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.65) 100%)',
      showProduct: false
    },
    {
      id: 2,
      title: 'Hasta 20% OFF',
      subtitle: 'En paquetes seleccionados',
      description: 'Oferta por tiempo limitado',
      ctaText: 'Comprar Ahora',
      ctaLink: '/catalogo?categoria=robux',
      bgImage: 'https://images.unsplash.com/photo-1614850523060-8da1d56ae167?w=1920&q=80',
      bgOverlay: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.6) 100%)',
      showProduct: true,
      productData: {
        amount: 1700,
        price: 18.45,
        originalPrice: 22.99,
        product: { id: 3, name: '1,700 Robux', amount: 1700, price: 18.45, originalPrice: 22.99 }
      }
    },
    {
      id: 3,
      title: 'Soporte 24/7',
      subtitle: 'Siempre disponibles para ti',
      description: 'Atención personalizada en todo momento',
      ctaText: 'Contactar',
      ctaLink: '/soporte',
      bgImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&q=80',
      bgOverlay: 'linear-gradient(135deg, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.65) 100%)',
      showProduct: false
    }
  ];

  const bestSellers = [
    { id: 1, name: '400 Robux', amount: 400, price: 4.99, originalPrice: 6.25, instant: true },
    { id: 2, name: '800 Robux', amount: 800, price: 8.99, originalPrice: 11.25, instant: true },
    { id: 3, name: '1,700 Robux', amount: 1700, price: 18.45, originalPrice: 22.99, instant: true, bestValue: true },
    { id: 4, name: '10,000 Robux', amount: 10000, price: 91.99, originalPrice: 111.99, instant: true }
  ];

  // Auto-play del carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      type: 'robux',
      image: null
    });
  };

  return (
    <div className="home-page">
      {/* Hero Carrusel de Banners */}
      <div className="scroll-wrapper">
      <section className="hero-carousel">
        <div className="carousel-container">
          {/* Slides */}
          <div className="carousel-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {banners.map((banner) => (
              <div 
                key={banner.id} 
                className="carousel-slide"
              >
                {/* Background Image with Overlay */}
                <div 
                  className="slide-background"
                  style={{
                    backgroundImage: `url(${banner.bgImage})`,
                  }}
                />
                <div 
                  className="slide-overlay"
                  style={{ background: banner.bgOverlay }}
                />

                <div className="slide-content-simple">
                  <div className="simple-layout">
                    {/* Content */}
                    <div className="slide-main-content">
                      <h2 className="slide-heading">{banner.title}</h2>
                      <p className="slide-text">{banner.subtitle}</p>

                      {banner.showProduct && banner.productData && (
                        <div className="price-display">
                          <span className="price-big">${banner.productData.price}</span>
                          <span className="price-small">${banner.productData.originalPrice}</span>
                        </div>
                      )}

                      <div className="slide-badges">
                        <span className="mini-badge"><Zap size={12} /> Instantáneo</span>
                        <span className="mini-badge"><Shield size={12} /> Seguro</span>
                        <span className="mini-badge"><Star size={12} /> 4.9★</span>
                      </div>

                      <Link to={banner.ctaLink} className="btn-simple">
                        {banner.ctaText}
                      </Link>
                    </div>

                    {/* Visual (solo si hay producto) */}
                    {banner.showProduct && banner.productData && (
                      <div className="slide-product-visual">
                        <div className="product-badge-simple">
                          <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Robux_logo.svg/1200px-Robux_logo.svg.png" 
                            alt="Robux"
                          />
                        </div>
                        <span className="product-qty">{banner.productData.amount.toLocaleString()} Robux</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button className="carousel-arrow carousel-prev" onClick={prevSlide}>
            <ChevronRight size={28} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button className="carousel-arrow carousel-next" onClick={nextSlide}>
            <ChevronRight size={28} />
          </button>

          {/* Dots Navigation */}
          <div className="carousel-dots">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      </div>

      {/* Contenido que sube */}
      <div className="content-overlay">
      {/* Por qué elegirnos */}
      <section className="why-us-section">
        <div className="section-header">
          <h2 className="section-heading">¿Por qué elegirnos?</h2>
          <p className="section-subheading">Miles de clientes confían en nosotros</p>
        </div>

        <div className="why-us-grid">
          <div className="why-card">
            <div className="why-icon">
              <Zap size={32} />
            </div>
            <h3 className="why-title">Entrega Instantánea</h3>
            <p className="why-description">
              Recibe tus Robux en menos de 2 minutos. Sin esperas, sin complicaciones.
            </p>
          </div>

          <div className="why-card">
            <div className="why-icon">
              <Shield size={32} />
            </div>
            <h3 className="why-title">100% Seguro</h3>
            <p className="why-description">
              Transacciones protegidas con encriptación de grado bancario. Tu información está segura.
            </p>
          </div>

          <div className="why-card">
            <div className="why-icon">
              <Users size={32} />
            </div>
            <h3 className="why-title">+50,000 Clientes</h3>
            <p className="why-description">
              Miles de usuarios satisfechos nos respaldan. Lee sus opiniones reales.
            </p>
          </div>

          <div className="why-card">
            <div className="why-icon">
              <Star size={32} />
            </div>
            <h3 className="why-title">Rating 4.9/5</h3>
            <p className="why-description">
              Excelente calificación basada en más de 30,000 reseñas verificadas.
            </p>
          </div>
        </div>
      </section>

      {/* Explora el Catálogo */}
      <section className="catalog-preview-section">
        <div className="section-header">
          <h2 className="section-heading">Explora Nuestro Catálogo</h2>
          <p className="section-subheading">Los mejores precios en Robux y más</p>
        </div>

        <div className="catalog-products-grid">
          {bestSellers.slice(0, 3).map((product) => (
            <div key={product.id} className="catalog-product-card">
              <div className="catalog-product-icon">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Robux_logo.svg/1200px-Robux_logo.svg.png" 
                  alt="Robux"
                />
              </div>
              
              <h3 className="catalog-product-name">{product.amount.toLocaleString()} Robux</h3>
              
              <div className="catalog-product-price">
                <span className="catalog-price-current">${product.price}</span>
                <span className="catalog-price-old">${product.originalPrice}</span>
              </div>

              <div className="catalog-product-features">
                <span><Zap size={14} /> Instantáneo</span>
                <span><Shield size={14} /> Seguro</span>
              </div>

              <button
                className="catalog-btn-add"
                onClick={() => handleAddToCart(product)}
              >
                Agregar al Carrito
              </button>
            </div>
          ))}
        </div>

        <div className="catalog-cta-wrapper">
          <Link to="/catalogo" className="catalog-btn-view-all">
            Ver Catálogo Completo
            <ChevronRight size={20} />
          </Link>
        </div>
      </section>

      {/* Opiniones/Testimonios */}
      <section className="testimonials-section">
        <div className="section-header">
          <h2 className="section-heading">Lo que dicen nuestros clientes</h2>
          <p className="section-subheading">Opiniones reales de compradores verificados</p>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-rating">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="#ffd16d" stroke="#ffd16d" />
              ))}
            </div>
            <p className="testimonial-text">
              "Excelente servicio, recibí mis Robux al instante. El proceso fue super fácil y el soporte es muy atento."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">M</div>
              <div className="author-info">
                <span className="author-name">María G.</span>
                <span className="author-date">Hace 2 días</span>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-rating">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="#ffd16d" stroke="#ffd16d" />
              ))}
            </div>
            <p className="testimonial-text">
              "Mejor precio que encontré en internet. Ya he comprado 3 veces y siempre perfecto. 100% recomendado."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">J</div>
              <div className="author-info">
                <span className="author-name">Juan P.</span>
                <span className="author-date">Hace 1 semana</span>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-rating">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="#ffd16d" stroke="#ffd16d" />
              ))}
            </div>
            <p className="testimonial-text">
              "Rápido y seguro. Dudaba al principio pero todo salió perfecto. El soporte 24/7 respondió todas mis dudas."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">A</div>
              <div className="author-info">
                <span className="author-name">Ana L.</span>
                <span className="author-date">Hace 3 días</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preguntas Frecuentes */}
      <section className="faq-section">
        <div className="section-header">
          <h2 className="section-heading">Preguntas Frecuentes</h2>
          <p className="section-subheading">Resolvemos tus dudas</p>
        </div>

        <div className="faq-grid">
          <div className="faq-item">
            <h3 className="faq-question">¿Cuánto tarda la entrega?</h3>
            <p className="faq-answer">
              La entrega es instantánea. Recibirás tus Robux en menos de 2 minutos después de confirmar tu compra.
            </p>
          </div>

          <div className="faq-item">
            <h3 className="faq-question">¿Es seguro comprar aquí?</h3>
            <p className="faq-answer">
              Sí, totalmente seguro. Utilizamos encriptación SSL y no almacenamos datos sensibles. Miles de clientes nos respaldan.
            </p>
          </div>

          <div className="faq-item">
            <h3 className="faq-question">¿Qué métodos de pago aceptan?</h3>
            <p className="faq-answer">
              Aceptamos tarjetas de crédito/débito, PayPal, transferencias bancarias y criptomonedas.
            </p>
          </div>

          <div className="faq-item">
            <h3 className="faq-question">¿Tienen soporte si tengo problemas?</h3>
            <p className="faq-answer">
              Sí, nuestro equipo de soporte está disponible 24/7 para ayudarte con cualquier duda o inconveniente.
            </p>
          </div>

          <div className="faq-item">
            <h3 className="faq-question">¿Puedo comprar para otra cuenta?</h3>
            <p className="faq-answer">
              Sí, puedes comprar Robux para cualquier cuenta de Roblox. Solo necesitas proporcionar el nombre de usuario.
            </p>
          </div>

          <div className="faq-item">
            <h3 className="faq-question">¿Ofrecen garantía?</h3>
            <p className="faq-answer">
              Sí, garantizamos tu compra al 100%. Si hay algún problema, te devolvemos tu dinero sin preguntas.
            </p>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
};

export default Home;
