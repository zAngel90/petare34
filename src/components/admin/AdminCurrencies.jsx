import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, DollarSign, Check, X } from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './AdminCurrencies.css';

const AdminCurrencies = () => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { getAuthHeaders } = useAdminAuth();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    flag: '',
    rate: '',
    active: true,
    isPrimary: false
  });

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/currencies`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setCurrencies(data.data);
      }
    } catch (error) {
      console.error('Error cargando monedas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (currency = null) => {
    if (currency) {
      setEditingCurrency(currency);
      setFormData({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        flag: currency.flag,
        rate: currency.rate,
        active: currency.active,
        isPrimary: currency.isPrimary || false
      });
    } else {
      setEditingCurrency(null);
      setFormData({
        code: '',
        name: '',
        symbol: '$',
        flag: '🌐',
        rate: '',
        active: true,
        isPrimary: false
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCurrency(null);
    setFormData({
      code: '',
      name: '',
      symbol: '$',
      flag: '🌐',
      rate: '',
      active: true,
      isPrimary: false
    });
    setMessage({ type: '', text: '' });
  };

  const handleSetPrimary = async (currencyId) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/currencies/${currencyId}/set-primary`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '✅ Moneda principal actualizada' });
        loadCurrencies();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: '❌ ' + (data.error || 'Error al establecer moneda principal') });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: '❌ Error de conexión' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code || !formData.name || !formData.symbol || !formData.rate) {
      setMessage({ type: 'error', text: '❌ Completa todos los campos requeridos' });
      return;
    }

    if (parseFloat(formData.rate) <= 0) {
      setMessage({ type: 'error', text: '❌ La tasa debe ser mayor a 0' });
      return;
    }

    try {
      const url = editingCurrency
        ? `${API_CONFIG.BASE_URL}/currencies/${editingCurrency.id}`
        : `${API_CONFIG.BASE_URL}/currencies`;

      const response = await fetch(url, {
        method: editingCurrency ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `✅ Moneda ${editingCurrency ? 'actualizada' : 'creada'} correctamente`
        });
        loadCurrencies();
        setTimeout(() => handleCloseModal(), 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar' });
      }
    } catch (error) {
      console.error('Error guardando moneda:', error);
      setMessage({ type: 'error', text: 'Error de conexión' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta moneda?')) return;

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/currencies/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '✅ Moneda eliminada' });
        loadCurrencies();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al eliminar' });
      }
    } catch (error) {
      console.error('Error eliminando moneda:', error);
    }
  };

  const handleToggleActive = async (currency) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/currencies/${currency.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ active: !currency.active })
      });

      const data = await response.json();

      if (data.success) {
        loadCurrencies();
      }
    } catch (error) {
      console.error('Error actualizando moneda:', error);
    }
  };

  const calculateConversion = (amount, rate) => {
    return (amount * rate).toFixed(2);
  };

  if (loading) {
    return (
      <div className="admin-section">
        <h2>Cargando monedas...</h2>
      </div>
    );
  }

  return (
    <div className="currencies-container">
      <div className="admin-section">
        <div className="currencies-header">
          <div>
            <h2>Gestión de Monedas</h2>
            <p>Configura las monedas y sus tasas de cambio respecto al USD</p>
          </div>
          <button className="btn-add-currency" onClick={() => handleOpenModal()}>
            <Plus size={20} />
            Nueva Moneda
          </button>
        </div>
      </div>

      {message.text && !showModal && (
        <div className={`currencies-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Tabla de Monedas */}
      <div className="currencies-table-container">
        <table className="currencies-table">
          <thead>
            <tr>
              <th>Moneda</th>
              <th>Código</th>
              <th>Símbolo</th>
              <th>Tasa (1 USD =)</th>
              <th>Ejemplo</th>
              <th>Estado</th>
              <th>Principal</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map((currency) => (
              <tr key={currency.id} className={!currency.active ? 'inactive-row' : ''}>
                <td>
                  <div className="currency-cell">
                    <span className="currency-flag">{currency.flag}</span>
                    <span className="currency-name">{currency.name}</span>
                  </div>
                </td>
                <td>
                  <span className="currency-code">{currency.code}</span>
                </td>
                <td>
                  <span className="currency-symbol">{currency.symbol}</span>
                </td>
                <td>
                  <span className="currency-rate">{currency.rate.toLocaleString()}</span>
                </td>
                <td>
                  <span className="currency-example">
                    $10 USD = {currency.symbol}{calculateConversion(10, currency.rate)} {currency.code}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${currency.active ? 'active' : 'inactive'}`}>
                    {currency.active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td>
                  {currency.isPrimary ? (
                    <span className="primary-badge">⭐ Principal</span>
                  ) : (
                    <button
                      className="btn-set-primary"
                      onClick={() => handleSetPrimary(currency.id)}
                      disabled={!currency.active}
                      title="Establecer como moneda principal"
                    >
                      Establecer
                    </button>
                  )}
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="table-action-btn toggle"
                      onClick={() => handleToggleActive(currency)}
                      title={currency.active ? 'Desactivar' : 'Activar'}
                    >
                      {currency.active ? <X size={16} /> : <Check size={16} />}
                    </button>
                    <button
                      className="table-action-btn edit"
                      onClick={() => handleOpenModal(currency)}
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    {currency.code !== 'USD' && (
                      <button
                        className="table-action-btn delete"
                        onClick={() => handleDelete(currency.id)}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="currency-modal-overlay">
          <div className="currency-modal">
            <div className="currency-modal-header">
              <h3>{editingCurrency ? 'Editar Moneda' : 'Nueva Moneda'}</h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>×</button>
            </div>

            {message.text && (
              <div className={`currencies-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="currency-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Código * (3 letras)</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="USD, EUR, COP"
                    maxLength="3"
                    disabled={editingCurrency !== null}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Símbolo *</label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    placeholder="$, €, £"
                    maxLength="3"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Emoji/Bandera</label>
                  <input
                    type="text"
                    value={formData.flag}
                    onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                    placeholder="🇺🇸"
                    maxLength="4"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Nombre de la Moneda *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Peso Colombiano"
                  required
                />
              </div>

              <div className="form-group">
                <label>Tasa de Cambio (1 USD = X {formData.code || 'MONEDA'}) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  placeholder="4000"
                  required
                />
                <span className="form-hint">
                  Ejemplo: Si 1 USD = 4000 COP, ingresa 4000
                </span>
              </div>

              {formData.rate && parseFloat(formData.rate) > 0 && (
                <div className="conversion-preview">
                  <h4>Vista Previa de Conversión:</h4>
                  <div className="preview-examples">
                    <div>$1 USD = {formData.symbol}{calculateConversion(1, parseFloat(formData.rate))} {formData.code}</div>
                    <div>$10 USD = {formData.symbol}{calculateConversion(10, parseFloat(formData.rate))} {formData.code}</div>
                    <div>$100 USD = {formData.symbol}{calculateConversion(100, parseFloat(formData.rate))} {formData.code}</div>
                  </div>
                </div>
              )}

              <div className="form-group-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <span>Moneda activa (visible para usuarios)</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel-modal" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save-modal">
                  {editingCurrency ? 'Actualizar' : 'Crear'} Moneda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCurrencies;
