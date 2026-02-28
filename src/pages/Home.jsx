import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Zap, 
  DollarSign, 
  Headphones,
  Award,
  Lock,
  TrendingUp,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Star
} from 'lucide-react';
import { API_CONFIG } from '../config/api';
import ReviewsSection from '../components/ReviewsSection';
import './Home.css';

const Home = () => {
  const [robuxPackages, setRobuxPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState({ topSales: [], trending: [] });
  const [loading, setLoading] = useState(true);
  const [primaryCurrency, setPrimaryCurrency] = useState({ code: 'PEN', symbol: 'S/' });
  const [inGameProducts, setInGameProducts] = useState([]);
  const [limitedProducts, setLimitedProducts] = useState([]);

  // Fetch datos del home
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch moneda principal
        const currenciesResponse = await fetch(`${API_CONFIG.BASE_URL}/currencies`);
        const currenciesData = await currenciesResponse.json();
        if (currenciesData.success) {
          const primary = currenciesData.data.find(c => c.isPrimary && c.active);
          if (primary) {
            setPrimaryCurrency({ code: primary.code, symbol: primary.symbol });
          }
        }
        
        // Fetch slides
        const slidesResponse = await fetch(`${API_CONFIG.BASE_URL}/home-config/slides`);
        const slidesData = await slidesResponse.json();
        console.log('🎞️ Respuesta slides:', slidesData);
        if (slidesData.success && slidesData.data.length > 0) {
          console.log('🎞️ Slides cargados:', slidesData.data);
          console.log('🎞️ Total slides:', slidesData.data.length);
          slidesData.data.forEach((s, i) => {
            console.log(`  Slide ${i}: ID=${s.id}, Active=${s.active}, Type=${s.type}`);
          });
          setSlides(slidesData.data);
        } else {
          console.error('❌ No hay slides o error:', slidesData);
        }
        
        // Fetch productos destacados
        const featuredResponse = await fetch(`${API_CONFIG.BASE_URL}/home-config/featured-products`);
        const featuredData = await featuredResponse.json();
        if (featuredData.success) {
          setFeaturedProducts(featuredData.data);
        }
        
        // Fetch paquetes de Robux
        const packagesResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS.ROBUX}`);
        const packagesData = await packagesResponse.json();
        if (packagesData.success) {
          setRobuxPackages(packagesData.data);
        }

        // Fetch productos in-game
        const inGameResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS.INGAME}`);
        const inGameData = await inGameResponse.json();
        if (inGameData.success) {
          // Filtrar productos regulares (no limitados)
          const regularProducts = inGameData.data.filter(p => !p.isLimited && p.active);
          setInGameProducts(regularProducts.slice(0, 4));
          
          // Filtrar productos limitados
          const limitedProducts = inGameData.data.filter(p => p.isLimited && p.active);
          setLimitedProducts(limitedProducts.slice(0, 4));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
        setLoadingPackages(false);
      }
    };

    fetchData();
  }, []);

  // Auto-avanzar slides cada 5 segundos
  useEffect(() => {
    if (slides.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    const next = (currentSlide + 1) % slides.length;
    console.log('➡️ Next slide:', currentSlide, '→', next, '(Total:', slides.length, ')');
    setCurrentSlide(next);
  };

  const prevSlide = () => {
    const prev = (currentSlide - 1 + slides.length) % slides.length;
    console.log('⬅️ Prev slide:', currentSlide, '→', prev, '(Total:', slides.length, ')');
    setCurrentSlide(prev);
  };

  // Robux carousel - items base
  const robuxCarouselItems = Array(20).fill('/robux-logo.svg');

  if (loading) {
    return (
      <div className="home-new">
        <div className="loading-home">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="home-new">
      {/* Hero Carousel + Sidebar Layout */}
      <div className="hero-layout">
        {/* Hero Carousel */}
        <section className="hero-carousel">
          {slides.length > 0 ? (
            <>
              <div className="carousel-container">
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`simple-carousel-slide ${slide.type === 'custom' ? 'custom-type' : 'corporate-type'}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: index === currentSlide ? 1 : 0,
                      visibility: index === currentSlide ? 'visible' : 'hidden',
                      transition: 'opacity 0.8s ease-in-out, visibility 0.8s',
                      backgroundColor: slide.type === 'custom' ? 'transparent' : 'rgba(0,0,0,0.7)',
                      zIndex: index === currentSlide ? 2 : 1
                    }}
                  >
                    {slide.type === 'custom' ? (
                      <>
                        <img 
                          src={slide.image}
                          alt="Slide" 
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }} 
                        />
                        <div className="hover-overlay"></div>
                      </>
                    ) : (
                      (() => {
                        const imageUrl = slide.image?.startsWith('http') ? slide.image : `${API_CONFIG.SERVER_URL}${slide.image}`;
                        console.log('🖼️ Corporate slide image URL:', imageUrl);
                        console.log('🖼️ Original slide.image:', slide.image);
                        console.log('🖼️ SERVER_URL:', API_CONFIG.SERVER_URL);
                        return (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            backgroundImage: `url("${imageUrl}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '60px',
                            position: 'relative'
                          }}>
                            <div className="hero-content" style={{
                          background: 'rgba(0, 0, 0, 0.85)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          padding: '40px',
                          borderRadius: '20px',
                          border: '1px solid rgba(255, 209, 109, 0.2)',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                          maxWidth: '700px'
                        }}>
                          <span className="hero-badge">OFERTA ESPECIAL</span>
                          <h1 className="hero-title">{slide.title}</h1>
                          <p className="hero-description">{slide.description}</p>
                          <div className="hero-actions">
                            {slide.buttons && slide.buttons.map((button, btnIndex) => (
                              <Link
                                key={btnIndex}
                                to={button.url}
                                className={`btn-hero-${button.style}`}
                              >
                                {button.style === 'primary' && <ArrowRight size={20} />}
                                {button.text}
                              </Link>
                            ))}
                          </div>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                ))}
              </div>

              {/* Carousel Controls */}
              {slides.length > 1 && (
                <>
                  <button className="carousel-btn carousel-prev" onClick={prevSlide}>
                    <ChevronLeft size={30} />
                  </button>
                  <button className="carousel-btn carousel-next" onClick={nextSlide}>
                    <ChevronRight size={30} />
                  </button>
                  
                  <div className="carousel-indicators">
                    {slides.map((_, index) => (
                      <button
                        key={index}
                        className={`indicator ${index === currentSlide ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(index)}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="hero-main">
              <div className="hero-content">
                <span className="hero-badge">MEJOR OFERTA DEL MES</span>
                <h1 className="hero-title">ROBUX PREMIUM BUNDLE</h1>
                <div className="hero-price-info">
                  <p className="hero-amount">5,000 Robux</p>
                  <p className="hero-bonus">+ 500 Robux GRATIS</p>
                  <p className="hero-price">$49.99</p>
                </div>
                <div className="hero-actions">
                  <Link to="/robux" className="btn-hero-primary">
                    <ArrowRight size={20} />
                    COMPRAR AHORA
                  </Link>
                  <Link to="/catalogo" className="btn-hero-secondary">
                    VER MÁS PAQUETES
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Sidebar Trending + Top Ventas */}
        <aside className="sidebar-right">
          {/* Productos Trending */}
          <div className="trending-section">
            <h3 className="section-title">
              <TrendingUp size={20} />
              PRODUCTOS TRENDING
            </h3>
            <div className="trending-list">
              {featuredProducts.trending.length > 0 ? (
                featuredProducts.trending.map((product) => (
                  <div key={product.id} className="trending-item">
                    <div className="trending-image-placeholder">
                      <img src="/robux-logo.svg" alt="Robux" className="robux-icon" />
                    </div>
                    <div className="trending-info">
                      <h4>{product.customAmount} Robux</h4>
                      <span className="trending-badge badge-hot">HOT</span>
                      <p className="trending-price">{primaryCurrency.symbol}{product.customPrice}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">No hay productos trending</p>
              )}
            </div>
          </div>

          {/* Top Ventas */}
          <div className="top-sales-section">
            <h3 className="section-title">🔥 TOP VENTAS</h3>
            <div className="top-sales-list">
              {featuredProducts.topSales.length > 0 ? (
                featuredProducts.topSales.map((item, index) => (
                  <div key={item.id} className="top-sale-item">
                    <span className="sale-rank">{index + 1}</span>
                    <div className="sale-info">
                      <h4>{item.customAmount} Robux</h4>
                      <p>{item.soldCount} vendidos</p>
                    </div>
                    <span className="sale-price">{primaryCurrency.symbol}{item.customPrice}</span>
                  </div>
                ))
              ) : (
                <p className="no-data">No hay top ventas</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Robux Carousel */}
      <section className="robux-carousel-section">
        <div className="robux-carousel-track">
          {/* Triple repetición para scroll infinito */}
          {robuxCarouselItems.map((logo, index) => (
            <div key={`set1-${index}`} className="robux-carousel-item">
              <img src={logo} alt="Robux" draggable="false" />
            </div>
          ))}
          {robuxCarouselItems.map((logo, index) => (
            <div key={`set2-${index}`} className="robux-carousel-item">
              <img src={logo} alt="Robux" draggable="false" />
            </div>
          ))}
          {robuxCarouselItems.map((logo, index) => (
            <div key={`set3-${index}`} className="robux-carousel-item">
              <img src={logo} alt="Robux" draggable="false" />
            </div>
          ))}
        </div>
      </section>

      {/* Paquetes de Robux */}
      <section className="robux-packages-section">
        <div className="section-header">
          <h2>
            <TrendingUp size={24} />
            PAQUETES DE ROBUX
          </h2>
          <Link to="/robux" className="see-all-link">
            Ver todos
          </Link>
        </div>

        {loadingPackages ? (
          <div className="loading-grid">Cargando paquetes...</div>
        ) : (
          <div className="packages-grid">
            {robuxPackages
              .filter(pkg => pkg.active)
              .sort((a, b) => a.amount - b.amount)
              .slice(0, 4)
              .map((pkg) => (
                <div key={pkg.id} className="package-card">
                  {pkg.popular && <span className="popular-badge">⭐ POPULAR</span>}
                  {pkg.discount > 0 && (
                    <span className="package-discount">-{pkg.discount}%</span>
                  )}
                  <div className="package-icon">
                    <img src="/robux-logo.svg" alt="Robux" />
                  </div>
                  <h3>{pkg.amount.toLocaleString()} Robux</h3>
                  <div className="package-price-container">
                    {pkg.discount > 0 ? (
                      <>
                        <p className="package-price-original" style={{
                          textDecoration: 'line-through',
                          opacity: 0.6,
                          fontSize: '0.9rem',
                          marginBottom: '4px',
                          margin: 0
                        }}>
                          {primaryCurrency.symbol}{pkg.price}
                        </p>
                        <p className="package-price" style={{ color: '#00d084', fontWeight: 'bold', margin: 0 }}>
                          {primaryCurrency.symbol}{(parseFloat(pkg.price || 0) * (1 - pkg.discount / 100)).toFixed(2)}
                        </p>
                      </>
                    ) : (
                      <p className="package-price" style={{ margin: 0 }}>{primaryCurrency.symbol}{pkg.price}</p>
                    )}
                  </div>
                  <Link to="/robux" className="package-btn">
                    Comprar
                  </Link>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Productos In-Game */}
      <section className="ingame-products-section">
        <div className="section-header">
          <h2>
            <Gamepad2 size={24} />
            PRODUCTOS IN-GAME
          </h2>
          <Link to="/catalogo" className="see-all-link">
            Ver todos
          </Link>
        </div>

        <div className="ingame-products-grid">
          {inGameProducts.length > 0 ? (
            inGameProducts.map((product) => (
              <div key={product.id} className="ingame-product-card">
                <div className="ingame-card-image">
                  {product.image ? (
                    <img src={product.image.startsWith('http') ? product.image : `${API_CONFIG.SERVER_URL}${product.image}`} alt={product.itemName} />
                  ) : (
                    <div className="ingame-placeholder">
                      <img src="/robux-logo.svg" alt="Robux" style={{ width: '60px', opacity: 0.3 }} />
                    </div>
                  )}
                </div>
                <div className="ingame-card-content">
                  <span className="ingame-game-badge">{product.game || 'Roblox'}</span>
                  <h3 className="ingame-card-title">{product.itemName?.replace(/-/g, ' ')}</h3>
                  {/* Mostrar itemType como badge */}
                  {product.itemType && (
                    <span className="classification-badge-text-home">
                      {product.itemType.replace(/-/g, ' ')}
                    </span>
                  )}
                  <div className="ingame-card-footer">
                    <span className="ingame-card-price">{primaryCurrency.symbol}{product.price}</span>
                    <Link to={`/game/${product.game?.toLowerCase()}`} className="ingame-card-btn">
                      Ver más
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No hay productos in-game disponibles</p>
          )}
        </div>
      </section>

      {/* Productos Limiteds */}
      <section className="limiteds-section">
        <div className="section-header">
          <h2>
            <Star size={24} />
            ITEMS LIMITADOS
          </h2>
          <Link to="/catalogo" className="see-all-link">
            Ver todos
          </Link>
        </div>

        <div className="limiteds-grid">
          {limitedProducts.length > 0 ? (
            limitedProducts.map((product) => (
              <div key={product.id} className="limited-card">
                <div className="limited-badge">LIMITED</div>
                <div className="limited-card-image">
                  {product.image ? (
                    <img src={product.image.startsWith('http') ? product.image : `${API_CONFIG.SERVER_URL}${product.image}`} alt={product.itemName} />
                  ) : (
                    <div className="limited-placeholder">
                      <img src="/robux-logo.svg" alt="Limited" style={{ width: '80px', opacity: 0.4 }} />
                    </div>
                  )}
                </div>
                <div className="limited-card-content">
                  <h3 className="limited-card-title">{product.itemName}</h3>
                  <div className="limited-game-info">
                    <span className="limited-game-tag">{product.game}</span>
                    {/* Mostrar itemType como badge */}
                    {product.itemType && (
                      <span className="classification-badge-text-home">
                        {product.itemType}
                      </span>
                    )}
                  </div>
                  <div className="limited-card-footer">
                    <div className="limited-price-section">
                      <span className="limited-card-price">{primaryCurrency.symbol}{product.price}</span>
                      <span className="limited-robux">{product.robuxAmount} Robux</span>
                    </div>
                    <Link to={`/game/${product.game?.toLowerCase()}`} className="limited-card-btn">
                      Comprar
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No hay items limitados disponibles</p>
          )}
        </div>
      </section>

      {/* Reviews Section */}
      <ReviewsSection />
    </div>
  );
};

export default Home;
