import { useState } from 'react';
import { ShoppingCart, Heart, Star, TrendingUp } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product, type = 'default' }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || product.gameImage,
      type: type
    });
    setTimeout(() => setIsAdding(false), 500);
  };

  const renderRobuxCard = () => (
    <div className={`product-card robux-card ${product.popular ? 'popular' : ''}`}>
      {product.popular && (
        <div className="popular-badge">
          <TrendingUp size={14} />
          Popular
        </div>
      )}
      {product.discount > 0 && (
        <div className="discount-badge">-{product.discount}%</div>
      )}

      <div className="robux-icon">
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="36" fill="url(#robuxGradient)" />
          <path d="M40 20L50 30L40 60L30 30L40 20Z" fill="#fff" opacity="0.9"/>
          <circle cx="40" cy="35" r="8" fill="#1a1a2e" opacity="0.3"/>
          <defs>
            <linearGradient id="robuxGradient" x1="4" y1="4" x2="76" y2="76">
              <stop stopColor="#00D4AA"/>
              <stop offset="1" stopColor="#00A3FF"/>
            </linearGradient>
          </defs>
        </svg>
        {product.bonus > 0 && (
          <span className="bonus-tag">+{product.bonus} bonus</span>
        )}
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <div className="robux-amount">{product.robux.toLocaleString()} R$</div>
      </div>

      <div className="product-pricing">
        {product.originalPrice > product.price && (
          <span className="original-price">${parseFloat(product.originalPrice || 0).toFixed(2)}</span>
        )}
        <span className="current-price">${parseFloat(product.price || 0).toFixed(2)}</span>
      </div>

      <button
        className={`add-to-cart-btn ${isAdding ? 'adding' : ''}`}
        onClick={handleAddToCart}
      >
        <ShoppingCart size={18} />
        {isAdding ? 'Agregado!' : 'Agregar'}
      </button>
    </div>
  );

  const renderGamePassCard = () => (
    <div className="product-card gamepass-card">
      {product.discount > 0 && (
        <div className="discount-badge">-{product.discount}%</div>
      )}

      <button
        className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
        onClick={() => setIsWishlisted(!isWishlisted)}
      >
        <Heart size={18} fill={isWishlisted ? '#ff6b6b' : 'none'} />
      </button>

      <div className="gamepass-image">
        <div className="game-badge">{product.game}</div>
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>

        <div className="product-meta">
          <div className="rating">
            <Star size={14} fill="#ffd700" stroke="#ffd700" />
            <span>{product.rating}</span>
          </div>
          <span className="sales">{product.sales.toLocaleString()} ventas</span>
        </div>
      </div>

      <div className="product-footer">
        <div className="product-pricing">
          {product.originalPrice > product.price && (
            <span className="original-price">${parseFloat(product.originalPrice || 0).toFixed(2)}</span>
          )}
          <span className="current-price">${parseFloat(product.price || 0).toFixed(2)}</span>
        </div>

        <button
          className={`add-to-cart-btn compact ${isAdding ? 'adding' : ''}`}
          onClick={handleAddToCart}
        >
          <ShoppingCart size={16} />
        </button>
      </div>
    </div>
  );

  const renderLimitedCard = () => (
    <div className={`product-card limited-card ${product.trending ? 'trending' : ''}`}>
      {product.trending && (
        <div className="trending-badge">
          <TrendingUp size={14} />
          Trending
        </div>
      )}
      {product.discount > 0 && (
        <div className="discount-badge">-{product.discount}%</div>
      )}

      <button
        className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
        onClick={() => setIsWishlisted(!isWishlisted)}
      >
        <Heart size={18} fill={isWishlisted ? '#ff6b6b' : 'none'} />
      </button>

      <div className="limited-image">
        {product.rarity && (
          <div 
            className="rarity-badge"
            style={{ 
              background: product.rarityColor || '#ff6b6b',
              boxShadow: `0 2px 8px ${product.rarityColor || '#ff6b6b'}60`
            }}
          >
            {product.rarity}
          </div>
        )}
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <span className="product-type">{product.type}</span>

        <div className="limited-stats">
          <div className="stat">
            <span className="stat-label">RAP</span>
            <span className="stat-value">{product.rap.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Demand</span>
            <span className={`stat-value demand-${product.demand.toLowerCase().replace(' ', '-')}`}>
              {product.demand}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Copies</span>
            <span className="stat-value">{product.copies.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="product-footer">
        <div className="product-pricing">
          {product.originalPrice > product.price && (
            <span className="original-price">${parseFloat(product.originalPrice || 0).toFixed(2)}</span>
          )}
          <span className="current-price">${parseFloat(product.price || 0).toFixed(2)}</span>
        </div>

        <button
          className={`add-to-cart-btn compact ${isAdding ? 'adding' : ''}`}
          onClick={handleAddToCart}
        >
          <ShoppingCart size={16} />
        </button>
      </div>
    </div>
  );

  const renderDefaultCard = () => (
    <div className="product-card default-card">
      {product.discount > 0 && (
        <div className="discount-badge">-{product.discount}%</div>
      )}

      <div className="product-image">
        <img src={product.image} alt={product.name} />
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        {product.description && (
          <p className="product-description">{product.description}</p>
        )}
      </div>

      <div className="product-footer">
        <div className="product-pricing">
          {product.originalPrice > product.price && (
            <span className="original-price">${parseFloat(product.originalPrice || 0).toFixed(2)}</span>
          )}
          <span className="current-price">${parseFloat(product.price || 0).toFixed(2)}</span>
        </div>

        <button
          className={`add-to-cart-btn compact ${isAdding ? 'adding' : ''}`}
          onClick={handleAddToCart}
        >
          <ShoppingCart size={16} />
        </button>
      </div>
    </div>
  );

  switch (type) {
    case 'robux':
      return renderRobuxCard();
    case 'gamepass':
      return renderGamePassCard();
    case 'limited':
      return renderLimitedCard();
    default:
      return renderDefaultCard();
  }
};

export default ProductCard;
