import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, Grid, List, ChevronDown, ArrowUpDown, ChevronRight, DollarSign, Zap, CheckCircle } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { API_CONFIG } from '../config/api';
import {
  robuxPackages,
  gamePasses,
  limitedItems,
  giftCards,
  premiumSubscriptions,
  popularGames
} from '../api/mockData';
import './Catalogo.css';
import './CatalogoNew.css';

const Catalogo = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevancia');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/categories`);
      const data = await response.json();
      if (data.success) {
        // Solo mostrar categorías activas
        setCategories(data.data.filter(cat => cat.active));
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const games = categories.map(cat => ({
    id: cat.id,
    slug: cat.slug,
    name: cat.name,
    image: cat.image,
    category: 'Items in-game'
  }));

  const filteredGames = games.filter(game => 
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="catalogo-page-new">
      {/* Banner de Robux */}
      <div className="robux-banner">
        <div className="banner-content">
          <h1 className="banner-title">Robux</h1>
          <p className="banner-description">
            Compra Robux al mejor precio del mercado.<br />
            Entrega rápida, segura y garantizada.
          </p>
          <div className="banner-features">
            <span className="banner-feature">
              <DollarSign size={18} />
              Mejor precio
            </span>
            <span className="banner-feature">
              <Zap size={18} />
              Entrega rápida
            </span>
            <span className="banner-feature">
              <CheckCircle size={18} />
              +50,000 órdenes
            </span>
          </div>
        </div>
        <div className="banner-cta-section">
          <div className="banner-price">
            <span className="price-label">Paquetes desde</span>
            <span className="price-amount">30</span>
            <span className="price-detail">hasta 30,000+ Robux</span>
          </div>
          <Link to="/robux" className="banner-btn">
            COMPRAR ROBUX
            <ChevronRight size={20} />
          </Link>
        </div>
      </div>

      {/* Items In-Game Section */}
      <div className="items-ingame-section">
        <div className="section-header-catalog">
          <div>
            <h2 className="section-title-catalog">Items In-Game</h2>
            <p className="section-subtitle-catalog">Compra items, frutas, gamepasses y más para tus juegos favoritos</p>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="catalog-controls">
          <div className="search-bar-catalog">
            <Search size={20} />
            <input
              type="text"
              placeholder="Busca un juego..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="sort-dropdown">
            <ArrowUpDown size={18} />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="relevancia">Relevancia</option>
              <option value="nombre">Nombre</option>
              <option value="nuevo">Más nuevo</option>
            </select>
          </div>
        </div>

        {/* Games Grid */}
        {loading ? (
          <div className="games-grid">
            <p style={{color: '#888', textAlign: 'center', gridColumn: '1 / -1'}}>Cargando categorías...</p>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="games-grid">
            <p style={{color: '#888', textAlign: 'center', gridColumn: '1 / -1'}}>
              {searchQuery ? 'No se encontraron juegos' : 'No hay categorías disponibles'}
            </p>
          </div>
        ) : (
          <div className="games-grid">
            {filteredGames.map((game) => (
            <Link to={`/game/${game.slug}`} key={game.id} className="game-card">
              <div className="game-image">
                <img src={game.image} alt={game.name} />
              </div>
              <div className="game-info">
                <h3 className="game-name">{game.name}</h3>
                <span className="game-category">{game.category}</span>
              </div>
              <button className="game-btn">
                Ver
                <ChevronRight size={16} />
              </button>
            </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalogo;
