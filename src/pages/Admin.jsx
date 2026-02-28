import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  Users,
  CreditCard,
  BarChart3,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  LogOut,
  TrendingUp,
  Grid,
  Home,
  Menu,
  X,
  Mail
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import './Admin.css';
import AdminOrders from '../components/admin/AdminOrders';
import AdminProducts from '../components/admin/AdminProducts';
import AdminUsers from '../components/admin/AdminUsers';
import AdminStats from '../components/admin/AdminStats';
import AdminPaymentMethods from '../components/admin/AdminPaymentMethods';
import AdminChat from '../components/admin/AdminChat';
import AdminOrderChats from '../components/admin/AdminOrderChats';
import AdminExchangeRates from '../components/admin/AdminExchangeRates';
import AdminCategories from '../components/admin/AdminCategories';
import AdminInGameProducts from '../components/admin/AdminInGameProducts';
import AdminCurrencies from '../components/admin/AdminCurrencies';
import AdminHomeConfig from '../components/admin/AdminHomeConfig';
import AdminReviews from '../components/admin/AdminReviews';
import AdminGamepassHelp from '../components/admin/AdminGamepassHelp';
import AdminEmailSettings from '../components/admin/AdminEmailSettings';

const Admin = () => {
  // Recuperar el tab guardado del localStorage o usar 'orders' por defecto
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('adminActiveTab') || 'orders';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  // Guardar el tab activo en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  // Cerrar menú móvil al cambiar de tab
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión?')) {
      logout();
      navigate('/admin/login');
    }
  };

  const tabs = [
    { id: 'stats', label: 'Dashboard', icon: BarChart3 },
    { id: 'orders', label: 'Órdenes', icon: ShoppingBag },
    { id: 'reviews', label: 'Reseñas', icon: FileText },
    { id: 'homeconfig', label: 'Configuración Home', icon: Home },
    { id: 'gamepass-help', label: 'Ayuda Gamepass', icon: FileText },
    { id: 'products', label: 'Productos Robux', icon: DollarSign },
    { id: 'ingame', label: 'Items In-Game', icon: Package },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'payments', label: 'Métodos de Pago', icon: CreditCard },
    { id: 'rates', label: 'Tasas de Cambio', icon: TrendingUp },
    { id: 'currencies', label: 'Monedas', icon: DollarSign },
    { id: 'categories', label: 'Categorías', icon: Grid },
    { id: 'emails', label: 'Configuración Emails', icon: Mail },
    { id: 'chat', label: 'Chat Soporte', icon: FileText },
    { id: 'order-chats', label: 'Chats Pedidos', icon: FileText },
  ];

  return (
    <div className="admin-panel">
      {/* Mobile Header */}
      <div className="admin-mobile-header">
        <button
          className="admin-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="admin-mobile-title">Panel Admin</h1>
        <span className="admin-mobile-tab">{tabs.find(t => t.id === activeTab)?.label}</span>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="admin-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <h2>Panel Admin</h2>
          <p>RLS Store</p>
          <button
            className="admin-sidebar-close"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="admin-nav">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="admin-badge">3</span>
                )}
              </button>
            );
          })}
        </nav>

        <button className="admin-logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-content">
          {activeTab === 'stats' && <AdminStats />}
          {activeTab === 'orders' && <AdminOrders />}
          {activeTab === 'reviews' && <AdminReviews />}
          {activeTab === 'homeconfig' && <AdminHomeConfig />}
          {activeTab === 'gamepass-help' && <AdminGamepassHelp />}
          {activeTab === 'products' && <AdminProducts />}
          {activeTab === 'ingame' && <AdminInGameProducts />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'payments' && <AdminPaymentMethods />}
          {activeTab === 'rates' && <AdminExchangeRates />}
          {activeTab === 'currencies' && <AdminCurrencies />}
          {activeTab === 'categories' && <AdminCategories />}
          {activeTab === 'emails' && <AdminEmailSettings />}
          {activeTab === 'chat' && <AdminChat />}
          {activeTab === 'order-chats' && <AdminOrderChats />}
        </div>
      </main>
    </div>
  );
};

export default Admin;
