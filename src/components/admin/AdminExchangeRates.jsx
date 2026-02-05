import { useState, useEffect } from 'react';
import { DollarSign, RefreshCw, Save, TrendingUp } from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './AdminExchangeRates.css';

const AdminExchangeRates = () => {
  const [exchangeRate, setExchangeRate] = useState(null);
  const [newRate, setNewRate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { getAuthHeaders } = useAdminAuth();

  useEffect(() => {
    loadExchangeRate();
  }, []);

  const loadExchangeRate = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/exchange-rates/current`,
        { headers: getAuthHeaders() }
      );

      const data = await response.json();

      if (data.success) {
        setExchangeRate(data.data);
        setNewRate(data.data.rate.toString());
      }
    } catch (error) {
      console.error('Error cargando tasa de cambio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newRate || parseFloat(newRate) <= 0) {
      setMessage({ type: 'error', text: '❌ Por favor ingresa una tasa válida' });
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/exchange-rates/current`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ rate: parseFloat(newRate) })
        }
      );

      const data = await response.json();

      if (data.success) {
        setExchangeRate(data.data);
        setMessage({ type: 'success', text: '✅ Tasa de cambio actualizada correctamente' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al actualizar' });
      }
    } catch (error) {
      console.error('Error actualizando tasa:', error);
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSaving(false);
    }
  };

  const calculateRobux = (pen) => {
    if (!exchangeRate) return 0;
    return Math.floor(pen / exchangeRate.rate);
  };

  if (loading) {
    return (
      <div className="admin-section">
        <h2>Cargando...</h2>
      </div>
    );
  }

  return (
    <div className="exchange-rates-container">
      <div className="admin-section">
        <h2>Tasas de Cambio</h2>
        <p>Configura el precio de los Robux en dólares</p>
      </div>

      {message.text && (
        <div className={`rate-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="rates-grid">
        {/* Tasa Actual */}
        <div className="rate-card current-rate">
          <div className="rate-card-header">
            <TrendingUp size={32} />
            <h3>Tasa Actual</h3>
          </div>
          <div className="rate-display">
            <span className="rate-label">1 Robux =</span>
            <span className="rate-value">S/{exchangeRate.rate} PEN</span>
          </div>
          <div className="rate-meta">
            <p>Última actualización:</p>
            <p className="rate-date">
              {new Date(exchangeRate.lastUpdated).toLocaleString('es-ES')}
            </p>
            <p className="rate-by">Por: {exchangeRate.updatedBy}</p>
          </div>
        </div>

        {/* Editor de Tasa */}
        <div className="rate-card edit-rate">
          <div className="rate-card-header">
            <DollarSign size={32} />
            <h3>Actualizar Tasa</h3>
          </div>

          <div className="rate-editor">
            <div className="rate-input-group">
              <label>Precio por Robux (PEN - Soles)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder="0.03"
              />
              <span className="input-hint">
                Ejemplo: 0.03 = 1 Robux cuesta S/0.03 PEN
              </span>
            </div>

            <div className="rate-preview">
              <h4>Vista Previa</h4>
              <div className="preview-grid">
                <div className="preview-item">
                  <span>$1</span>
                  <span>=</span>
                  <span>{calculateRobux(1)} R$</span>
                </div>
                <div className="preview-item">
                  <span>$5</span>
                  <span>=</span>
                  <span>{calculateRobux(5)} R$</span>
                </div>
                <div className="preview-item">
                  <span>$10</span>
                  <span>=</span>
                  <span>{calculateRobux(10)} R$</span>
                </div>
                <div className="preview-item">
                  <span>$25</span>
                  <span>=</span>
                  <span>{calculateRobux(25)} R$</span>
                </div>
              </div>
            </div>

            <button
              className="btn-save-rate"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw size={18} className="spinning" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Guardar Tasa
                </>
              )}
            </button>
          </div>
        </div>

        {/* Ejemplos Comunes */}
        <div className="rate-card examples-card">
          <div className="rate-card-header">
            <RefreshCw size={32} />
            <h3>Ejemplos de Tasas</h3>
          </div>
          <div className="examples-list">
            <button
              className="example-btn"
              onClick={() => setNewRate('0.03')}
            >
              <span>0.03</span>
              <span>1 Robux = S/0.03</span>
            </button>
            <button
              className="example-btn"
              onClick={() => setNewRate('0.025')}
            >
              <span>0.025</span>
              <span>1 Robux = S/0.025</span>
            </button>
            <button
              className="example-btn"
              onClick={() => setNewRate('0.035')}
            >
              <span>0.035</span>
              <span>1 Robux = S/0.035</span>
            </button>
            <button
              className="example-btn"
              onClick={() => setNewRate('0.04')}
            >
              <span>0.04</span>
              <span>1 Robux = S/0.04</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminExchangeRates;
