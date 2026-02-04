import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAdmin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '12px' }}>
            Verificando acceso...
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            Cargando panel administrativo
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    // Redirigir a login si no está autenticado
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
