import { useState, useEffect } from 'react';
import { HelpCircle, Upload, Save, AlertCircle, Video, FileText, X } from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import './AdminGamepassHelp.css';

const AdminGamepassHelp = () => {
  const [config, setConfig] = useState({
    enabled: true,
    title: '',
    description: '',
    videoUrl: ''
  });
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/settings`);
      const data = await response.json();
      
      if (data.success && data.data.gamepassHelp) {
        setConfig(data.data.gamepassHelp);
        setVideoPreview(data.data.gamepassHelp.videoUrl || '');
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setMessage({ type: 'error', text: 'Por favor selecciona un archivo de video válido' });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'El video no debe superar los 50MB' });
      return;
    }

    setVideoFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadVideo = async () => {
    if (!videoFile) return config.videoUrl;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', videoFile);

      const response = await fetch(`${API_CONFIG.BASE_URL}/upload/help-video`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        // Construir URL completa
        const fullUrl = `${API_CONFIG.SERVER_URL}${data.data.url}`;
        return fullUrl;
      } else {
        throw new Error(data.error || 'Error al subir video');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      setMessage({ type: 'error', text: 'Error al subir el video' });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      // Si hay un video nuevo, subirlo primero
      let videoUrl = config.videoUrl;
      if (videoFile) {
        videoUrl = await uploadVideo();
        if (!videoUrl) return;
      }

      const updatedConfig = { ...config, videoUrl };

      const response = await fetch(`${API_CONFIG.BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ gamepassHelp: updatedConfig })
      });

      const data = await response.json();

      if (data.success) {
        setConfig(updatedConfig);
        setVideoFile(null);
        setMessage({ type: 'success', text: '✅ Configuración guardada exitosamente' });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: '❌ Error al guardar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview('');
    setConfig({ ...config, videoUrl: '' });
  };

  return (
    <div className="admin-gamepass-help">
      <div className="section-header">
        <h2>
          <HelpCircle size={24} />
          Ayuda para Crear Gamepass
        </h2>
        <p className="section-description">
          Configura la información de ayuda que verán los usuarios al comprar Robux
        </p>
      </div>

      {message.text && (
        <div className={`message-banner ${message.type}`}>
          <AlertCircle size={18} />
          {message.text}
        </div>
      )}

      <div className="config-form">
        {/* Enabled Toggle */}
        <div className="form-group">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            />
            <span>Mostrar ayuda en el checkout</span>
          </label>
        </div>

        {/* Title */}
        <div className="form-group">
          <label>
            <FileText size={18} />
            Título
          </label>
          <input
            type="text"
            placeholder="Ej: ¿Cómo crear un Gamepass?"
            value={config.title}
            onChange={(e) => setConfig({ ...config, title: e.target.value })}
            maxLength={100}
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label>
            <FileText size={18} />
            Descripción / Instrucciones
          </label>
          <textarea
            placeholder="Escribe las instrucciones paso a paso..."
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            rows={10}
          />
          <small>Puedes usar saltos de línea para separar los pasos</small>
        </div>

        {/* Video Upload */}
        <div className="form-group">
          <label>
            <Video size={18} />
            Video Tutorial (Opcional)
          </label>
          
          {videoPreview ? (
            <div className="video-preview-container">
              <video 
                src={videoPreview} 
                controls 
                className="video-preview"
              >
                Tu navegador no soporta el tag de video.
              </video>
              <button 
                className="btn-remove-video"
                onClick={removeVideo}
                type="button"
              >
                <X size={18} />
                Eliminar Video
              </button>
            </div>
          ) : (
            <label className="upload-video-box">
              <input
                type="file"
                accept="video/mp4,video/webm,video/ogg"
                onChange={handleVideoChange}
                style={{ display: 'none' }}
              />
              <Upload size={32} />
              <span>Subir Video</span>
              <small>MP4, WebM, OGG (Max 50MB)</small>
            </label>
          )}
        </div>

        {/* Save Button */}
        <div className="form-actions">
          <button 
            className="btn-save"
            onClick={handleSave}
            disabled={saving || uploading}
          >
            <Save size={18} />
            {saving ? 'Guardando...' : uploading ? 'Subiendo video...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>

      {/* Preview Section */}
      {config.enabled && (
        <div className="preview-section">
          <h3>Vista Previa</h3>
          <div className="help-preview">
            <h4>{config.title || 'Título de la ayuda'}</h4>
            <p className="preview-description">
              {config.description || 'Las instrucciones aparecerán aquí...'}
            </p>
            {videoPreview && (
              <div className="preview-video">
                <video src={videoPreview} controls width="100%">
                  Tu navegador no soporta el tag de video.
                </video>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGamepassHelp;
