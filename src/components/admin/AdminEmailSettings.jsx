import { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, Bell, CheckCircle, XCircle } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { API_CONFIG } from '../../config/api';
import './AdminEmailSettings.css';

const AdminEmailSettings = () => {
  const { getAuthHeaders } = useAdminAuth();
  const [settings, setSettings] = useState({
    enabled: true,
    adminEmails: [],
    notifyOnNewOrder: true,
    requireEmailVerification: true
  });
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/settings`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.data.emailNotifications || {
          enabled: true,
          adminEmails: [],
          notifyOnNewOrder: true,
          requireEmailVerification: true
        });
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      showMessage('error', 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          emailNotifications: settings
        })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', '✅ Configuración guardada exitosamente');
      } else {
        showMessage('error', data.error || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error guardando configuración:', error);
      showMessage('error', 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!newEmail) {
      showMessage('error', 'Ingresa un email');
      return;
    }

    if (!emailRegex.test(newEmail)) {
      showMessage('error', 'Email inválido');
      return;
    }

    if (settings.adminEmails.includes(newEmail)) {
      showMessage('error', 'Este email ya está agregado');
      return;
    }

    setSettings({
      ...settings,
      adminEmails: [...settings.adminEmails, newEmail]
    });
    setNewEmail('');
    showMessage('success', 'Email agregado. No olvides guardar los cambios.');
  };

  const handleRemoveEmail = (email) => {
    setSettings({
      ...settings,
      adminEmails: settings.adminEmails.filter(e => e !== email)
    });
    showMessage('success', 'Email removido. No olvides guardar los cambios.');
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  if (loading) {
    return (
      <div className="admin-email-settings">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-email-settings">
      <div className="settings-header">
        <div className="header-left">
          <Mail size={32} />
          <div>
            <h2>Configuración de Emails</h2>
            <p>Configura notificaciones por correo electrónico</p>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`message-banner ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="settings-grid">
        {/* Sección 1: Estado General */}
        <div className="settings-card">
          <h3>
            <Bell size={20} />
            Notificaciones Generales
          </h3>
          
          <div className="setting-item">
            <div className="setting-info">
              <label>Sistema de Emails</label>
              <p>Activar o desactivar todas las notificaciones por email</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Notificar Nuevas Órdenes</label>
              <p>Enviar email cuando se cree una nueva orden</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.notifyOnNewOrder}
                onChange={(e) => setSettings({ ...settings, notifyOnNewOrder: e.target.checked })}
                disabled={!settings.enabled}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Verificación de Email al Registrarse</label>
              <p>Requerir que los usuarios verifiquen su email</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.requireEmailVerification}
                onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                disabled={!settings.enabled}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Sección 2: Emails de Administradores */}
        <div className="settings-card">
          <h3>
            <Mail size={20} />
            Emails de Administradores
          </h3>
          
          <p className="card-description">
            Agrega los emails que recibirán notificaciones cuando se creen nuevas órdenes.
          </p>

          <div className="add-email-section">
            <input
              type="email"
              placeholder="admin@rbxlatamstore.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
              disabled={!settings.enabled}
            />
            <button
              className="btn-add-email"
              onClick={handleAddEmail}
              disabled={!settings.enabled}
            >
              <Plus size={18} />
              Agregar
            </button>
          </div>

          <div className="emails-list">
            {settings.adminEmails.length === 0 ? (
              <div className="no-emails">
                <Mail size={48} />
                <p>No hay emails configurados</p>
                <span>Agrega emails para recibir notificaciones</span>
              </div>
            ) : (
              settings.adminEmails.map((email, index) => (
                <div key={index} className="email-item">
                  <div className="email-info">
                    <Mail size={16} />
                    <span>{email}</span>
                  </div>
                  <button
                    className="btn-remove-email"
                    onClick={() => handleRemoveEmail(email)}
                    title="Eliminar email"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {settings.adminEmails.length > 0 && (
            <div className="emails-count">
              {settings.adminEmails.length} {settings.adminEmails.length === 1 ? 'email configurado' : 'emails configurados'}
            </div>
          )}
        </div>
      </div>

      {/* Botón de Guardar */}
      <div className="settings-footer">
        <button
          className="btn-save-settings"
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <>
              <div className="spinner-small"></div>
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              Guardar Cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminEmailSettings;
