import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Image, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './AdminHomeConfig.css';

const AdminHomeConfig = () => {
  const [activeTab, setActiveTab] = useState('slides');
  const [slides, setSlides] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState({ topSales: [], trending: [] });
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState(null);
  const [showSlideModal, setShowSlideModal] = useState(false);
  const { getAuthHeaders } = useAdminAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadSlides(), loadFeaturedProducts()]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSlides = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/home-config/slides/all`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setSlides(data.data);
      }
    } catch (error) {
      console.error('Error cargando slides:', error);
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/home-config/featured-products/all`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setFeaturedProducts(data.data);
      }
    } catch (error) {
      console.error('Error cargando productos destacados:', error);
    }
  };

  const handleSaveSlide = async (slideData) => {
    try {
      console.log('💾 Guardando slide:', slideData);
      
      const url = editingSlide 
        ? `${API_CONFIG.BASE_URL}/home-config/slides/${editingSlide.id}`
        : `${API_CONFIG.BASE_URL}/home-config/slides`;
      
      const method = editingSlide ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(slideData)
      });

      const data = await response.json();
      console.log('📥 Respuesta del servidor:', data);
      
      if (data.success) {
        await loadSlides();
        setShowSlideModal(false);
        setEditingSlide(null);
        alert('✅ Slide guardado correctamente');
      } else {
        alert('❌ Error al guardar slide: ' + (data.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error guardando slide:', error);
      alert('❌ Error al guardar slide: ' + error.message);
    }
  };

  const handleDeleteSlide = async (id) => {
    if (!confirm('¿Eliminar este slide?')) return;
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/home-config/slides/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (data.success) {
        await loadSlides();
      }
    } catch (error) {
      console.error('Error eliminando slide:', error);
    }
  };

  const handleToggleSlideActive = async (slide) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/home-config/slides/${slide.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ ...slide, active: !slide.active })
      });

      const data = await response.json();
      
      if (data.success) {
        await loadSlides();
      }
    } catch (error) {
      console.error('Error actualizando slide:', error);
    }
  };

  return (
    <div className="admin-home-config">
      <div className="config-header">
        <h1>Configuración del Home</h1>
        <p>Gestiona el banner principal y productos destacados</p>
      </div>

      {/* Tabs */}
      <div className="config-tabs">
        <button
          className={`config-tab ${activeTab === 'slides' ? 'active' : ''}`}
          onClick={() => setActiveTab('slides')}
        >
          <Image size={20} />
          Banner Slides
        </button>
        <button
          className={`config-tab ${activeTab === 'featured' ? 'active' : ''}`}
          onClick={() => setActiveTab('featured')}
        >
          <Image size={20} />
          Productos Destacados
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state">Cargando...</div>
      ) : (
        <>
          {activeTab === 'slides' && (
            <SlidesManager
              slides={slides}
              onAdd={() => {
                setEditingSlide(null);
                setShowSlideModal(true);
              }}
              onEdit={(slide) => {
                setEditingSlide(slide);
                setShowSlideModal(true);
              }}
              onDelete={handleDeleteSlide}
              onToggleActive={handleToggleSlideActive}
            />
          )}

          {activeTab === 'featured' && (
            <FeaturedProductsManager
              featuredProducts={featuredProducts}
              onUpdate={loadFeaturedProducts}
              getAuthHeaders={getAuthHeaders}
            />
          )}
        </>
      )}

      {/* Modal para crear/editar slide */}
      {showSlideModal && (
        <SlideModal
          slide={editingSlide}
          onSave={handleSaveSlide}
          onClose={() => {
            setShowSlideModal(false);
            setEditingSlide(null);
          }}
        />
      )}
    </div>
  );
};

