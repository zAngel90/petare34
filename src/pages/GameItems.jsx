import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, LayoutGrid, Filter, ShoppingCart, Plus, Minus, X, ArrowLeft, Gamepad2, Package } from 'lucide-react';
import { API_CONFIG } from '../config/api';
import { useCart } from '../context/CartContext';
import './GameItems.css';

const GameItems = () => {
  const { gameSlug } = useParams();
  const navigate = useNavigate();
  const { items: globalCartItems, addItem: addToGlobalCart, removeItem: removeFromGlobalCart, updateQuantity: updateGlobalQuantity } = useCart();

  
  // Estados
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('games'); // 'games' o 'limiteds'
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all'); // Predeterminado: mostrar todas las categorías
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortBy, setSortBy] = useState('popularity'); // popularity, price-asc, price-desc, name-asc, name-desc
  const [showRarityMenu, setShowRarityMenu] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('PEN');
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showCart, setShowCart] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showMobileGamesSidebar, setShowMobileGamesSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTabletOrMobile, setIsTabletOrMobile] = useState(window.innerWidth <= 1200);
  
  // Filtrar items del carrito global que son de tipo game items (no robux)
  const cart = globalCartItems.filter(item => item.type !== 'robux');

  // Obtener monedas del backend
  const [currencies, setCurrencies] = useState([]);

  const currentCurrency = currencies.find(c => c.code === selectedCurrency) || currencies[0];

  // Cargar categorías (juegos) y monedas
  useEffect(() => {
    loadGames();
    loadCurrencies();
    
    // Detectar resize para móvil y tablet
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTabletOrMobile(window.innerWidth <= 1200);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar productos cuando cambia el juego
  useEffect(() => {
    if (gameSlug === 'limiteds') {
      setViewMode('limiteds');
      setSelectedGame({ name: 'Objetos Limitados 🔥', slug: 'limiteds' });
      loadLimitedItems();
    } else if (gameSlug && games.length > 0) {
      const game = games.find(g => g.slug === gameSlug);
      if (game) {
        setViewMode('games');
        setSelectedGame(game);
        loadGameItems(gameSlug);
      } else {
        navigate('/catalogo');
      }
    }
  }, [gameSlug, games, navigate]);

  const loadGames = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/categories`);
      const data = await response.json();
      
      if (data.success) {
        const gamesData = data.data
          .filter(cat => cat.active)
          .map(cat => ({
            id: cat.id,
            slug: cat.slug,
            name: cat.name,
            image: cat.image
          }));
        setGames(gamesData);
      }
    } catch (error) {
      console.error('Error cargando juegos:', error);
    }
  };

  const loadCurrencies = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/currencies`);
      const data = await response.json();
      
      if (data.success) {
        // Usar solo la moneda principal
        const primaryCurrency = data.data.find(c => c.isPrimary && c.active);
        const activeCurrencies = primaryCurrency ? [primaryCurrency] : data.data.filter(c => c.active);
        setCurrencies(activeCurrencies);
        
        // Establecer automáticamente la moneda principal
        if (primaryCurrency) {
          setSelectedCurrency(primaryCurrency.code);
        }
      }
    } catch (error) {
      console.error('Error cargando monedas:', error);
      // Fallback a monedas por defecto si falla
      setCurrencies([
        { code: 'PEN', symbol: 'S/', flag: '🇵🇪', name: 'Sol Peruano', rate: 3.7, isPrimary: true }
      ]);
    }
  };

  // Los precios ya están guardados en la moneda correcta (PEN)
  // NO necesitamos convertir, solo retornar el precio tal cual
  const convertPrice = (price) => {
    if (!price) return 0;
    return parseFloat(price).toFixed(2);
  };

  // Función para formatear precio con 2 decimales siempre
  const formatPriceWithDecimals = (price) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return '0.00';
    return numPrice.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const loadGameItems = async (slug) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/products/ingame`);
      const data = await response.json();
      
      if (data.success) {
        const gameItems = data.data
          .filter(item => item.game === slug && item.active)
          .map(item => ({
            id: item.id,
            game: item.game,
            name: item.itemName,
            category: item.itemType || 'Items',
            categoryOrder: item.categoryOrder !== undefined ? item.categoryOrder : 999,
            productOrder: item.productOrder !== undefined ? item.productOrder : 999,
            rarity: item.rarity || null,
            rarityColor: item.rarityColor || null,
            price: item.robuxAmount,
            priceUSD: item.price, // Precio en PEN (ya no se convierte)
            image: item.image || 'https://via.placeholder.com/150',
            description: item.description,
            isLimited: item.isLimited
          }));
        setItems(gameItems);
      }
    } catch (error) {
      console.error('Error cargando items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLimitedItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/products/ingame`);
      const data = await response.json();
      
      if (data.success) {
        const limitedItems = data.data
          .filter(item => item.isLimited && item.active)
          .map(item => ({
            id: item.id,
            game: item.game,
            name: item.itemName,
            category: item.itemType || 'Items',
            categoryOrder: item.categoryOrder !== undefined ? item.categoryOrder : 999,
            productOrder: item.productOrder !== undefined ? item.productOrder : 999,
            rarity: item.rarity || null,
            rarityColor: item.rarityColor || null,
            price: item.robuxAmount,
            priceUSD: item.price,
            image: item.image || 'https://via.placeholder.com/150',
            description: item.description,
            isLimited: item.isLimited
          }));
        
        setItems(limitedItems);
      }
    } catch (error) {
      console.error('Error cargando items limitados:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Generar categorías y rarezas dinámicamente desde los items
  // Ordenar categorías según categoryOrder
  const categoriesWithOrder = items.reduce((acc, item) => {
    if (!acc.find(c => c.name === item.category)) {
      acc.push({
        name: item.category,
        order: item.categoryOrder
      });
    }
    return acc;
  }, []);
  
  const sortedCategories = categoriesWithOrder
    .sort((a, b) => a.order - b.order)
    .map(c => c.name);
  
  const itemCategories = ['all', ...sortedCategories];
  const itemRarities = ['all', ...new Set(items.map(item => item.rarity).filter(Boolean))];
  
  const filteredAndSortedItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesRarity = selectedRarity === 'all' || item.rarity === selectedRarity;
      return matchesSearch && matchesCategory && matchesRarity;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.priceUSD - b.priceUSD;
        case 'price-desc':
          return b.priceUSD - a.priceUSD;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'popularity':
        default:
          // Ordenar por productOrder personalizado (menor número = primero)
          return a.productOrder - b.productOrder;
      }
    });

  const openProductModal = (item) => {
    setSelectedProduct(item);
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const addToCart = (item) => {
    // Convertir el item al formato esperado por el carrito global
    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.priceUSD,
      image: item.image,
      type: 'game-item',
      game: item.game,
      category: item.category,
      rarity: item.rarity,
      rarityColor: item.rarityColor,
      description: item.description
    };
    addToGlobalCart(cartItem);
  };

  const removeFromCart = (itemId) => {
    removeFromGlobalCart(itemId);
  };

  const updateQuantity = (itemId, delta) => {
    const item = cart.find(i => i.id === itemId);
    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity > 0) {
        updateGlobalQuantity(itemId, newQuantity);
      } else {
        removeFromGlobalCart(itemId);
      }
    }
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0);
  const totalPriceConverted = currentCurrency ? convertPrice(totalPrice) : totalPrice.toFixed(2);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getRarityColor = (item) => {
    // Si el item tiene un color personalizado, usarlo
    if (item && typeof item === 'object' && item.rarityColor) {
      return item.rarityColor;
    }
    
    // Si se pasó solo el string de rareza (compatibilidad)
    const rarity = typeof item === 'string' ? item : (item?.rarity || null);
    
    if (!rarity) return '#6b7280'; // Gris neutral para items sin rareza
    
    const colors = {
      'MYTHIC': '#ff0066',
      'LEGENDARY': '#ffaa00',
      'RARE': '#0099ff',
      'UNCOMMON': '#00cc66',
      'COMMON': '#999999'
    };
    return colors[rarity] || '#6b7280';
  };

  if (loading || !selectedGame) {
    return (
      <div className="game-items-page" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{ color: '#888', fontSize: '18px' }}>Cargando productos...</div>
      </div>
    );
  }

  return (
    <div className="game-items-page">
      {/* Overlay para cerrar sidebar de juegos en móvil/tablet */}
      {isTabletOrMobile && showMobileGamesSidebar && (
        <div
          className="sidebar-overlay active"
          onClick={() => setShowMobileGamesSidebar(false)}
        />
      )}

      {/* Sidebar de juegos */}
      <aside className={`games-sidebar ${isTabletOrMobile && showMobileGamesSidebar ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">Navegación</span>
          <button className="close-sidebar" onClick={() => isTabletOrMobile ? setShowMobileGamesSidebar(false) : navigate('/catalogo')}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs de navegación */}
        <div className="sidebar-tabs">
          <button 
            className={`sidebar-tab ${viewMode === 'games' ? 'active' : ''}`}
            onClick={() => setViewMode('games')}
          >
            🎮 Juegos
          </button>
          <button
            className={`sidebar-tab ${viewMode === 'limiteds' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('limiteds');
              navigate('/game/limiteds');
              if (isTabletOrMobile) setShowMobileGamesSidebar(false);
            }}
          >
            🔥 Limiteds
          </button>
        </div>
        
        <div className="games-list">
          {viewMode === 'games' ? (
            games.map(game => (
              <button
                key={game.id}
                className={`game-sidebar-item ${game.slug === gameSlug ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('games');
                  navigate(`/game/${game.slug}`);
                  if (isTabletOrMobile) setShowMobileGamesSidebar(false);
                }}
              >
                <img src={game.image} alt={game.name} className="game-sidebar-image" />
                <span className="game-sidebar-name">{game.name}</span>
                {game.slug === gameSlug && (
                  <span className="active-indicator" />
                )}
              </button>
            ))
          ) : (
            <div className="limiteds-info">
              <p>Mostrando todos los objetos limitados disponibles</p>
            </div>
          )}
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="game-content">
        {/* Header */}
        <div className="game-header">
          <button className="back-btn-game" onClick={() => navigate('/catalogo')}>
            <ArrowLeft size={20} />
          </button>
          {/* Botón para seleccionar juego en móvil/tablet */}
          {isTabletOrMobile && (
            <button
              className="mobile-game-selector-btn"
              onClick={() => setShowMobileGamesSidebar(true)}
            >
              <Gamepad2 size={20} />
              <span>Cambiar Juego</span>
            </button>
          )}
          <div className="game-title-section">
            <h1 className="game-title">{selectedGame.name}</h1>
            <p className="game-subtitle">Mostrando {filteredAndSortedItems.length} ítems</p>
          </div>
        </div>

        {/* Controles */}
        <div className="game-controls">
          <div className="search-bar-game">
            <Search size={14} />
            <input
              type="text"
              placeholder="Buscar ítems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="control-buttons">
            <button className="control-btn active">
              <LayoutGrid size={18} />
              Panel
            </button>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="control-btn sort-select-game"
            >
              <option value="popularity">🔥 Popularidad</option>
              <option value="price-asc">💰 Menor Precio</option>
              <option value="price-desc">💰 Mayor Precio</option>
              <option value="name-asc">🔤 A-Z</option>
              <option value="name-desc">🔤 Z-A</option>
            </select>
            
            {/* Selector de moneda - Oculto si solo hay una moneda */}
            {currencies.length > 1 && (
              <div className="currency-selector">
                <button 
                  className="control-btn currency-btn" 
                  onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
                >
                  {currentCurrency ? (
                    <>{currentCurrency.flag} {currentCurrency.code}</>
                  ) : (
                    '$ USD'
                  )}
                </button>
                {showCurrencyMenu && (
                  <div className="currency-dropdown">
                  {currencies.map((currency) => (
                    <button
                      key={currency.code}
                      className={`currency-option ${selectedCurrency === currency.code ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCurrency(currency.code);
                        setShowCurrencyMenu(false);
                      }}
                    >
                      <span className="currency-flag">{currency.flag}</span>
                      <span className="currency-name">{currency.name}</span>
                      <span className="currency-code">{currency.code}</span>
                    </button>
                  ))}
                  </div>
                )}
              </div>
            )}
            <div className="rarity-selector">
              <button 
                className="control-btn rarity-btn" 
                onClick={() => setShowRarityMenu(!showRarityMenu)}
              >
                <Filter size={18} />
                {selectedRarity === 'all' ? 'Rareza' : selectedRarity}
              </button>
              {showRarityMenu && itemRarities.length > 0 && (
                <div className="rarity-dropdown">
                  {itemRarities.map((rarity) => (
                    <button
                      key={rarity}
                      className={`rarity-option ${selectedRarity === rarity ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedRarity(rarity);
                        setShowRarityMenu(false);
                      }}
                      style={rarity !== 'all' ? {
                        borderLeft: `4px solid ${getRarityColor(rarity)}`
                      } : {}}
                    >
                      <span className="rarity-name">
                        {rarity === 'all' ? '🔥 Todas' : rarity}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categorías */}
        {itemCategories.length > 1 && (
          <div className="categories-tabs">
            <button
              className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              🔥 Todos
            </button>
            {itemCategories.filter(cat => cat !== 'all').map(cat => (
              <button
                key={cat}
                className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Grid de items */}
        <div className="items-grid">
          {filteredAndSortedItems.length === 0 ? (
            <div className="no-items-message">
              <Package size={64} style={{ color: '#444', marginBottom: '16px' }} />
              <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>
                No hay productos disponibles
              </h3>
              <p style={{ color: '#888', fontSize: '14px' }}>
                {items.length === 0 
                  ? 'Este juego aún no tiene productos agregados.'
                  : 'No se encontraron productos con los filtros seleccionados. Intenta cambiar los filtros o la búsqueda.'}
              </p>
            </div>
          ) : (
            filteredAndSortedItems.map(item => (
              <div 
                key={item.id} 
                className="item-card"
                onClick={() => openProductModal(item)}
                style={{ cursor: 'pointer' }}
              >
              <div className="item-image-container">
                <img src={item.image} alt={item.name} className="item-image" />
                {item.rarity && (
                  <span 
                    className="item-rarity"
                    style={{ 
                      background: `linear-gradient(135deg, ${getRarityColor(item)}22, ${getRarityColor(item)}44)`,
                      borderColor: getRarityColor(item)
                    }}
                  >
                    {item.rarity}
                  </span>
                )}
              </div>
              
              <div className="item-info">
                <h3 className="item-name">{item.name}</h3>
                {/* Mostrar itemType como badge */}
                {item.category && (
                  <span className="classification-badge-text">
                    {item.category}
                  </span>
                )}
              </div>
              
              <div className="item-footer">
                <span className="item-price">
                  {currentCurrency ? (
                    <>
                      {currentCurrency.symbol}{formatPriceWithDecimals(convertPrice(item.priceUSD))} <span className="currency">{currentCurrency.code}</span>
                    </>
                  ) : (
                    `$${item.priceUSD}`
                  )}
                </span>
                <button 
                  className="add-to-cart-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addToCart(item);
                  }}
                  title="Agregar al carrito"
                >
                  <ShoppingCart size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            ))
          )}
        </div>
      </main>

      {/* Botón flotante del carrito en móvil */}
      {isMobile && cart.length > 0 && (
        <button 
          className="floating-cart-btn"
          onClick={() => setShowMobileCart(true)}
        >
          <ShoppingCart size={28} strokeWidth={2.5} />
          {totalItems > 0 && (
            <span className="floating-cart-badge">{totalItems}</span>
          )}
        </button>
      )}

      {/* Overlay para cerrar sidebar en móvil */}
      {isMobile && showMobileCart && (
        <div 
          className="sidebar-overlay active"
          onClick={() => setShowMobileCart(false)}
        />
      )}

      {/* Carrito lateral */}
      {(showCart || (isMobile && showMobileCart)) && (
        <aside className={`cart-sidebar ${isMobile && showMobileCart ? 'open' : ''}`}>
          <div className="cart-header">
            <div className="cart-title">
              <ShoppingCart size={20} />
              <span>Tu Carrito</span>
              {totalItems > 0 && (
                <span className="cart-count">{totalItems}</span>
              )}
            </div>
            {isMobile && (
              <button 
                className="close-sidebar"
                onClick={() => setShowMobileCart(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <X size={24} />
              </button>
            )}
          </div>

          {cart.length > 0 ? (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <img src={item.image} alt={item.name} className="cart-item-image" />
                    <div className="cart-item-info">
                      <h4 className="cart-item-name">{item.name}</h4>
                      <p className="cart-item-game">{selectedGame.name}</p>
                      <span className="cart-item-price">
                        {currentCurrency ? (
                          <>
                            {currentCurrency.symbol}{formatPriceWithDecimals(convertPrice(item.priceUSD * item.quantity))} {currentCurrency.code}
                          </>
                        ) : (
                          `$${(item.priceUSD * item.quantity).toFixed(2)}`
                        )}
                      </span>
                    </div>
                    <div className="cart-item-actions">
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button 
                      className="remove-item-btn"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-footer">
                <div className="cart-total">
                  <span className="total-label">Total</span>
                  <span className="total-amount">
                    {currentCurrency ? (
                      <>{currentCurrency.symbol}{formatPriceWithDecimals(totalPriceConverted)} {currentCurrency.code}</>
                    ) : (
                      `$${totalPrice.toFixed(2)}`
                    )}
                  </span>
                </div>

                <button 
                  className="checkout-btn"
                  onClick={() => {
                    navigate('/checkout-items');
                  }}
                  disabled={cart.length === 0}
                >
                  Ir a Pagar →
                </button>
              </div>
            </>
          ) : (
            <div className="empty-cart">
              <ShoppingCart size={48} />
              <p>Tu carrito está vacío</p>
              <span>Agrega ítems para comenzar</span>
            </div>
          )}
        </aside>
      )}


      {/* Product Detail Modal */}
      {showProductModal && selectedProduct && (
        <div className="product-modal-overlay" onClick={closeProductModal}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeProductModal}>
              <X size={24} />
            </button>

            <div className="product-modal-content">
              <div className="product-modal-image">
                <img src={selectedProduct.image} alt={selectedProduct.name} />
                {selectedProduct.rarity && (
                  <span 
                    className="product-modal-rarity"
                    style={{ 
                      background: `linear-gradient(135deg, ${getRarityColor(selectedProduct)}22, ${getRarityColor(selectedProduct)}44)`,
                      borderColor: getRarityColor(selectedProduct)
                    }}
                  >
                    {selectedProduct.rarity}
                  </span>
                )}
              </div>

              <div className="product-modal-details">
                <h2 className="product-modal-title">{selectedProduct.name}</h2>
                <p className="product-modal-category">{selectedProduct.category}</p>

                {selectedProduct.description && (
                  <div className="product-modal-description">
                    <h3>Descripción</h3>
                    <p>{selectedProduct.description}</p>
                  </div>
                )}

                <div className="product-modal-info">
                  <div className="info-item">
                    <span className="info-label">Juego:</span>
                    <span className="info-value">
                      {selectedProduct.isLimited ? 'Roblox' : (selectedGame?.name || 'N/A')}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Categoría:</span>
                    <span className="info-value">{selectedProduct.category || 'General'}</span>
                  </div>
                  {!selectedProduct.isLimited && selectedProduct.rarity && (
                    <div className="info-item">
                      <span className="info-label">Rareza:</span>
                      <span className="info-value" style={{ color: getRarityColor(selectedProduct) }}>
                        {selectedProduct.rarity}
                      </span>
                    </div>
                  )}
                </div>

                <div className="product-modal-price">
                  <span className="price-label">Precio:</span>
                  <span className="price-amount">
                    {currentCurrency ? (
                      <>
                        {currentCurrency.symbol}{formatPriceWithDecimals(convertPrice(selectedProduct.priceUSD))} <span className="price-currency">{currentCurrency.code}</span>
                      </>
                    ) : (
                      `$${selectedProduct.priceUSD}`
                    )}
                  </span>
                </div>

                <div className="product-modal-actions">
                  <button 
                    className="btn-add-to-cart-modal"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(selectedProduct);
                      closeProductModal();
                    }}
                  >
                    <ShoppingCart size={20} />
                    Agregar al Carrito
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameItems;
