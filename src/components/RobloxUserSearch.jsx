import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Check, X, User } from 'lucide-react';
import { searchRobloxUser, getRobloxUserThumbnail } from '../api/robloxApi';
import './RobloxUserSearch.css';

const RobloxUserSearch = ({ onUserSelect, selectedUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');
  const searchRef = useRef(null);

  // Cerrar dropdown cuando se hace click afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Función para buscar usuarios (solo cuando se hace click)
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (searchQuery.length < 3) {
      setError('Ingresa al menos 3 caracteres');
      return;
    }

    setLoading(true);
    setError('');
    setSearchResults([]);
    setShowDropdown(false);

    try {
      const results = await searchRobloxUser(searchQuery);
      
      if (!results) {
        setError('Demasiadas búsquedas. Espera unos minutos.');
        setSearchResults([]);
      } else if (results.length === 0) {
        setError('No se encontraron usuarios');
        setSearchResults([]);
      } else {
        // Obtener thumbnails para todos los resultados
        const resultsWithThumbnails = await Promise.all(
          results.map(async (user) => {
            const thumbnail = await getRobloxUserThumbnail(user.id, '150x150');
            return {
              ...user,
              avatarUrl: thumbnail
            };
          })
        );
        
        setSearchResults(resultsWithThumbnails);
        setShowDropdown(true);
      }
    } catch (err) {
      setError('Error al buscar usuario');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    onUserSelect(user);
    setSearchQuery(user.name);
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    onUserSelect(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="roblox-user-search" ref={searchRef}>
      <label className="search-label">
        Usuario de Roblox
        <span className="required">*</span>
      </label>
      
      <div className={`search-input-container ${selectedUser ? 'has-selection' : ''}`}>
        {selectedUser ? (
          <div className="selected-user">
            <div className="selected-user-info">
              <img 
                src={selectedUser.avatarUrl || '/default-avatar.png'} 
                alt={selectedUser.name}
                className="selected-avatar"
              />
              <div className="selected-details">
                <span className="selected-name">{selectedUser.name}</span>
                <span className="selected-display-name">{selectedUser.displayName}</span>
              </div>
            </div>
            <button 
              type="button"
              className="clear-btn"
              onClick={handleClearSelection}
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSearch} className="search-form">
              <div className="input-wrapper">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="Escribe tu usuario de Roblox..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button 
                type="submit" 
                className="search-button"
                disabled={loading || searchQuery.length < 3}
              >
                {loading ? (
                  <Loader2 size={20} className="loading-icon" />
                ) : (
                  <>
                    <Search size={20} />
                    Buscar
                  </>
                )}
              </button>
            </form>

            {showDropdown && searchResults.length > 0 && (
              <div className="search-dropdown">
                <div className="dropdown-header">
                  {searchResults.length} usuarios encontrados
                </div>
                <div className="search-results">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="result-item"
                      onClick={() => handleSelectUser(user)}
                    >
                      <img 
                        src={user.avatarUrl || '/default-avatar.png'} 
                        alt={user.name}
                        className="result-avatar"
                      />
                      <div className="result-info">
                        <span className="result-name">{user.name}</span>
                        <span className="result-display-name">{user.displayName}</span>
                      </div>
                      <Check size={18} className="check-icon" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="search-error">
                <X size={16} />
                {error}
              </div>
            )}
          </>
        )}
      </div>

      {selectedUser && (
        <div className="user-verified">
          <Check size={16} />
          Usuario verificado
        </div>
      )}
    </div>
  );
};

export default RobloxUserSearch;
