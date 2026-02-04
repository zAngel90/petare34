import { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, Crown } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { limitedItems } from '../api/mockData';
import './Limiteds.css';

const Limiteds = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortBy, setSortBy] = useState('trending');

  useEffect(() => {
    setTimeout(() => {
      setItems(limitedItems);
      setLoading(false);
    }, 300);
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = selectedRarity === 'all' || item.rarity === selectedRarity;
    return matchesSearch && matchesRarity;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rap':
        return b.rap - a.rap;
      default:
        return b.trending ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando items limitados...</p>
      </div>
    );
  }

  return (
    <div className="limiteds-page">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <Crown className="header-icon" size={32} />
            Items Limitados
          </h1>
          <p>
            Coleccion exclusiva de items raros y limitados de Roblox.
            Encuentra Dominus, Valkyries y mas al mejor precio.
          </p>
        </div>
      </div>

      <div className="trending-banner">
        <TrendingUp size={20} />
        <span>Items en tendencia con alta demanda disponibles ahora</span>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar items limitados..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>
            <Filter size={16} />
            Rareza:
          </label>
          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
          >
            <option value="all">Todas</option>
            <option value="Legendary">Legendary</option>
            <option value="Epic">Epic</option>
            <option value="Rare">Rare</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Ordenar:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="trending">Trending</option>
            <option value="price-low">Precio: Menor a Mayor</option>
            <option value="price-high">Precio: Mayor a Menor</option>
            <option value="rap">RAP: Mayor a Menor</option>
          </select>
        </div>
      </div>

      <div className="rarity-pills">
        {['all', 'Legendary', 'Epic', 'Rare'].map((rarity) => (
          <button
            key={rarity}
            className={`rarity-pill ${rarity.toLowerCase()} ${selectedRarity === rarity ? 'active' : ''}`}
            onClick={() => setSelectedRarity(rarity)}
          >
            {rarity === 'all' ? 'Todos' : rarity}
          </button>
        ))}
      </div>

      <div className="results-info">
        <span>{sortedItems.length} items encontrados</span>
      </div>

      <div className="limiteds-grid">
        {sortedItems.map((item) => (
          <ProductCard key={item.id} product={item} type="limited" />
        ))}
      </div>

      <div className="info-section">
        <h2>Sobre los Items Limitados</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>¿Que es RAP?</h3>
            <p>
              RAP (Recent Average Price) es el precio promedio reciente al que
              se ha vendido un item. Es un indicador del valor real del item.
            </p>
          </div>
          <div className="info-card">
            <h3>¿Que significa Demand?</h3>
            <p>
              La demanda indica que tan buscado es un item. Alta demanda significa
              que es mas facil de vender y puede aumentar de valor.
            </p>
          </div>
          <div className="info-card">
            <h3>¿Por que comprar aqui?</h3>
            <p>
              Ofrecemos precios competitivos, verificacion de autenticidad y
              transferencia segura a tu cuenta de Roblox.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Limiteds;
