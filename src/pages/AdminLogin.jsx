import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { API_CONFIG } from '../config/api';
import { Shield, Lock, User } from 'lucide-react';
import './AdminLogin.css';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Llamar al endpoint de login real
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success) {
        // Guardar token JWT
        login(data.data.token);
        navigate('/admin');
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error de conexión. Verifica que el servidor esté activo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <div className="admin-login-icon">
            <Shield size={48} />
          </div>
          <h1>Panel Administrativo</h1>
          <p>RLS Store</p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <User size={18} />
              <span>Email</span>
            </label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <Lock size={18} />
              <span>Contraseña</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>

          <div className="login-footer">
            <p>🔒 Acceso solo para administradores</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
