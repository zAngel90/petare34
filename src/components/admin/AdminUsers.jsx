import { useState, useEffect } from 'react';
import { Users, Search, Edit2, Trash2, Shield, User, Mail, Calendar } from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { getAuthHeaders } = useAdminAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS_MGMT.BASE}`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    if (!confirm('¿Cambiar rol de este usuario?')) return;
    
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS_MGMT.UPDATE(userId)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ role: newRole })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        fetchUsers();
        alert('✅ Rol actualizado');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Error al actualizar rol');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
    
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS_MGMT.DELETE(userId)}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      const data = await response.json();
      
      if (data.success) {
        fetchUsers();
        alert('✅ Usuario eliminado');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-users">
      <div className="admin-section">
        <div className="section-header">
          <div>
            <h2>Gestión de Usuarios</h2>
            <p>Administra usuarios y sus permisos</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Buscar por email o nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users List */}
      {loading ? (
        <div className="loading-state">Cargando usuarios...</div>
      ) : (
        <div className="users-list">
          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <p>No se encontraron usuarios</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-avatar">
                  {user.role === 'admin' ? <Shield size={24} /> : <User size={24} />}
                </div>
                
                <div className="user-info">
                  <div className="user-name">
                    {user.name || user.email}
                    {user.role === 'admin' && (
                      <span className="admin-badge">ADMIN</span>
                    )}
                  </div>
                  <div className="user-meta">
                    <span>
                      <Mail size={14} />
                      {user.email}
                    </span>
                    {user.createdAt && (
                      <span>
                        <Calendar size={14} />
                        {new Date(user.createdAt).toLocaleDateString('es-ES')}
                      </span>
                    )}
                  </div>
                  {user.totalOrders !== undefined && (
                    <div className="user-stats">
                      <span>Órdenes: {user.totalOrders}</span>
                      {user.totalSpent !== undefined && (
                        <span>Gastado: ${user.totalSpent.toFixed(2)}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="user-actions">
                  <button
                    className="btn-role"
                    onClick={() => handleToggleRole(user.id, user.role)}
                    title={user.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                  >
                    <Shield size={16} />
                    {user.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
