import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, X } from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './AdminProducts.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  // Solo productos Robux (In-Game tiene su propia página)
  const [primaryCurrency, setPrimaryCurrency] = useState({ code: 'PEN', symbol: 'S/' });
  const [formData, setFormData] = useState({
    amount: '',
    price: '',
    discount: 0,
    popular: false
  });
  const { getAuthHeaders } = useAdminAuth();

  useEffect(() => {
    fetchProducts();
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

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS.ROBUX}`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Preparar datos - guardar precio directamente sin conversión
      const productData = {
        ...formData,
        currency: primaryCurrency.code // Guardar con la moneda configurada
      };
      
      const url = editingProduct
        ? `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS.UPDATE_ROBUX(editingProduct.id)}`
        : `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS.CREATE_ROBUX}`;
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(productData)
      });

      const data = await response.json();
      
      if (data.success) {
        fetchProducts();
        closeModal();
        alert(editingProduct ? '✅ Producto actualizado' : '✅ Producto creado');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar el producto');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS.DELETE_ROBUX(id)}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      const data = await response.json();
      
      if (data.success) {
        fetchProducts();
        alert('✅ Producto eliminado');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar el producto');
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        amount: product.amount,
        price: product.price,
        discount: product.discount || 0,
        popular: product.popular || false
      });
    } else {
      setEditingProduct(null);
      setFormData({
        amount: '',
        price: '',
        discount: 0,
        popular: false
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  return (
    <div className="admin-products">
      <div className="admin-section">
        <div className="section-header">
          <div>
            <h2>💎 Paquetes de Robux</h2>
            <p>Administra los paquetes de Robux de la tienda</p>
          </div>
          <button className="btn-create" onClick={() => openModal()}>
            <Plus size={18} />
            Nuevo Paquete
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Cargando productos...</div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              {product.popular && (
                <div className="popular-badge">⭐ Popular</div>
              )}
              
              <div className="product-icon">
                <Package size={32} />
              </div>
              <div className="product-amount">{product.amount ? product.amount.toLocaleString() : '0'} Robux</div>
              
              <div className="product-price">
                {primaryCurrency.symbol}{product.price}
                {product.discount > 0 && (
                  <span className="discount-badge">-{product.discount}%</span>
                )}
              </div>
              
              {product.currency && (
                <div className="product-currency">{product.currency}</div>
              )}

              <div className="product-actions">
                <button
                  className="btn-edit"
                  onClick={() => openModal(product)}
                >
                  <Edit2 size={16} />
                  Editar
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(product.id)}
                >
                  <Trash2 size={16} />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Editar Producto' : 'Crear Producto'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Cantidad de Robux *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                  min="1"
                  placeholder="1000"
                />
              </div>

              <div className="form-group">
                <label>Precio ({primaryCurrency.code}) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                  min="0.01"
                  placeholder={`Ej: 37.00 ${primaryCurrency.code}`}
                />
                <small style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: '4px', display: 'block'}}>
                  El precio se guardará en {primaryCurrency.code} sin conversión
                </small>
              </div>

              <div className="form-group">
                <label>Descuento (%)</label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({...formData, discount: e.target.value})}
                  min="0"
                  max="100"
                  placeholder="0"
                />
              </div>

              <div className="form-group-checkbox">
                <input
                  type="checkbox"
                  id="popular"
                  checked={formData.popular}
                  onChange={(e) => setFormData({...formData, popular: e.target.checked})}
                />
                <label htmlFor="popular">⭐ Marcar como popular (aparecerá destacado en el Home)</label>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn-cancel">
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
