import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Calendar,
  Package,
  Zap,
  Star
} from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revenueByCategory, setRevenueByCategory] = useState(null);
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [resetting, setResetting] = useState(false);
  const { getAuthHeaders } = useAdminAuth();

  useEffect(() => {
    fetchStats();
    fetchRevenueByCategory();
  }, [dateFilter, customStartDate, customEndDate]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS.STATS}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueByCategory = async () => {
    try {
      // Obtener todas las órdenes completadas
      const response = await fetch(`${API_CONFIG.BASE_URL}/orders?status=completed`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.success) {
        const orders = data.data;
        
        // Filtrar por fecha
        const filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          const now = new Date();
          
          switch (dateFilter) {
            case 'today':
              return orderDate.toDateString() === now.toDateString();
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return orderDate >= weekAgo;
            case 'month':
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              return orderDate >= monthAgo;
            case 'custom':
              if (customStartDate && customEndDate) {
                const start = new Date(customStartDate);
                const end = new Date(customEndDate);
                return orderDate >= start && orderDate <= end;
              }
              return true;
            default:
              return true;
          }
        });
        
        // Calcular revenue por categoría
        const revenue = {
          robux: 0,
          ingame: 0,
          limiteds: 0,
          total: 0,
          count: {
            robux: 0,
            ingame: 0,
            limiteds: 0,
            total: 0
          }
        };
        
        filteredOrders.forEach(order => {
          const price = parseFloat(order.price) || 0;
          revenue.total += price;
          revenue.count.total++;
          
          if (order.productType === 'robux') {
            revenue.robux += price;
            revenue.count.robux++;
          } else if (order.productDetails?.isLimited) {
            revenue.limiteds += price;
            revenue.count.limiteds++;
          } else {
            revenue.ingame += price;
            revenue.count.ingame++;
          }
        });
        
        setRevenueByCategory(revenue);
      }
    } catch (error) {
      console.error('Error fetching revenue:', error);
    }
  };

  const handleResetOrders = async () => {
    if (!confirm('⚠️ ¿Estás seguro de que quieres ELIMINAR TODAS LAS ÓRDENES?\n\nEsta acción NO se puede deshacer.\n\n- Se eliminarán todas las órdenes de prueba\n- El revenue volverá a 0\n- Los datos no se pueden recuperar')) {
      return;
    }

    setResetting(true);
    try {
      // Obtener todas las órdenes
      const response = await fetch(`${API_CONFIG.BASE_URL}/orders`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.success) {
        const orders = data.data;
        
        // Eliminar cada orden
        for (const order of orders) {
          await fetch(`${API_CONFIG.BASE_URL}/orders/${order.id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
        }
        
        alert('✅ Todas las órdenes han sido eliminadas exitosamente');
        
        // Recargar estadísticas
        fetchStats();
        fetchRevenueByCategory();
      }
    } catch (error) {
      console.error('Error resetting orders:', error);
      alert('❌ Error al eliminar órdenes');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-section">
        <h2>Cargando estadísticas...</h2>
      </div>
    );
  }

  // Función para formatear precios con separadores de miles
  const formatRevenue = (amount) => {
    if (!amount && amount !== 0) return '0.00';
    const num = parseFloat(amount);
    return num.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const statCards = [
    {
      label: 'Esperando Verificación',
      value: stats?.awaitingVerification || 0,
      icon: Clock,
      color: '#ff9500',
      change: null
    },
    {
      label: 'En Proceso',
      value: stats?.processing || 0,
      icon: ShoppingBag,
      color: '#007aff',
      change: null
    },
    {
      label: 'Completadas',
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: '#00d084',
      change: null
    },
    {
      label: 'Rechazadas',
      value: stats?.rejected || 0,
      icon: XCircle,
      color: '#ff4757',
      change: null
    },
    {
      label: 'Revenue Total',
      value: `S/${formatRevenue(stats?.totalRevenue)}`,
      icon: DollarSign,
      color: '#ffd16d',
      change: null
    },
    {
      label: 'Revenue Pendiente',
      value: `S/${formatRevenue(stats?.pendingRevenue)}`,
      icon: TrendingUp,
      color: '#ff9500',
      change: null
    },
  ];

  return (
    <div>
      <div className="admin-section">
        <h2>Dashboard</h2>
        <p>Resumen general de la tienda</p>
      </div>

      <div className="admin-stats-grid">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">{card.label}</span>
                <div className="stat-card-icon" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="stat-card-value">{card.value}</div>
              {card.change && (
                <div className={`stat-card-change ${card.change < 0 ? 'negative' : ''}`}>
                  {card.change > 0 ? '+' : ''}{card.change}% vs mes anterior
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Revenue por Categoría */}
      <div className="admin-section revenue-section">
        <div className="revenue-header">
          <div>
            <h2>
              <DollarSign size={24} />
              Revenue por Categoría
            </h2>
            <p>Ingresos desglosados por tipo de producto</p>
          </div>
          
          {/* Filtros de Fecha */}
          <div className="date-filters">
            <button 
              className="btn-reset-orders"
              onClick={handleResetOrders}
              disabled={resetting}
              title="Eliminar todas las órdenes de prueba"
            >
              {resetting ? '⏳ Eliminando...' : '🗑️ Resetear Órdenes'}
            </button>
            
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="date-filter-select"
            >
              <option value="all">Todo el tiempo</option>
              <option value="today">Hoy</option>
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
              <option value="custom">Personalizado</option>
            </select>
            
            {dateFilter === 'custom' && (
              <div className="custom-date-inputs">
                <input 
                  type="date" 
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="date-input"
                />
                <span>a</span>
                <input 
                  type="date" 
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="date-input"
                />
              </div>
            )}
          </div>
        </div>

        {revenueByCategory && (
          <div className="revenue-grid">
            {/* Robux */}
            <div className="revenue-card robux-card">
              <div className="revenue-card-icon">
                <Zap size={28} />
              </div>
              <div className="revenue-card-content">
                <h3>Robux</h3>
                <div className="revenue-amount">S/{formatRevenue(revenueByCategory.robux)}</div>
                <div className="revenue-count">{revenueByCategory.count.robux} órdenes</div>
                <div className="revenue-percentage">
                  {revenueByCategory.total > 0 
                    ? ((revenueByCategory.robux / revenueByCategory.total) * 100).toFixed(1)
                    : 0}% del total
                </div>
              </div>
            </div>

            {/* In-Game */}
            <div className="revenue-card ingame-card">
              <div className="revenue-card-icon">
                <Package size={28} />
              </div>
              <div className="revenue-card-content">
                <h3>In-Game Items</h3>
                <div className="revenue-amount">S/{formatRevenue(revenueByCategory.ingame)}</div>
                <div className="revenue-count">{revenueByCategory.count.ingame} órdenes</div>
                <div className="revenue-percentage">
                  {revenueByCategory.total > 0 
                    ? ((revenueByCategory.ingame / revenueByCategory.total) * 100).toFixed(1)
                    : 0}% del total
                </div>
              </div>
            </div>

            {/* Limiteds */}
            <div className="revenue-card limiteds-card">
              <div className="revenue-card-icon">
                <Star size={28} />
              </div>
              <div className="revenue-card-content">
                <h3>Limiteds</h3>
                <div className="revenue-amount">S/{formatRevenue(revenueByCategory.limiteds)}</div>
                <div className="revenue-count">{revenueByCategory.count.limiteds} órdenes</div>
                <div className="revenue-percentage">
                  {revenueByCategory.total > 0 
                    ? ((revenueByCategory.limiteds / revenueByCategory.total) * 100).toFixed(1)
                    : 0}% del total
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="revenue-card total-card">
              <div className="revenue-card-icon">
                <DollarSign size={28} />
              </div>
              <div className="revenue-card-content">
                <h3>Total Revenue</h3>
                <div className="revenue-amount">S/{formatRevenue(revenueByCategory.total)}</div>
                <div className="revenue-count">{revenueByCategory.count.total} órdenes</div>
                <div className="revenue-percentage">100% del período</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="admin-section">
        <h2>Total de Órdenes</h2>
        <div style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', marginTop: '16px' }}>
          {stats?.total || 0}
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
