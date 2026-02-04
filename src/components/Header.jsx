import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Settings,
  Package,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG } from '../config/api';
import './Header.css';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [primaryCurrency, setPrimaryCurrency] = useState({ code: 'PEN', symbol: 'S/' });
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Cargar moneda principal
  useEffect(() => {
    const fetchPrimaryCurrency = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/currencies`);
        const data = await response.json();
        if (data.success) {
          const primary = data.data.find(c => c.isPrimary && c.active);
          if (primary) {
            setPrimaryCurrency({ code: primary.code, symbol: primary.symbol });
          }
        }
      } catch (error) {
        console.error('Error cargando moneda:', error);
      }
    };

    fetchPrimaryCurrency();
  }, []);

  // Detectar resize de ventana
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
      if (window.innerWidth > 900) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuOpen && !e.target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userMenuOpen]);

  // Prevenir scroll cuando el menú móvil está abierto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Búsqueda en tiempo real
  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setSearchLoading(true);
      try {
        // Buscar en productos Robux
        const robuxResponse = await fetch(`${API_CONFIG.BASE_URL}/products/robux`);
        const robuxData = await robuxResponse.json();

        // Buscar en productos in-game
        const inGameResponse = await fetch(`${API_CONFIG.BASE_URL}/products/ingame`);
        const inGameData = await inGameResponse.json();

        let allProducts = [];
        
        // Agregar productos Robux
        if (robuxData.success) {
          allProducts = robuxData.data.map(p => ({ 
            ...p, 
            type: 'robux',
            name: `${p.amount} Robux`,
            searchText: `${p.amount} robux`
          }));
        }
        
        // Agregar productos in-game
        if (inGameData.success) {
          const ingameProducts = inGameData.data.map(p => ({ 
            ...p, 
            type: 'ingame',
            name: p.itemName,
            category: p.game,
            searchText: `${p.itemName} ${p.game} ${p.itemType} ${p.isLimited ? 'limited' : ''}`.toLowerCase()
          }));
          allProducts = [...allProducts, ...ingameProducts];
        }

        // Filtrar productos que coincidan con la búsqueda
        const query = searchQuery.toLowerCase();
        const filtered = allProducts.filter(product => {
          if (product.type === 'robux') {
            return product.searchText.includes(query);
          } else {
            return product.searchText.includes(query);
          }
        }).slice(0, 8); // Máximo 8 resultados

        setSearchResults(filtered);
        setShowSearchResults(filtered.length > 0);
      } catch (error) {
        console.error('Error buscando productos:', error);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-form')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogo?search=${encodeURIComponent(searchQuery)}`);
      setMobileMenuOpen(false);
      setShowSearchResults(false);
    }
  };

  const handleProductClick = (product) => {
    if (product.type === 'robux') {
      navigate('/robux');
    } else if (product.isLimited) {
      navigate('/limiteds');
    } else {
      navigate(`/game/${product.game || product.category}`);
    }
    setShowSearchResults(false);
    setSearchQuery('');
  };

  return (
    <header 
      className="header" 
      style={{ 
        position: 'fixed', 
        top: !isMobile ? '12px' : '0', 
        left: !isMobile ? '50%' : '0',
        transform: !isMobile ? 'translateX(-50%)' : 'none',
        width: !isMobile ? 'fit-content' : '100%',
        right: !isMobile ? 'auto' : '0',
        zIndex: 9999, 
        backgroundColor: 'rgba(10, 10, 10, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        borderRadius: !isMobile ? '16px' : '0',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Overlay para cerrar menú móvil */}
      {mobileMenuOpen && (
        <div 
          className="mobile-menu-overlay open"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="header-container">
        {/* Top Row */}
        <div className="header-top">
          <div className="header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link to="/" className="logo">
              <img
                src="https://i.postimg.cc/5xqCPXwc/RLS-LOGO.png"
                alt="RLS Logo"
                className="logo-img"
              />
            </Link>

            <nav className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
              <Link 
                to="/" 
                className={`nav-link ${location.pathname === '/' ? 'highlighted' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link 
                to="/catalogo" 
                className={`nav-link ${location.pathname.includes('/catalogo') ? 'highlighted' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Catálogo
              </Link>
              <Link 
                to="/reviews" 
                className={`nav-link ${location.pathname === '/reviews' ? 'highlighted' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Reseñas
              </Link>
              <Link 
                to="/contacto" 
                className={`nav-link ${location.pathname === '/contacto' ? 'highlighted' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Contacto
              </Link>
            </nav>
          </div>

          <div className="header-right">
            <div className="search-container">
              <form className="search-form" onSubmit={handleSearch}>
                <Search className="search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Buscar: 400 Robux, Blox Fruits, game pass..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                  className="search-input"
                />
              </form>

              {/* Resultados de búsqueda en tiempo real */}
              {showSearchResults && (
                <div className="search-results-dropdown">
                  {searchLoading ? (
                    <div className="search-loading">
                      <Search size={16} />
                      Buscando...
                    </div>
                  ) : (
                    <>
                      <div className="search-results-header">
                        Resultados ({searchResults.length})
                      </div>
                      <div className="search-results-list">
                        {searchResults.map((product, index) => (
                          <div
                            key={`${product.type}-${product.id || index}`}
                            className="search-result-item"
                            onClick={() => handleProductClick(product)}
                          >
                            <div className="search-result-info">
                              <div className="search-result-name">{product.name}</div>
                              <div className="search-result-meta">
                                {product.type === 'robux' ? (
                                  <span className="search-result-badge robux">
                                    <img src="/robux-logo.svg" alt="R$" style={{width: '12px', height: '12px'}} />
                                    {product.amount} Robux
                                  </span>
                                ) : (
                                  <>
                                    <span className="search-result-badge ingame">
                                      {product.itemType}
                                    </span>
                                    {product.isLimited && (
                                      <span className="search-result-badge limited">
                                        LIMITED
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="search-result-price">
                              {primaryCurrency.symbol}{product.price}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {isAuthenticated && user ? (
              <div className="user-menu-container">
                <button
                  className="user-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <img
                    src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt={user.username}
                    className="user-avatar"
                    onError={(e) => {
                      e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
                    }}
                  />
                  <span className="user-name">{user.username}</span>
                  <ChevronDown size={16} />
                </button>

                {userMenuOpen && (
                  <div className="user-dropdown">
                    <Link 
                      to="/profile" 
                      className="dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User size={18} />
                      Mi Perfil
                    </Link>
                    <Link 
                      to="/orders" 
                      className="dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Package size={18} />
                      Mis Pedidos
                    </Link>
                    <Link 
                      to="/settings" 
                      className="dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings size={18} />
                      Configuración
                    </Link>
                    <button 
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }} 
                      className="dropdown-item logout"
                    >
                      <LogOut size={18} />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="login-btn">
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