// Componente para gestionar slides
const SlidesManager = ({ slides, onAdd, onEdit, onDelete, onToggleActive }) => {
  return (
    <div className="slides-manager">
      <div className="manager-header">
        <h2>Slides del Banner</h2>
        <button className="btn-primary" onClick={onAdd}>
          <Plus size={20} />
          Agregar Slide
        </button>
      </div>

      <div className="slides-grid">
        {slides.map((slide) => (
          <div key={slide.id} className={`slide-card ${!slide.active ? 'inactive' : ''}`}>
            <div className="slide-preview">
              {slide.image ? (
                <img src={slide.image} alt={slide.title} />
              ) : (
                <div className="no-image">Sin imagen</div>
              )}
              <div className="slide-type-badge">{slide.type === 'custom' ? 'Personalizado' : 'Corporativo'}</div>
            </div>
            
            <div className="slide-info">
              <h3>{slide.title || 'Sin título'}</h3>
              {slide.description && <p>{slide.description}</p>}
              <div className="slide-meta">
                <span>Orden: {slide.order}</span>
                <span className={`status-badge ${slide.active ? 'active' : 'inactive'}`}>
                  {slide.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <div className="slide-actions">
              <button className="btn-icon" onClick={() => onToggleActive(slide)} title={slide.active ? 'Desactivar' : 'Activar'}>
                {slide.active ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button className="btn-icon" onClick={() => onEdit(slide)}>
                <Edit2 size={18} />
              </button>
              <button className="btn-icon btn-danger" onClick={() => onDelete(slide.id)}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente para gestionar productos destacados
const FeaturedProductsManager = ({ featuredProducts, onUpdate, getAuthHeaders }) => {
  const [editingType, setEditingType] = useState(null); // 'topSales' o 'trending'
  const [editingProducts, setEditingProducts] = useState([]);

  const handleEdit = (type) => {
    setEditingType(type);
    setEditingProducts([...featuredProducts[type]]);
  };

  const handleSave = async () => {
    try {
      const endpoint = editingType === 'topSales' ? 'top-sales' : 'trending';
      const response = await fetch(`${API_CONFIG.BASE_URL}/home-config/featured-products/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(editingProducts)
      });

      const data = await response.json();
      
      if (data.success) {
        await onUpdate();
        setEditingType(null);
      }
    } catch (error) {
      console.error('Error guardando productos:', error);
    }
  };

  const handleAddProduct = () => {
    setEditingProducts([
      ...editingProducts,
      {
        id: Date.now(),
        productId: 1,
        productType: 'robux',
        customAmount: 0,
        customPrice: 0,
        soldCount: 0,
        order: editingProducts.length + 1,
        active: true
      }
    ]);
  };

  const handleUpdateProduct = (index, field, value) => {
    const updated = [...editingProducts];
    updated[index][field] = value;
    setEditingProducts(updated);
  };

  const handleRemoveProduct = (index) => {
    setEditingProducts(editingProducts.filter((_, i) => i !== index));
  };

  return (
    <div className="featured-manager">
      <div className="featured-section">
        <div className="section-header">
          <h2>🔥 Top Ventas</h2>
          {editingType === 'topSales' ? (
            <div className="edit-actions">
              <button className="btn-success" onClick={handleSave}>
                <Save size={18} />
                Guardar
              </button>
              <button className="btn-secondary" onClick={() => setEditingType(null)}>
                <X size={18} />
                Cancelar
              </button>
            </div>
          ) : (
            <button className="btn-primary" onClick={() => handleEdit('topSales')}>
              <Edit2 size={18} />
              Editar
            </button>
          )}
        </div>

        {editingType === 'topSales' ? (
          <div className="products-editor">
            {editingProducts.map((product, index) => (
              <ProductEditor
                key={product.id}
                product={product}
                index={index}
                onUpdate={handleUpdateProduct}
                onRemove={handleRemoveProduct}
              />
            ))}
            <button className="btn-add-product" onClick={handleAddProduct}>
              <Plus size={20} />
              Agregar Producto
            </button>
          </div>
        ) : (
          <div className="products-preview">
            {featuredProducts.topSales.map((product) => (
              <ProductPreview key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <div className="featured-section">
        <div className="section-header">
          <h2>⚡ Trending</h2>
          {editingType === 'trending' ? (
            <div className="edit-actions">
              <button className="btn-success" onClick={handleSave}>
                <Save size={18} />
                Guardar
              </button>
              <button className="btn-secondary" onClick={() => setEditingType(null)}>
                <X size={18} />
                Cancelar
              </button>
            </div>
          ) : (
            <button className="btn-primary" onClick={() => handleEdit('trending')}>
              <Edit2 size={18} />
              Editar
            </button>
          )}
        </div>

        {editingType === 'trending' ? (
          <div className="products-editor">
            {editingProducts.map((product, index) => (
              <ProductEditor
                key={product.id}
                product={product}
                index={index}
                onUpdate={handleUpdateProduct}
                onRemove={handleRemoveProduct}
              />
            ))}
            <button className="btn-add-product" onClick={handleAddProduct}>
              <Plus size={20} />
              Agregar Producto
            </button>
          </div>
        ) : (
          <div className="products-preview">
            {featuredProducts.trending.map((product) => (
              <ProductPreview key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Editor de producto individual
const ProductEditor = ({ product, index, onUpdate, onRemove }) => {
  return (
    <div className="product-editor-card">
      <div className="editor-row">
        <div className="form-group">
          <label>Tipo</label>
          <select value={product.productType} onChange={(e) => onUpdate(index, 'productType', e.target.value)}>
            <option value="robux">Robux</option>
            <option value="ingame">In-Game</option>
          </select>
        </div>
        <div className="form-group">
          <label>Cantidad Robux</label>
          <input
            type="number"
            value={product.customAmount}
            onChange={(e) => onUpdate(index, 'customAmount', parseInt(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Precio (USD)</label>
          <input
            type="number"
            step="0.01"
            value={product.customPrice}
            onChange={(e) => onUpdate(index, 'customPrice', parseFloat(e.target.value))}
          />
        </div>
      </div>
      
      <div className="editor-row">
        <div className="form-group">
          <label>Vendidos</label>
          <input
            type="number"
            value={product.soldCount}
            onChange={(e) => onUpdate(index, 'soldCount', parseInt(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Orden</label>
          <input
            type="number"
            value={product.order}
            onChange={(e) => onUpdate(index, 'order', parseInt(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Activo</label>
          <input
            type="checkbox"
            checked={product.active}
            onChange={(e) => onUpdate(index, 'active', e.target.checked)}
          />
        </div>
      </div>

      <button className="btn-remove" onClick={() => onRemove(index)}>
        <Trash2 size={16} />
        Eliminar
      </button>
    </div>
  );
};

// Preview de producto
const ProductPreview = ({ product }) => {
  return (
    <div className="product-preview-card">
      <div className="preview-amount">{product.customAmount} Robux</div>
      <div className="preview-price">${product.customPrice}</div>
      <div className="preview-sold">{product.soldCount} vendidos</div>
      <div className="preview-status">{product.active ? '✅ Activo' : '❌ Inactivo'}</div>
    </div>
  );
};

// Modal para crear/editar slide
const SlideModal = ({ slide, onSave, onClose }) => {
  const [formData, setFormData] = useState(
    slide || {
      type: 'corporate',
      title: '',
      description: '',
      image: '',
      buttons: [],
      active: true,
      order: 1
    }
  );
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(slide?.image || '');

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

    setImageFile(file);
    
    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!imageFile) return formData.image;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', imageFile); // Cambié 'file' por 'image'

      const response = await fetch(`${API_CONFIG.BASE_URL}/upload/product-image`, {
        method: 'POST',
        body: uploadFormData
      });

      const data = await response.json();
      console.log('📦 Respuesta del upload:', data);
      
      if (data.success && data.data) {
        // Construir URL completa
        const fullUrl = `${API_CONFIG.SERVER_URL}${data.data.url}`;
        console.log('🔗 URL completa:', fullUrl);
        return fullUrl;
      } else {
        throw new Error('Error al subir imagen');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📤 Iniciando guardado de slide...');
    
    // Si hay una imagen nueva, subirla primero
    let imageUrl = formData.image;
    if (imageFile) {
      console.log('📸 Subiendo imagen...');
      imageUrl = await uploadImage();
      console.log('✅ Imagen subida:', imageUrl);
      if (!imageUrl) {
        console.error('❌ Falló el upload de imagen');
        return; // Si falla el upload, no guardar
      }
    }

    // Validar que haya imagen
    if (!imageUrl) {
      alert('Por favor selecciona una imagen para el slide');
      return;
    }

    const slideToSave = { ...formData, image: imageUrl };
    console.log('📋 Datos del slide a guardar:', slideToSave);
    
    onSave(slideToSave);
  };

  const handleAddButton = () => {
    setFormData({
      ...formData,
      buttons: [
        ...formData.buttons,
        { text: '', url: '' }
      ]
    });
  };

  const handleUpdateButton = (index, field, value) => {
    const updated = [...formData.buttons];
    updated[index][field] = value;
    setFormData({ ...formData, buttons: updated });
  };

  const handleRemoveButton = (index) => {
    setFormData({
      ...formData,
      buttons: formData.buttons.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{slide ? 'Editar Slide' : 'Crear Slide'}</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="slide-form">
          <div className="form-group">
            <label>Tipo de Slide</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="corporate">Corporativo (con texto y botones)</option>
              <option value="custom">Personalizado (solo imagen)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Imagen del Slide</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input"
            />
            {imagePreview && (
              <div className="image-preview-container">
                <img src={imagePreview} alt="Preview" className="image-preview" />
              </div>
            )}
            <small style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
              Tamaño recomendado: 1200x600px (max 5MB)
            </small>
          </div>

          {formData.type === 'corporate' && (
            <>
              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Robux Premium Bundle"
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Get the best value..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Botones</label>
                {formData.buttons.map((button, index) => (
                  <div key={index} className="button-editor">
                    <input
                      type="text"
                      value={button.text}
                      onChange={(e) => handleUpdateButton(index, 'text', e.target.value)}
                      placeholder="Texto del botón"
                      style={{ flex: '1' }}
                    />
                    <select
                      value={button.url}
                      onChange={(e) => handleUpdateButton(index, 'url', e.target.value)}
                      style={{ flex: '1' }}
                    >
                      <option value="">Selecciona destino</option>
                      <option value="/robux">Robux</option>
                      <option value="/catalogo">Catálogo</option>
                      <option value="/game/csgo">CS:GO</option>
                      <option value="/game/knivesout">Knives Out</option>
                    </select>
                    <button type="button" className="btn-remove-small" onClick={() => handleRemoveButton(index)}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn-add-small" onClick={handleAddButton}>
                  <Plus size={16} />
                  Agregar Botón
                </button>
              </div>
            </>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Orden</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                min="1"
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                Activo
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={uploading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={uploading}>
              <Save size={20} />
              {uploading ? 'Subiendo...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminHomeConfig;
