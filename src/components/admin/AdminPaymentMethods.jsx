import { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './AdminPaymentMethods.css';

const AdminPaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    icon: '',
    logo: '',
    qrImage: '',
    config: {},
    active: true
  });
  const [customFields, setCustomFields] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const { getAuthHeaders } = useAdminAuth();

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT_METHODS.BASE}?includeInactive=true`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      
      if (data.success) {
        setPaymentMethods(data.data);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar los 2MB');
      return;
    }

    setLogoFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleQrChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar los 2MB');
      return;
    }

    setQrFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setQrPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadLogo = async () => {
    if (!logoFile) return formData.logo;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', logoFile);

      const response = await fetch(`${API_CONFIG.BASE_URL}/upload/product-image`, {
        method: 'POST',
        body: uploadFormData
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        const fullUrl = `${API_CONFIG.SERVER_URL}${data.data.url}`;
        return fullUrl;
      } else {
        throw new Error('Error al subir logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Error al subir el logo');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadQr = async () => {
    if (!qrFile) return formData.qrImage;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', qrFile);

      const response = await fetch(`${API_CONFIG.BASE_URL}/upload/product-image`, {
        method: 'POST',
        body: uploadFormData
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        const fullUrl = `${API_CONFIG.SERVER_URL}${data.data.url}`;
        return fullUrl;
      } else {
        throw new Error('Error al subir código QR');
      }
    } catch (error) {
      console.error('Error uploading QR:', error);
      alert('Error al subir el código QR');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Si hay un logo nuevo, subirlo primero
      let logoUrl = formData.logo;
      if (logoFile) {
        logoUrl = await uploadLogo();
        if (!logoUrl && logoFile) return; // Si falla el upload, no guardar
      }

      // Si hay un QR nuevo, subirlo
      let qrUrl = formData.qrImage;
      if (qrFile) {
        qrUrl = await uploadQr();
        if (!qrUrl && qrFile) return; // Si falla el upload, no guardar
      }

      // Construir config desde customFields
      const config = {};
      customFields.forEach(field => {
        if (field.key && field.value) {
          config[field.key] = field.value;
        }
      });

      const dataToSave = { ...formData, logo: logoUrl, qrImage: qrUrl, config };

      const url = editingMethod
        ? `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT_METHODS.UPDATE(editingMethod.id)}`
        : `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT_METHODS.CREATE}`;
      
      const method = editingMethod ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(dataToSave)
      });

      const data = await response.json();
      
      if (data.success) {
        fetchPaymentMethods();
        closeModal();
        alert(editingMethod ? '✅ Método actualizado' : '✅ Método creado');
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
      alert('Error al guardar el método de pago');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este método de pago?')) return;
    
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT_METHODS.DELETE(id)}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      const data = await response.json();
      
      if (data.success) {
        fetchPaymentMethods();
        alert('✅ Método eliminado');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      alert('Error al eliminar método');
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT_METHODS.UPDATE(id)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ active: !currentActive })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        fetchPaymentMethods();
      }
    } catch (error) {
      console.error('Error toggling active:', error);
    }
  };

  const openModal = (method = null) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        type: method.type,
        description: method.description || '',
        icon: method.icon || '',
        logo: method.logo || '',
        qrImage: method.qrImage || '',
        config: method.config || {},
        active: method.active !== false
      });
      setLogoPreview(method.logo || '');
      setLogoFile(null);
      setQrPreview(method.qrImage || '');
      setQrFile(null);
      
      // Cargar campos personalizados desde config
      const fields = [];
      if (method.config && typeof method.config === 'object') {
        Object.entries(method.config).forEach(([key, value]) => {
          fields.push({ id: Date.now() + Math.random(), key, value });
        });
      }
      setCustomFields(fields);
    } else {
      setEditingMethod(null);
      setFormData({
        name: '',
        type: '',
        description: '',
        icon: '',
        logo: '',
        qrImage: '',
        config: {},
        active: true
      });
      setLogoPreview('');
      setLogoFile(null);
      setQrPreview('');
      setQrFile(null);
      setCustomFields([]);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMethod(null);
    setFormData({
      name: '',
      type: '',
      description: '',
      icon: '',
      logo: '',
      qrImage: '',
      config: {},
      active: true
    });
    setLogoPreview('');
    setLogoFile(null);
    setQrPreview('');
    setQrFile(null);
    setCustomFields([]);
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { id: Date.now(), key: '', value: '' }]);
  };

  const updateCustomField = (id, field, value) => {
    setCustomFields(customFields.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const removeCustomField = (id) => {
    setCustomFields(customFields.filter(f => f.id !== id));
  };

  return (
    <div className="admin-payment-methods">
      <div className="admin-section">
        <div className="section-header">
          <div>
            <h2>Métodos de Pago</h2>
            <p>Gestiona los métodos de pago disponibles</p>
          </div>
          <button className="btn-create" onClick={() => openModal()}>
            <Plus size={18} />
            Crear Método
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Cargando métodos...</div>
      ) : (
        <div className="payment-methods-list">
          {paymentMethods.map((method) => (
            <div key={method.id} className={`payment-method-card ${!method.active ? 'inactive' : ''}`}>
              <div className="method-icon">
                {method.icon || '💳'}
              </div>
              
              <div className="method-info">
                <div className="method-name">
                  {method.name}
                  {!method.active && <span className="inactive-badge">Inactivo</span>}
                </div>
                <div className="method-type">{method.type}</div>
                {method.description && (
                  <div className="method-description">{method.description}</div>
                )}
              </div>

              <div className="method-actions">
                <button
                  className="btn-toggle"
                  onClick={() => handleToggleActive(method.id, method.active)}
                  title={method.active ? 'Desactivar' : 'Activar'}
                >
                  {method.active ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  className="btn-edit"
                  onClick={() => openModal(method)}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(method.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingMethod ? 'Editar Método' : 'Crear Método'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="PayPal"
                />
              </div>

              <div className="form-group">
                <label>Tipo</label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  required
                  placeholder="wallet"
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descripción del método..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Icono (emoji o código)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  placeholder="💳"
                />
              </div>

              <div className="form-group">
                <label>Logo del Método de Pago</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="file-input"
                />
                {logoPreview && (
                  <div className="logo-preview-container">
                    <img src={logoPreview} alt="Logo preview" className="logo-preview" />
                  </div>
                )}
                <small style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                  Tamaño recomendado: 200x80px (max 2MB)
                </small>
              </div>

              <div className="form-group">
                <label>Código QR de Pago (Opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrChange}
                  className="file-input"
                />
                {qrPreview && (
                  <div className="logo-preview-container">
                    <img src={qrPreview} alt="QR preview" className="logo-preview" />
                  </div>
                )}
                <small style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                  El código QR se mostrará en el checkout cuando el usuario seleccione este método de pago (max 2MB)
                </small>
              </div>

              <div className="form-group">
                <label>Información de Pago (Campos Personalizados)</label>
                <div className="custom-fields-container">
                  {customFields.map((field) => (
                    <div key={field.id} className="custom-field-row">
                      <input
                        type="text"
                        placeholder="Nombre del campo (ej: Banco)"
                        value={field.key}
                        onChange={(e) => updateCustomField(field.id, 'key', e.target.value)}
                        className="field-key-input"
                      />
                      <input
                        type="text"
                        placeholder="Valor (ej: Banco Nacional)"
                        value={field.value}
                        onChange={(e) => updateCustomField(field.id, 'value', e.target.value)}
                        className="field-value-input"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomField(field.id)}
                        className="btn-remove-field"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="btn-add-field"
                  >
                    + Agregar Campo
                  </button>
                </div>
                <small style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                  Ejemplos: Banco, Número de Cuenta, Titular, Tipo de Cuenta, Identificación, etc.
                </small>
              </div>

              <div className="form-group-checkbox">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                />
                <label htmlFor="active">Método activo</label>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn-cancel" disabled={uploading}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save" disabled={uploading}>
                  {uploading ? 'Subiendo logo...' : (editingMethod ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentMethods;
