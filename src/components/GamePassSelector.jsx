import { useState, useEffect } from 'react';
import { Search, Loader2, Check, X, Gamepad2, ExternalLink } from 'lucide-react';
import { getUserPlaces, getPlaceGamePasses, getGamePassById } from '../api/robloxApi';
import './GamePassSelector.css';

const GamePassSelector = ({ userId, selectedAmount, onGamePassSelect, selectedGamePass }) => {
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [gamepasses, setGamepasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingGamepasses, setLoadingGamepasses] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualId, setManualId] = useState('');
  const [loadingManual, setLoadingManual] = useState(false);
  const [error, setError] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserPlaces();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedPlace) {
      loadPlaceGamePasses();
    }
  }, [selectedPlace]);

  const loadUserPlaces = async () => {
    setLoading(true);
    setError('');
    setPlaces([]);
    setSelectedPlace(null);
    setGamepasses([]);
    
    try {
      const userPlaces = await getUserPlaces(userId);
      setPlaces(userPlaces);
      
      if (userPlaces.length === 0) {
        setError('Este usuario no tiene juegos públicos.');
        setShowManualInput(true);
      } else if (userPlaces.length === 1) {
        // Si solo tiene 1 place, seleccionarlo automáticamente
        setSelectedPlace(userPlaces[0]);
      }
    } catch (err) {
      setError('Error al cargar juegos');
      setShowManualInput(true);
    } finally {
      setLoading(false);
    }
  };

  const loadPlaceGamePasses = async () => {
    setLoadingGamepasses(true);
    setError('');
    setGamepasses([]);
    
    try {
      const passes = await getPlaceGamePasses(selectedPlace.id);
      setGamepasses(passes);
      
      if (passes.length === 0) {
        setError('Este juego no tiene gamepasses.');
        setShowManualInput(true);
      }
    } catch (err) {
      setError('Error al cargar gamepasses');
      setShowManualInput(true);
    } finally {
      setLoadingGamepasses(false);
    }
  };

  const handleManualIdSubmit = async (e) => {
    e.preventDefault();
    if (!manualId || isNaN(manualId)) {
      setError('Ingresa un ID válido');
      return;
    }

    setLoadingManual(true);
    setError('');
    try {
      const gamepass = await getGamePassById(manualId);
      if (gamepass) {
        onGamePassSelect({
          ...gamepass,
          requiredPrice: requiredGamepassPrice
        });
        setManualId('');
        setShowManualInput(false);
      } else {
        setError('Gamepass no encontrado');
      }
    } catch (err) {
      setError('Error al buscar gamepass');
    } finally {
      setLoadingManual(false);
    }
  };

  // Calcular precio requerido del gamepass basado en la cantidad de Robux (con comisión del 30%)
  const requiredGamepassPrice = selectedAmount ? Math.ceil(selectedAmount / 0.7) : 0;
  
  console.log('🔍 DEBUG GamePassSelector:', {
    selectedAmount,
    requiredGamepassPrice,
    gamepasses: gamepasses.map(g => ({ id: g.id, name: g.name, price: g.price, type: typeof g.price }))
  });
  
  // Filtrar y validar gamepasses
  const filteredGamepasses = gamepasses
    .filter(gp => gp.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .map(gp => {
      const gpPrice = typeof gp.price === 'number' ? gp.price : parseInt(gp.price) || 0;
      const requiredPrice = requiredGamepassPrice;
      const isValid = gpPrice === requiredPrice;
      
      console.log(`🎮 Gamepass "${gp.name}": price=${gpPrice}, required=${requiredPrice}, valid=${isValid}`);
      
      return {
        ...gp,
        price: gpPrice,
        isValid: isValid,
        priceDifference: gpPrice - requiredPrice
      };
    });
  
  const hasValidGamepass = filteredGamepasses.some(gp => gp.isValid);

  if (!userId) {
    return (
      <div className="gamepass-selector-empty">
        <Gamepad2 size={32} />
        <p>Primero selecciona un usuario de Roblox</p>
      </div>
    );
  }

  return (
    <div className="gamepass-selector">
      {/* Mostrar selector de Place primero */}
      {!selectedPlace && !showManualInput && (
        <>
          <div className="selector-header">
            <label className="selector-label">
              Selecciona un juego
              <span className="required">*</span>
            </label>
            <button
              type="button"
              className="manual-toggle"
              onClick={() => setShowManualInput(true)}
            >
              ID manual
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <Loader2 size={24} className="spinning" />
              <span>Cargando juegos...</span>
            </div>
          ) : places.length > 0 ? (
            <div className="places-list">
              {places.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  className="place-item"
                  onClick={() => setSelectedPlace(place)}
                >
                  {place.thumbnail && (
                    <img 
                      src={place.thumbnail} 
                      alt={place.name}
                      className="place-thumb"
                    />
                  )}
                  <div className="place-item-info">
                    <span className="place-name">{place.name}</span>
                    {place.description && (
                      <span className="place-description">{place.description}</span>
                    )}
                  </div>
                  <Check size={18} className="check-icon" />
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Gamepad2 size={32} />
              <p className="empty-title">No se encontraron juegos</p>
              <button
                type="button"
                className="manual-btn"
                onClick={() => setShowManualInput(true)}
              >
                Ingresar ID del Game Pass
              </button>
            </div>
          )}
        </>
      )}

      {/* Mostrar selector de GamePass después de seleccionar Place */}
      {selectedPlace && !showManualInput && (
        <>
          <div className="selector-header">
            <label className="selector-label">
              Game Pass
              <span className="required">*</span>
            </label>
            <div className="header-actions">
              <button
                type="button"
                className="back-btn-small"
                onClick={() => {
                  setSelectedPlace(null);
                  setGamepasses([]);
                  onGamePassSelect(null);
                }}
              >
                ← Cambiar juego
              </button>
              <button
                type="button"
                className="manual-toggle"
                onClick={() => setShowManualInput(true)}
              >
                ID manual
              </button>
            </div>
          </div>

          <div className="selected-place-info">
            <span className="selected-place-label">Juego seleccionado:</span>
            <span className="selected-place-name">{selectedPlace.name}</span>
          </div>

          {/* Información del precio requerido */}
          {requiredGamepassPrice > 0 && (
            <div className="price-requirement-info">
              <div className="requirement-header">
                <span className="requirement-icon">ℹ️</span>
                <span className="requirement-title">Precio requerido del Game Pass</span>
              </div>
              <div className="requirement-body">
                <p className="requirement-text">
                  Para recibir <strong>{selectedAmount.toLocaleString()} Robux</strong>, 
                  tu gamepass debe costar exactamente:
                </p>
                <div className="required-price">
                  <img src="/robux-logo.svg" alt="R$" className="robux-icon-small" />
                  <span className="price-value">{requiredGamepassPrice.toLocaleString()}</span>
                </div>
                <p className="requirement-formula">
                  Fórmula: {selectedAmount.toLocaleString()} ÷ 0.7 = {requiredGamepassPrice.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {selectedGamePass && !showManualInput ? (
        <div className="selected-gamepass">
          <div className="gamepass-info">
            {selectedGamePass.thumbnail && (
              <img 
                src={selectedGamePass.thumbnail} 
                alt={selectedGamePass.name}
                className="gamepass-thumb"
              />
            )}
            <div className="gamepass-details">
              <span className="gamepass-name">{selectedGamePass.name}</span>
              <span className="gamepass-id">ID: {selectedGamePass.id}</span>
            </div>
          </div>
          <button 
            type="button"
            className="clear-btn"
            onClick={() => onGamePassSelect(null)}
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <>
          {/* Input manual */}
          {showManualInput ? (
            <form onSubmit={handleManualIdSubmit} className="manual-input-form">
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Ingresa el ID del Game Pass..."
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  disabled={loadingManual}
                />
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loadingManual || !manualId}
                >
                  {loadingManual ? <Loader2 size={18} className="spinning" /> : <Check size={18} />}
                </button>
              </div>
              <a 
                href={`https://www.roblox.com/games/${userId}/game#!/store`}
                target="_blank"
                rel="noopener noreferrer"
                className="help-link"
              >
                <ExternalLink size={14} />
                ¿Cómo encontrar el ID?
              </a>
            </form>
          ) : (
            <>
              {loadingGamepasses ? (
                <div className="loading-state">
                  <Loader2 size={24} className="spinning" />
                  <span>Cargando gamepasses...</span>
                </div>
              ) : filteredGamepasses.length > 0 ? (
                <>
                  <div className="search-wrapper">
                    <Search size={18} />
                    <input
                      type="text"
                      placeholder="Buscar gamepass..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="gamepasses-list">
                    {!hasValidGamepass && requiredGamepassPrice > 0 && (
                      <div className="no-valid-gamepass-warning">
                        <span className="warning-icon">⚠️</span>
                        <div className="warning-content">
                          <strong>No hay gamepass con el precio correcto</strong>
                          <p>Debes crear un gamepass con precio de <strong>{requiredGamepassPrice.toLocaleString()} Robux</strong></p>
                        </div>
                      </div>
                    )}
                    
                    {filteredGamepasses.map((gamepass) => (
                      <button
                        key={gamepass.id}
                        type="button"
                        className={`gamepass-item ${!gamepass.isValid ? 'disabled' : ''} ${gamepass.isValid ? 'valid' : ''}`}
                        onClick={() => gamepass.isValid && onGamePassSelect({
                          ...gamepass,
                          requiredPrice: requiredGamepassPrice
                        })}
                        disabled={!gamepass.isValid}
                      >
                        {gamepass.thumbnail && (
                          <img 
                            src={gamepass.thumbnail} 
                            alt={gamepass.name}
                            className="gamepass-thumb"
                          />
                        )}
                        <div className="gamepass-item-info">
                          <span className="gamepass-name">{gamepass.name}</span>
                          <div className="gamepass-meta">
                            <span className={`gamepass-price ${gamepass.isValid ? 'valid-price' : 'invalid-price'}`}>
                              <img src="/robux-logo.svg" alt="R$" className="robux-icon-tiny" />
                              {gamepass.price || 0}
                              {gamepass.isValid && <span className="valid-badge">✓ Correcto</span>}
                              {!gamepass.isValid && gamepass.priceDifference !== 0 && (
                                <span className="invalid-badge">
                                  {gamepass.priceDifference > 0 ? '+' : ''}{gamepass.priceDifference}
                                </span>
                              )}
                            </span>
                            <span className="gamepass-id">ID: {gamepass.id}</span>
                          </div>
                        </div>
                        {gamepass.isValid ? (
                          <Check size={18} className="check-icon valid-icon" />
                        ) : (
                          <X size={18} className="check-icon invalid-icon" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              ) : gamepasses.length === 0 && !loading ? (
                <div className="empty-state">
                  <Gamepad2 size={32} />
                  <p className="empty-title">No se encontraron gamepasses automáticamente</p>
                  <p className="empty-subtitle">Puedes ingresar el ID del gamepass manualmente</p>
                  <button
                    type="button"
                    className="manual-btn"
                    onClick={() => setShowManualInput(true)}
                  >
                    Ingresar ID del Game Pass
                  </button>
                  <a 
                    href="https://www.roblox.com/develop"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="help-link-small"
                  >
                    <ExternalLink size={14} />
                    Ver mis Game Passes en Roblox
                  </a>
                </div>
              ) : null}
            </>
          )}
        </>
      )}

      {error && (
        <div className="error-message">
          <X size={16} />
          {error}
        </div>
      )}

      {selectedGamePass && (
        <div className="gamepass-verified">
          <Check size={16} />
          Game Pass seleccionado
        </div>
      )}
    </div>
  );
};

export default GamePassSelector;
