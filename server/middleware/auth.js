/**
 * Middleware de Autenticación y Autorización
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rls-store-secret-key-2024';

// Verificar si el usuario está autenticado
export const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false, 
      error: 'No autorizado - Token requerido' 
    });
  }
  
  // Formato: "Bearer TOKEN"
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token inválido' 
    });
  }
  
  try {
    // Verificar JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.error('Error verificando token:', error.message);
    return res.status(401).json({ 
      success: false, 
      error: 'Token inválido o expirado' 
    });
  }
};

// Verificar si el usuario es admin
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'No autorizado' 
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Acceso denegado - Se requieren permisos de administrador' 
    });
  }
  
  next();
};

// Middleware combinado: autenticado + admin
export const requireAdmin = [isAuthenticated, isAdmin];

// Verificar propiedad de recurso (usuario puede ver solo sus datos)
export const isOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'No autorizado' 
    });
  }
  
  const resourceId = req.params.id || req.params.userId;
  
  // Admin puede ver todo
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Usuario solo puede ver sus propios recursos
  if (req.user.id === resourceId) {
    return next();
  }
  
  return res.status(403).json({ 
    success: false, 
    error: 'Acceso denegado - No tienes permisos para este recurso' 
  });
};

// Log de acciones admin (para auditoría)
export const logAdminAction = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    const action = {
      admin: req.user.email,
      method: req.method,
      path: req.path,
      body: req.method !== 'GET' ? req.body : null,
      timestamp: new Date().toISOString()
    };
    
    console.log('🔐 Admin Action:', JSON.stringify(action, null, 2));
    
    // TODO: Guardar en base de datos para auditoría
  }
  
  next();
};
