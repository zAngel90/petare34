import { useState, useEffect } from 'react';
import { ExternalLink, Check, X, Clock, Zap, Loader2 } from 'lucide-react';
import './CommunityVerification.css';
import { API_CONFIG, buildURL } from '../config/api';

const CommunityVerification = ({ robloxUserId, robloxUsername, onVerificationChange }) => {
  const [communities, setCommunities] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [currentCheck, setCurrentCheck] = useState(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Cargar lista de comunidades
  useEffect(() => {
    fetchCommunities();
  }, []);

  // Cargar estado de verificación si hay usuario
  useEffect(() => {
    if (robloxUserId) {
      fetchVerificationStatus();
    }
  }, [robloxUserId]);

  const fetchCommunities = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMUNITY.LIST}`);
      const data = await response.json();
      
      if (data.success) {
        setCommunities(data.data.communities);
      }
    } catch (error) {
      console.error('Error cargando comunidades:', error);
    }
  };

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMUNITY.STATUS}/${robloxUserId}`);
      const data = await response.json();
      
      if (data.success) {
        setVerificationStatus(data.data);
        if (onVerificationChange) {
          onVerificationChange(data.data);
        }
      }
    } catch (error) {
      console.error('Error cargando estado:', error);
    }
  };

  const checkCurrentMembership = async () => {
    if (!robloxUserId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMUNITY.CHECK}/${robloxUserId}`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentCheck(data.data);
      }
    } catch (error) {
      console.error('Error verificando membresía:', error);
    } finally {
      setLoading(false);
    }
  };

  const registerForVerification = async () => {
    if (!robloxUserId) return;
    
    setRegistering(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMUNITY.REGISTER}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          robloxUserId,
          robloxUsername
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ ¡Registro exitoso! Comenzamos a contar tus días.');
        fetchVerificationStatus();
        setCurrentCheck(null);
      } else {
        if (data.data?.missing) {
          setCurrentCheck({
            allJoined: false,
            joinedCount: data.data.joined,
            totalRequired: data.data.required,
            details: data.data.missing.map(m => ({
              ...m,
              isMember: false
            }))
          });
        }
        alert(`❌ ${data.error}\n\nTe faltan ${data.data?.required - data.data?.joined} comunidades.`);
      }
    } catch (error) {
      console.error('Error registrando:', error);
      alert('Error al registrar. Intenta de nuevo.');
    } finally {
      setRegistering(false);
    }
  };

  if (!robloxUserId) {
    return (
      <div className="community-verification">
        <div className="verification-header">
          <Clock size={24} />
          <h3>Entrega Instantánea por Comunidad</h3>
        </div>
        <p className="verification-description">
          Primero selecciona tu usuario de Roblox para verificar tu estado en las comunidades.
        </p>
      </div>
    );
  }

  return (
    <div className="community-verification">
      <div className="verification-header">
        {verificationStatus?.isFullyVerified ? (
          <Zap size={24} className="verified-icon" />
        ) : (
          <Clock size={24} />
        )}
        <h3>Entrega Instantánea por Comunidad</h3>
      </div>

      {/* Estado de verificación */}
      {verificationStatus?.isRegistered && (
        <div className={`verification-status ${verificationStatus.isFullyVerified ? 'verified' : ''}`}>
          <div className="status-header">
            <span className="status-label">Estado de Verificación</span>
            {verificationStatus.isFullyVerified ? (
              <span className="status-badge verified">✓ Verificado</span>
            ) : (
              <span className="status-badge pending">En progreso</span>
            )}
          </div>
          
          <div className="days-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${(verificationStatus.daysVerified / verificationStatus.daysRequired) * 100}%` 
                }}
              />
            </div>
            <div className="progress-text">
              <span className="days-count">
                {verificationStatus.daysVerified} / {verificationStatus.daysRequired} días
              </span>
              {verificationStatus.isFullyVerified ? (
                <span className="delivery-type instant">⚡ Entrega instantánea</span>
              ) : (
                <span className="delivery-type pending">🕐 {verificationStatus.deliveryTime}</span>
              )}
            </div>
          </div>

          {!verificationStatus.isFullyVerified && (
            <p className="days-remaining">
              Te faltan {verificationStatus.daysRequired - verificationStatus.daysVerified} días para entrega instantánea
            </p>
          )}
        </div>
      )}

      {/* Descripción */}
      <div className="verification-info">
        <p className="info-text">
          Con este método, podrás recibir tus Robux <strong>al instante</strong> a través de nuestras comunidades en Roblox.
        </p>
        <div className="info-steps">
          <span>1️⃣ Únete a las 10 comunidades</span>
          <span>2️⃣ Permanece 14 días</span>
          <span>3️⃣ ¡Compras instantáneas!</span>
        </div>
      </div>

      {/* Verificar membresía actual */}
      <button 
        className="verify-button"
        onClick={checkCurrentMembership}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="spinning" />
            Verificando...
          </>
        ) : (
          <>
            <Check size={18} />
            Verificar en qué comunidades estoy
          </>
        )}
      </button>

      {/* Resultado de verificación actual */}
      {currentCheck && (
        <div className="current-status">
          <div className="status-summary">
            <span className="joined-count">
              {currentCheck.joinedCount} / {currentCheck.totalRequired}
            </span>
            <span className="joined-text">comunidades unidas</span>
          </div>

          {currentCheck.allJoined ? (
            <div className="all-joined">
              <Check size={20} />
              <span>¡Estás en todas las comunidades!</span>
              {!verificationStatus?.isRegistered && (
                <button 
                  className="register-button"
                  onClick={registerForVerification}
                  disabled={registering}
                >
                  {registering ? (
                    <>
                      <Loader2 size={18} className="spinning" />
                      Registrando...
                    </>
                  ) : (
                    'Comenzar conteo de 14 días'
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="missing-communities">
              <p className="missing-text">
                Te faltan {currentCheck.totalRequired - currentCheck.joinedCount} comunidades:
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lista de comunidades */}
      <div className="communities-list">
        <h4>Comunidades requeridas:</h4>
        <div className="communities-grid">
          {communities.map((community) => {
            const status = currentCheck?.details?.find(d => d.communityId === community.id);
            const isMember = status?.isMember;
            
            return (
              <a
                key={community.id}
                href={`https://www.roblox.com/es/communities/${community.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`community-item ${isMember ? 'joined' : ''}`}
              >
                <div className="community-info">
                  <span className="community-name">{community.name}</span>
                  {isMember !== undefined && (
                    <span className={`member-status ${isMember ? 'joined' : 'not-joined'}`}>
                      {isMember ? (
                        <>
                          <Check size={14} />
                          Unido
                        </>
                      ) : (
                        <>
                          <X size={14} />
                          No unido
                        </>
                      )}
                    </span>
                  )}
                </div>
                <ExternalLink size={16} className="external-icon" />
              </a>
            );
          })}
        </div>
      </div>

      <p className="important-note">
        ⚠️ <strong>Importante:</strong> Debes unirte a las 10 comunidades y permanecer en todas durante 14 días consecutivos. 
        Si sales de alguna, el contador se reiniciará.
      </p>
    </div>
  );
};

export default CommunityVerification;
