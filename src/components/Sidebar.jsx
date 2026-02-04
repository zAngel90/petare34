import { NavLink, useSearchParams } from 'react-router-dom';
import {
  Coins,
  Gamepad2,
  Crown,
  Gift,
  Star,
  User,
  TrendingUp,
  Flame,
  LayoutGrid
} from 'lucide-react';
import './Sidebar.css';

const categories = [
  { id: 'robux', name: 'Robux', icon: 'Crown', count: '10+' },
  { id: 'gamepasses', name: 'Game Passes', icon: 'Gamepad2', count: '50+' },
  { id: 'limiteds', name: 'Limiteds', icon: 'Star', count: '30+' },
  { id: 'giftcards', name: 'Gift Cards', icon: 'Gift', count: '15+' },
  { id: 'premium', name: 'Premium', icon: 'Crown', count: '5+' }
];

const iconMap = {
  Coins: Coins,
  Gamepad2: Gamepad2,
  Crown: Crown,
  Gift: Gift,
  Star: Star,
  User: User
};

const Sidebar = () => {
  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get('categoria') || '';

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">
          <Flame size={18} />
          Destacados
        </h3>
        <div className="sidebar-links">
          <NavLink to="/catalogo" className={`sidebar-link highlight ${!currentCategory ? 'active' : ''}`}>
            <LayoutGrid size={18} />
            <span>Todos los Productos</span>
          </NavLink>
          <NavLink to="/catalogo?popular=true" className="sidebar-link">
            <TrendingUp size={18} />
            <span>Lo mas vendido</span>
          </NavLink>
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">Categorias</h3>
        <div className="sidebar-links">
          {categories.map((category) => {
            const IconComponent = iconMap[category.icon] || Coins;
            const isActive = currentCategory === category.id;
            return (
              <NavLink
                key={category.id}
                to={`/catalogo?categoria=${category.id}`}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <IconComponent size={18} />
                <span>{category.name}</span>
                <span className="category-count">{category.count}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      <div className="sidebar-promo">
        <div className="promo-content">
          <span className="promo-badge">-20%</span>
          <h4>Oferta Especial</h4>
          <p>En paquetes de 4500+ Robux</p>
          <NavLink to="/catalogo?categoria=robux" className="promo-btn">
            Ver Ofertas
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
