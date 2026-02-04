import { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { gamePasses, popularGames } from '../api/mockData';
import './GamePasses.css';

const GamePasses = () => {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    setTimeout(() => {
      setPasses(gamePasses);
      setLoading(false);
    }, 300);
  }, []);

  const filteredPasses = passes.filter((pass) => {
    const matchesSearch = pass.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pass.game.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGame = selectedGame === 'all' || pass.game === selectedGame;
    return matchesSearch && matchesGame;
  });

  const sortedPasses = [...filteredPasses].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      default:
        return b.sales - a.sales;
    }
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando Game Passes...</p>
      </div>
    );
  }

  return (
    <div className="gamepasses-page">
      <div className="page-header">
        <h1>Game Passes</h1>
        <p>
          Desbloquea contenido exclusivo y ventajas en tus juegos favoritos de Roblox
        </p>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar game passes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>
            <Filter size={16} />
            Juego:
          </label>
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
          >
            <option value="all">Todos los juegos</option>
            {[...new Set(gamePasses.map((p) => p.game))].map((game) => (
              <option key={game} value={game}>
                {game}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>
            <SlidersHorizontal size={16} />
            Ordenar:
          </label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="popular">Mas Vendidos</option>
            <option value="price-low">Precio: Menor a Mayor</option>
            <option value="price-high">Precio: Mayor a Menor</option>
            <option value="rating">Mejor Calificados</option>
          </select>
        </div>
      </div>

      <div className="results-info">
        <span>{sortedPasses.length} game passes encontrados</span>
      </div>

      <div className="gamepasses-grid">
        {sortedPasses.map((pass) => (
          <ProductCard key={pass.id} product={pass} type="gamepass" />
        ))}
      </div>

      {sortedPasses.length === 0 && (
        <div className="no-results">
          <h3>No se encontraron resultados</h3>
          <p>Intenta con otros filtros o terminos de busqueda</p>
        </div>
      )}

      <div className="games-quick-access">
        <h2>Juegos Populares</h2>
        <div className="games-pills">
          {popularGames.slice(0, 6).map((game) => (
            <button
              key={game.id}
              className={`game-pill ${selectedGame === game.name ? 'active' : ''}`}
              onClick={() => setSelectedGame(selectedGame === game.name ? 'all' : game.name)}
            >
              {game.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GamePasses;
