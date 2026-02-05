import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, Package } from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './AdminInGameProducts.css';

const AdminInGameProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [primaryCurrency, setPrimaryCurrency] = useState({ code: 'PEN', symbol: 'S/' });
  const { getAuthHeaders } = useAdminAuth();

  const [formData, setFormData] = useState({
    game: '',
    itemName: '',
    itemType: '',
    robuxAmount: '',
    price: '',
    description: '',
    image: '',
    rarity: '',
    isLimited: false,
    active: true
  });

  const rarities = ['COMMON', 'RARE', 'LEGENDARY', 'MYTHIC'];
  const itemTypes = ['Frutas', 'Pases', 'Mascotas', 'Armas', 'Items', 'Otros'];

  useEffect(() => {
    loadCategories();
    loadProducts();
    loadPrimaryCurrency();
  }, []);

  const loadPrimaryCurrency = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/currencies`);
      const data = await response.json();
      if (data.success) {
        const primary = data.data.find(c => c.isPrimary && c.active);
        if (primary) {
          setPrimaryCurrency({ code: primary.code, symbol: primary.symbol });
        }
      }
    } catch (error) {
      console.error('Error cargando moneda:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/categories`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data.filter(cat => cat.active));
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/products/ingame`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        game: product.game,
        itemName: product.itemName,
        itemType: product.itemType || '',
        robuxAmount: product.robuxAmount,
        price: product.price,
        description: product.description || '',
        image: product.image || '',
        rarity: product.rarity || '',
        isLimited: product.isLimited || false,
        active: product.active !== false
      });
    } else {
      setEditingProduct(null);
      setFormData({
        game: categories[0]?.slug || '',
        itemName: '',
        itemType: '',
        robuxAmount: '',
        price: '',
        description: '',
        image: '',
        rarity: '',
        isLimited: false,
        active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      game: '',
      itemName: '',
      itemType: '',
      robuxAmount: '',
      price: '',
      description: '',
      image: '',
      rarity: '',
      isLimited: false,
      active: true
    });
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

      const response = await fetch(`${API_CONFIG.BASE_URL}/upload/ingame-image`, {
        method: 'POST',
        headers: authHeaders,
        body: formDataUpload
      });

      const data = await response.json();

      if (data.success) {
        // Construir URL completa con SERVER_URL
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

    // Validar campos requeridos (robuxAmount es opcional para Limiteds)
    if (!formData.itemName || !formData.price) {
      setMessage({ type: 'error', text: '❌ Completa todos los campos requeridos' });
      return;
    }

    if (!formData.isLimited && !formData.robuxAmount) {
      setMessage({ type: 'error', text: '❌ La cantidad de Robux es requerida para productos regulares' });
      return;
    }

    if (!formData.isLimited && !formData.game) {
      setMessage({ type: 'error', text: '❌ Debes seleccionar un juego o marcar como Limited' });
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        game: formData.isLimited ? 'limiteds' : formData.game
      };

      const url = editingProduct
        ? `${API_CONFIG.BASE_URL}/products/ingame/${editingProduct.id}`
        : `${API_CONFIG.BASE_URL}/products/ingame`;

      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `✅ Producto ${editingProduct ? 'actualizado' : 'creado'} correctamente`
        });
        loadProducts();
        setTimeout(() => handleCloseModal(), 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar' });
      }
    } catch (error) {
      console.error('Error guardando producto:', error);
      setMessage({ type: 'error', text: 'Error de conexión' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/products/ingame/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '✅ Producto eliminado' });
        loadProducts();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error eliminando producto:', error);
    }
  };

  const productsByGame = products.reduce((acc, product) => {
    if (!acc[product.game]) {
      acc[product.game] = [];
    }
    acc[product.game].push(product);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="admin-section">
        <h2>Cargando productos...</h2>
      </div>
    );
  }

  return (
    <div className="ingame-products-container">
      <div className="admin-section">
        <div className="products-header">
          <div>
            <h2>Productos In-Game</h2>
            <p>Gestiona los items de cada juego</p>
          </div>
          <button className="btn-add-product" onClick={() => handleOpenModal()}>
            <Plus size={20} />
            Nuevo Producto
          </button>
        </div>
      </div>

      {message.text && !showModal && (
        <div className={`products-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {Object.keys(productsByGame).length === 0 ? (
        <div className="products-empty">
          <Package size={64} />
          <h3>No hay productos</h3>
          <p>Crea productos para tus juegos</p>
        </div>
      ) : (
        <div className="products-by-game">
          {Object.entries(productsByGame).map(([gameSlug, gameProducts]) => {
            const category = categories.find(c => c.slug === gameSlug);
            return (
              <div key={gameSlug} className="game-products-section">
                <div className="game-section-header">
                  {category && <img src={category.image} alt={category.name} className="game-icon" />}
                  <h3>{category?.name || gameSlug}</h3>
                  <span className="products-count">{gameProducts.length} productos</span>
                </div>

                <div className="products-grid">
                  {gameProducts.map((product) => (
                    <div key={product.id} className={`product-card ${!product.active ? 'inactive' : ''}`}>
                      <div className="product-image-wrapper">
                        {product.image ? (
                          <img src={product.image} alt={product.itemName} className="product-image" />
                        ) : (
                          <div className="product-no-image">
                            <ImageIcon size={32} />
                          </div>
                        )}
                        {product.rarity ? (
                          <span className={`rarity-badge ${product.rarity.toLowerCase()}`}>
                            {product.rarity}
                          </span>
                        ) : (
                          <span className="no-rarity-badge">
                            Sin rareza
                          </span>
                        )}
                      </div>

                      <div className="product-info">
                        <h4>{product.itemName}</h4>
                        <p className="product-type">{product.itemType}</p>
                        <div className="product-prices">
                          <span className="robux-price">
                            <img src="/robux-logo.svg" alt="R$" style={{width: '16px', height: '16px'}} />
                            {product.robuxAmount.toLocaleString()}
                          </span>
                          <span className="usd-price">${parseFloat(product.price || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="product-actions">
                        <button
                          className="product-action-btn edit"
                          onClick={() => handleOpenModal(product)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="product-action-btn delete"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="product-modal-overlay">
          <div className="product-modal">
            <div className="product-modal-header">
              <h3>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>×</button>
            </div>

            {message.text && (
              <div className={`products-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Juego {!formData.isLimited && '*'}</label>
                  <select
                    value={formData.game}
                    onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                    required={!formData.isLimited}
                    disabled={formData.isLimited}
                  >
                    <option value="">{formData.isLimited ? 'No aplica para Limiteds' : 'Selecciona un juego'}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                  {formData.isLimited && (
                    <small style={{ color: 'rgba(255, 215, 0, 0.7)', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                      Los objetos Limited se muestran en una sección especial independiente de juegos
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Tipo de Item *</label>
                  <input
                    type="text"
                    placeholder="Ej: Frutas, Armas, Espadas, Mascotas, etc."
                    value={formData.itemType}
                    onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
                    required
                    list="itemtype-suggestions"
                  />
                  <datalist id="itemtype-suggestions">
                    {itemTypes.map((type) => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                  <small style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                    Puedes escribir cualquier tipo personalizado
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label>Nombre del Item *</label>
                <input
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  placeholder="Ej: Dragon Fruit, Shadow Blade"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cantidad de Robux {!formData.isLimited && '*'}</label>
                  <input
                    type="number"
                    value={formData.robuxAmount}
                    onChange={(e) => setFormData({ ...formData, robuxAmount: e.target.value })}
                    placeholder={formData.isLimited ? "Opcional para Limiteds" : "1000"}
                    required={!formData.isLimited}
                  />
                  {formData.isLimited && (
                    <small style={{ color: 'rgba(255, 215, 0, 0.7)', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                      Para Limiteds este campo es opcional
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Precio ({primaryCurrency.code}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder={`Ej: 37.00 ${primaryCurrency.code}`}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Rareza (Opcional)</label>
                  <input
                    type="text"
                    value={formData.rarity}
                    onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                    placeholder="Escribe o selecciona: COMMON, RARE, etc."
                    list="rarity-suggestions"
                  />
                  <datalist id="rarity-suggestions">
                    <option value="" />
                    {rarities.map((rarity) => (
                      <option key={rarity} value={rarity} />
                    ))}
                  </datalist>
                  <small style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                    Puedes escribir cualquier rareza personalizada o dejar vacío
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label>Imagen del Producto</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="file-input"
                />
                <span className="form-hint">
                  Formatos: JPG, PNG. Máximo 5MB.
                </span>
              </div>

              {formData.image && (
                <div className="image-preview">
                  <label>Vista Previa</label>
                  <img src={formData.image} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
                </div>
              )}

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción opcional del item"
                  rows="3"
                />
              </div>

              <div className="form-group-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isLimited}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      isLimited: e.target.checked,
                      game: e.target.checked ? '' : formData.game
                    })}
                  />
                  <span>🔥 Objeto Limited (aparecerá en sección especial)</span>
                </label>
              </div>

              <div className="form-group-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <span>Producto activo</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel-modal" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save-modal">
                  {editingProduct ? 'Actualizar' : 'Crear'} Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInGameProducts;
