import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, Check, X } from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './AdminCategories.css';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { getAuthHeaders } = useAdminAuth();

  const [formData, setFormData] = useState({
    name: '',
    image: '',
    active: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/categories`,
        { headers: getAuthHeaders() }
      );

      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        image: category.image,
        active: category.active
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        image: '',
        active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', image: '', active: true });
    setMessage({ type: '', text: '' });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: '❌ La imagen debe pesar menos de 5MB' });
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: '❌ Solo se permiten imágenes' });
      return;
    }

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      // No incluir Content-Type header, fetch lo hará automáticamente
      const authHeaders = getAuthHeaders();
      delete authHeaders['Content-Type'];

      const response = await fetch(`${API_CONFIG.BASE_URL}/upload/category-image`, {
        method: 'POST',
        headers: authHeaders,
        body: formDataUpload
      });

      const data = await response.json();

      if (data.success) {
        // Construir URL completa
        const fullImageUrl = `${API_CONFIG.SERVER_URL}${data.url}`;
        setFormData({ ...formData, image: fullImageUrl });
        setMessage({ type: 'success', text: '✅ Imagen subida correctamente' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al subir imagen' });
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      setMessage({ type: 'error', text: 'Error de conexión al subir imagen' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.image) {
      setMessage({ type: 'error', text: '❌ Nombre e imagen son requeridos' });
      return;
    }

    try {
      const url = editingCategory
        ? `${API_CONFIG.BASE_URL}/categories/${editingCategory.id}`
        : `${API_CONFIG.BASE_URL}/categories`;

      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
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
          text: `✅ Categoría ${editingCategory ? 'actualizada' : 'creada'} correctamente` 
        });
        loadCategories();
        setTimeout(() => handleCloseModal(), 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar' });
      }
    } catch (error) {
      console.error('Error guardando categoría:', error);
      setMessage({ type: 'error', text: 'Error de conexión' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/categories/${id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '✅ Categoría eliminada' });
        loadCategories();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error eliminando categoría:', error);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/categories/${category.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ active: !category.active })
        }
      );

      const data = await response.json();

      if (data.success) {
        loadCategories();
      }
    } catch (error) {
      console.error('Error actualizando categoría:', error);
    }
  };

  if (loading) {
    return (
      <div className="admin-section">
        <h2>Cargando categorías...</h2>
      </div>
    );
  }

  return (
    <div className="categories-container">
      <div className="admin-section">
        <div className="categories-header">
          <div>
            <h2>Categorías de In-Game Items</h2>
            <p>Gestiona las categorías que aparecen en el catálogo</p>
          </div>
          <button className="btn-add-category" onClick={() => handleOpenModal()}>
            <Plus size={20} />
            Nueva Categoría
          </button>
        </div>
      </div>

      {message.text && !showModal && (
        <div className={`categories-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="categories-grid">
        {categories.map((category) => (
          <div key={category.id} className={`category-card ${!category.active ? 'inactive' : ''}`}>
            <div className="category-image-wrapper">
              <img src={category.image} alt={category.name} className="category-image" />
              <div className={`category-status-badge ${category.active ? 'active' : 'inactive'}`}>
                {category.active ? 'Activa' : 'Inactiva'}
              </div>
            </div>

            <div className="category-info">
              <h3>{category.name}</h3>
              <p className="category-slug">/{category.slug}</p>
            </div>

            <div className="category-actions">
              <button
                className="category-action-btn toggle"
                onClick={() => handleToggleActive(category)}
                title={category.active ? 'Desactivar' : 'Activar'}
              >
                {category.active ? <X size={18} /> : <Check size={18} />}
              </button>
              <button
                className="category-action-btn edit"
                onClick={() => handleOpenModal(category)}
                title="Editar"
              >
                <Edit size={18} />
              </button>
              <button
                className="category-action-btn delete"
                onClick={() => handleDelete(category.id)}
                title="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="categories-empty">
            <ImageIcon size={64} />
            <h3>No hay categorías</h3>
            <p>Crea tu primera categoría para comenzar</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="category-modal-overlay" onClick={handleCloseModal}>
          <div className="category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="category-modal-header">
              <h3>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>×</button>
            </div>

            {message.text && (
              <div className={`categories-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-group">
                <label>Nombre de la Categoría</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Blox Fruits, MM2, Pet Simulator"
                  required
                />
              </div>

              <div className="form-group">
                <label>Imagen de la Categoría *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="file-input"
                />
                <span className="form-hint">
                  Recomendado: 150x150px o superior (cuadrada). Máximo 5MB.
                </span>
              </div>

              {formData.image && (
                <div className="image-preview">
                  <label>Vista Previa</label>
                  <img src={formData.image} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
                </div>
              )}

              <div className="form-group-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <span>Categoría activa</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel-modal" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save-modal">
                  {editingCategory ? 'Actualizar' : 'Crear'} Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
