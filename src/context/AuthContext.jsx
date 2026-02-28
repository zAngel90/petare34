import { createContext, useContext, useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay token guardado
    const savedToken = localStorage.getItem('user-token');
    if (savedToken) {
      verifyToken(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/user-auth/verify`, {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        setToken(tokenToVerify);
      } else {
        // Token inválido, limpiar
        localStorage.removeItem('user-token');
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      localStorage.removeItem('user-token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/user-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        setToken(data.data.token);
        localStorage.setItem('user-token', data.data.token);
        return { success: true, user: data.data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: 'Error de conexión' };
    }
  };

  const register = async (email, password, username, robloxUsername) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/user-auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, username, robloxUsername })
      });

      const data = await response.json();

      if (data.success) {
        // Si requiere verificación de email
        if (data.data.requiresVerification) {
          return { 
            success: true, 
            user: data.data.user,
            requiresVerification: true
          };
        }
        
        // Si no requiere verificación (login directo)
        setUser(data.data.user);
        setToken(data.data.token);
        localStorage.setItem('user-token', data.data.token);
        return { success: true, user: data.data.user, requiresVerification: false };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error en registro:', error);
      return { success: false, error: 'Error de conexión' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user-token');
  };

  const updateProfile = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
  };

  const getAuthHeaders = () => {
    if (!token) return {};
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateProfile,
      getAuthHeaders
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
