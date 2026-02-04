import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, Mail, User, Calendar, ShoppingBag, RefreshCw } from 'lucide-react';
import { API_CONFIG } from '../config/api';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, getAuthHeaders } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    completedOrders: 0
  });
  const [myOrders, setMyOrders] = useState([]);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    robloxUsername: user?.robloxUsername || '',
    email: user?.email || ''
  });

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '');
  const [customAvatarFile, setCustomAvatarFile] = useState(null);
  const [customAvatarPreview, setCustomAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Estilos de avatares disponibles
  const avatarStyles = [
    'adventurer', 'avataaars', 'big-ears', 'big-smile', 'bottts', 
    'croodles', 'fun-emoji', 'icons', 'identicon', 'lorelei',
    'micah', 'miniavs', 'pixel-art', 'thumbs'
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        robloxUsername: user.robloxUsername || '',
        email: user.email || ''
      });
      setSelectedAvatar(user.avatar || '');
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      // Obtener órdenes del usuario usando el nuevo endpoint
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/orders/my-orders?userEmail=${user.email}`
      );
      
      const data = await response.json();
      
      if (data.success) {
        const orders = data.data;
        setMyOrders(orders);
        
        const completed = orders.filter(o => o.status === 'completed');
        const totalSpent = completed.reduce((sum, o) => sum + (o.price || 0), 0);
        
        setStats({
          totalOrders: orders.length,
          completedOrders: completed.length,
          totalSpent: totalSpent
        });
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const dataToUpdate = {
        ...formData,
        avatar: selectedAvatar // Usar el avatar actual (ya fue actualizado en handleSaveAvatar)
      };

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/users/${user.id}/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify(dataToUpdate)
        }
      );

      const data = await response.json();

      if (data.success) {
        updateProfile(dataToUpdate);
        setMessage({ type: 'success', text: '✅ Perfil actualizado correctamente' });
        setIsEditing(false);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al actualizar perfil' });
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const generateRandomAvatar = (style) => {
    const seed = Math.random().toString(36).substring(7);
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
  };

  const handleAvatarChange = (style) => {
    const newAvatar = generateRandomAvatar(style);
    setSelectedAvatar(newAvatar);
    setCustomAvatarPreview('');
    setCustomAvatarFile(null);
    // NO cerrar el modal todavía, que el usuario confirme
  };

  const handleCustomAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor selecciona una imagen válida' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen no debe superar los 2MB' });
      return;
    }

    setCustomAvatarFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomAvatarPreview(reader.result);
      setSelectedAvatar(reader.result); // Actualizar también selectedAvatar para preview
    };
    reader.readAsDataURL(file);
  };

  const uploadCustomAvatar = async () => {
    if (!customAvatarFile) return selectedAvatar;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', customAvatarFile);

      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${user.id}/upload-avatar`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        const avatarUrl = `${API_CONFIG.SERVER_URL}${data.data.avatarUrl}`;
        return avatarUrl;
      } else {
        throw new Error(data.error || 'Error al subir imagen');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setMessage({ type: 'error', text: error.message || 'Error al subir la imagen' });
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveAvatar = async () => {
    setUploadingAvatar(true);
    setMessage({ type: '', text: '' });

    try {
      let avatarUrl = selectedAvatar;

      // Si hay una foto personalizada, subirla primero
      if (customAvatarFile) {
        avatarUrl = await uploadCustomAvatar();
        if (!avatarUrl) {
          setUploadingAvatar(false);
          return;
        }
      }

      // Actualizar el perfil con el nuevo avatar
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/users/${user.id}/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            username: user.username,
            robloxUsername: user.robloxUsername,
            email: user.email,
            avatar: avatarUrl
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        // Actualizar el contexto con el nuevo avatar
        updateProfile({ avatar: avatarUrl });
        setSelectedAvatar(avatarUrl);
        setCustomAvatarPreview('');
        setCustomAvatarFile(null);
        setShowAvatarPicker(false);
        setMessage({ type: 'success', text: '✅ Avatar actualizado correctamente' });
      } else {
        throw new Error(data.error || 'Error al actualizar avatar');
      }
    } catch (error) {
      console.error('Error guardando avatar:', error);
      setMessage({ type: 'error', text: error.message || 'Error al guardar el avatar' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'awaiting_verification': { text: 'Pendiente', color: '#ffd16d' },
      'completed': { text: 'Completada', color: '#00d084' },
      'cancelled': { text: 'Cancelada', color: '#ff4757' },
      'processing': { text: 'Procesando', color: '#5d9cff' }
    };
    return badges[status] || { text: status, color: '#888' };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <p>No has iniciado sesión</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Mi Perfil</h1>
        <p>Gestiona tu información personal y estadísticas</p>
      </div>

      {message.text && (
        <div className={`profile-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="profile-content">
        {/* Avatar y Info Principal */}
        <div className="profile-card profile-main">
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper">
              <img src={selectedAvatar} alt={user.username} className="profile-avatar" />
              {isEditing && (
                <button 
                  type="button"
                  className="avatar-edit-btn" 
                  title="Cambiar avatar"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                >
                  <Camera size={16} />
                </button>
              )}
            </div>
            <div className="profile-info">
              <h2>{user.username}</h2>
              <p className="profile-email">
                <Mail size={16} />
                {user.email}
              </p>
              <p className="profile-joined">
                <Calendar size={16} />
                Miembro desde {formatDate(user.createdAt)}
              </p>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-icon">
                <ShoppingBag size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalOrders}</span>
                <span className="stat-label">Pedidos Totales</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon success">
                <ShoppingBag size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.completedOrders}</span>
                <span className="stat-label">Completados</span>
              </div>
            </div>

          </div>
        </div>

        {/* Formulario de Edición */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h3>Información Personal</h3>
            {!isEditing ? (
              <button 
                className="btn-edit"
                onClick={() => setIsEditing(true)}
              >
                Editar Perfil
              </button>
            ) : (
              <button 
                className="btn-cancel"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    username: user.username || '',
                    robloxUsername: user.robloxUsername || '',
                    email: user.email || ''
                  });
                }}
              >
                Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>
                <User size={18} />
                Nombre de Usuario
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <img 
                  src="/robux-logo.svg" 
                  alt="Roblox" 
                  style={{width: '18px', height: '18px'}}
                />
                Usuario de Roblox
              </label>
              <input
                type="text"
                name="robloxUsername"
                value={formData.robloxUsername}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Tu usuario de Roblox"
              />
            </div>

            <div className="form-group">
              <label>
                <Mail size={18} />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
            </div>

            {isEditing && (
              <button 
                type="submit" 
                className="btn-save"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="avatar-picker-overlay" onClick={() => setShowAvatarPicker(false)}>
          <div className="avatar-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="avatar-picker-header">
              <h3>Elige tu Avatar</h3>
              <button className="close-btn" onClick={() => setShowAvatarPicker(false)}>×</button>
            </div>
            <div className="avatar-picker-content">
              <div className="avatar-preview-section">
                <img 
                  src={selectedAvatar || user.avatar} 
                  alt="Avatar Preview" 
                  className="avatar-preview-large" 
                  onError={(e) => {
                    e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
                  }}
                />
                <div className="avatar-actions">
                  <button 
                    className="btn-random"
                    onClick={() => {
                      const randomStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
                      handleAvatarChange(randomStyle);
                    }}
                  >
                    <RefreshCw size={18} />
                    Avatar Aleatorio
                  </button>
                  
                  <div className="custom-avatar-upload">
                    <label htmlFor="custom-avatar-input" className="btn-upload-custom">
                      <Camera size={18} />
                      Subir mi Foto
                    </label>
                    <input
                      id="custom-avatar-input"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      onChange={handleCustomAvatarChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
                
                {customAvatarPreview && (
                  <p className="custom-avatar-hint">
                    ✓ Imagen personalizada seleccionada
                  </p>
                )}
              </div>
              
              <div className="avatar-section-divider">
                <span>O elige un avatar prediseñado</span>
              </div>
              
              <div className="avatar-styles-grid">
                {avatarStyles.map((style) => (
                  <button
                    key={style}
                    className="avatar-style-btn"
                    onClick={() => handleAvatarChange(style)}
                  >
                    <img 
                      src={generateRandomAvatar(style)} 
                      alt={style}
                      className="avatar-style-preview"
                    />
                    <span>{style}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="avatar-picker-footer">
              <button 
                className="btn-cancel-avatar"
                onClick={() => {
                  setSelectedAvatar(user.avatar);
                  setCustomAvatarPreview('');
                  setCustomAvatarFile(null);
                  setShowAvatarPicker(false);
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn-save-avatar"
                onClick={handleSaveAvatar}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? 'Guardando...' : 'Guardar Avatar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sección de Mis Órdenes */}
      <div className="profile-section">
        <h2 className="section-title">
          <ShoppingBag size={24} />
          Mis Órdenes
        </h2>
        
        {myOrders.length === 0 ? (
          <div className="no-orders">
            <ShoppingBag size={48} style={{ opacity: 0.3 }} />
            <p>No tienes órdenes aún</p>
          </div>
        ) : (
          <div className="orders-list">
            {myOrders.map((order) => {
              const badge = getStatusBadge(order.status);
              return (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <span className="order-id">Orden #{order.id}</span>
                    <span 
                      className="order-status-badge" 
                      style={{ backgroundColor: badge.color + '20', color: badge.color, border: `1px solid ${badge.color}` }}
                    >
                      {badge.text}
                    </span>
                  </div>
                  
                  <div className="order-details">
                    <div className="order-detail-row">
                      <span>Tipo:</span>
                      <strong>{order.productType === 'robux' ? 'Robux' : 'In-Game'}</strong>
                    </div>
                    <div className="order-detail-row">
                      <span>Cantidad:</span>
                      <strong>{order.amount} {order.productType === 'robux' ? 'Robux' : 'items'}</strong>
                    </div>
                    <div className="order-detail-row">
                      <span>Total:</span>
                      <strong>{order.price} {order.currency}</strong>
                    </div>
                    <div className="order-detail-row">
                      <span>Fecha:</span>
                      <strong>{formatDate(order.createdAt)}</strong>
                    </div>
                  </div>

                  {order.paymentProof && (
                    <a 
                      href={order.paymentProof} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-proof-btn"
                    >
                      Ver Comprobante
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
