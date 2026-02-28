/**
 * ⚙️ CONFIGURACIÓN CENTRALIZADA DE LA API
 * ==========================================
 * 
 * 📝 INSTRUCCIONES PARA CAMBIAR EL SERVIDOR:
 * 
 * Para cambiar de DESARROLLO a PRODUCCIÓN, solo cambia esta línea:
 * 
 * DESARROLLO:  const BASE_URL = 'http://localhost:3001/api';
 * PRODUCCIÓN:  const BASE_URL = 'https://tudominio.com/api';
 * 
 * ⚠️ IMPORTANTE: Todo lo demás se actualiza automáticamente.
 *    No necesitas cambiar nada más en el código.
 * 
 * Uso en componentes:
 * import { API_CONFIG } from './config/api';
 * fetch(`${API_CONFIG.BASE_URL}/products/robux`);
 */

// 🔧 URL DE PRODUCCIÓN CONFIGURADA
const BASE_URL = 'https://api.rbxlatamstore.com/api';

// Función helper (NO MODIFICAR)
const getBaseURL = () => BASE_URL;

// Variables de entorno (para logs) - Solo usar import.meta.env en Vite
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

/**
 * Configuración principal de API
 * ⚠️ NO MODIFICAR - Se genera automáticamente desde BASE_URL
 */
export const API_CONFIG = {
  // URL base del backend API REST
  BASE_URL: getBaseURL(),
  
  // URL del servidor sin /api al final (para WebSocket, uploads, etc.)
  SERVER_URL: getBaseURL().replace(/\/api$/, ''),
  
  // URL para WebSocket/Socket.IO (alias de SERVER_URL)
  SOCKET_URL: getBaseURL().replace(/\/api$/, ''),
  
  // Endpoints específicos
  ENDPOINTS: {
    // Auth
    AUTH: {
      LOGIN: '/auth/login',
      VERIFY: '/auth/verify',
    },
    
    // User Auth
    USER_AUTH: {
      LOGIN: '/user-auth/login',
      REGISTER: '/user-auth/register',
      VERIFY: '/user-auth/verify',
    },
    
    // Chat
    CHAT: {
      CONVERSATIONS: '/chat/conversations',
      MESSAGES: '/chat/messages',
      CONVERSATION_MESSAGES: (id) => `/chat/conversations/${id}/messages`,
      MARK_READ: (id) => `/chat/conversations/${id}/read`,
      UPDATE_STATUS: (id) => `/chat/conversations/${id}/status`,
    },
    
    // Roblox API Proxy
    USERS: '/users',
    SEARCH_USERS: '/search/users',
    USER_AVATAR: '/thumbnails/avatar',
    USER_PLACES: '/users/places',
    GAMEPASSES: '/gamepasses',
    GAMEPASS_DETAILS: '/gamepasses',
    THUMBNAILS: '/thumbnails',
    THUMBNAILS_ASSETS: '/thumbnails/assets',
    
    // Community Verification
    COMMUNITY: {
      LIST: '/community/communities',
      STATUS: '/community/status',
      CHECK: '/community/check',
      REGISTER: '/community/register',
    },
    
    // Orders
    ORDERS: {
      BASE: '/orders',
      BY_ID: (id) => `/orders/${id}`,
      VERIFY_PAYMENT: (id) => `/orders/${id}/verify-payment`, // ADMIN
      UPDATE_STATUS: (id) => `/orders/${id}/status`, // ADMIN
      DELETE: (id) => `/orders/${id}`, // ADMIN
      STATS: '/orders/stats/summary', // ADMIN
    },
    
    // Order Chat (Chat de pedidos en tiempo real)
    ORDER_CHAT: {
      GET_MESSAGES: '/order-chat',
      SEND_MESSAGE: '/order-chat',
      UPLOAD_FILE: (id) => `/order-chat/${id}/upload`,
      DELETE_CHAT: (id) => `/order-chat/${id}`,
    },
    
    // Products
    PRODUCTS: {
      ROBUX: '/products/robux',
      ROBUX_BY_ID: (id) => `/products/robux/${id}`,
      CREATE_ROBUX: '/products/robux', // ADMIN - POST
      UPDATE_ROBUX: (id) => `/products/robux/${id}`, // ADMIN - PUT
      DELETE_ROBUX: (id) => `/products/robux/${id}`, // ADMIN - DELETE
      INGAME: '/products/ingame',
      CREATE_INGAME: '/products/ingame', // ADMIN - POST
    },
    
    // Payment Methods
    PAYMENT_METHODS: {
      BASE: '/payment-methods',
      BY_ID: (id) => `/payment-methods/${id}`,
      CREATE: '/payment-methods', // ADMIN - POST
      UPDATE: (id) => `/payment-methods/${id}`, // ADMIN - PUT
      DELETE: (id) => `/payment-methods/${id}`, // ADMIN - DELETE
    },
    
    // Users Management
    USERS_MGMT: {
      BASE: '/users',
      BY_ID: (id) => `/users/${id}`,
      BY_EMAIL: (email) => `/users/email/${email}`,
      CREATE: '/users', // POST
      UPDATE: (id) => `/users/${id}`, // ADMIN - PUT
      DELETE: (id) => `/users/${id}`, // ADMIN - DELETE
    },
    
    // Upload
    UPLOAD: {
      PAYMENT_PROOF: '/upload/payment-proof',
      PRODUCT_IMAGE: '/upload/product-image',
    },
  },
  
  // Timeouts
  TIMEOUT: {
    DEFAULT: 30000, // 30 segundos
    LONG: 60000,    // 1 minuto
  },
  
  // Configuración de fetch
  FETCH_CONFIG: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
};

/**
 * Helper para construir URLs completas
 * @param {string} endpoint - Endpoint relativo
 * @param {object} params - Parámetros de query string
 * @returns {string} URL completa
 */
export const buildURL = (endpoint, params = {}) => {
  const url = new URL(endpoint, API_CONFIG.BASE_URL);
  
  // Añadir parámetros de query string
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
};

/**
 * Helper para hacer fetch con configuración por defecto
 * @param {string} url - URL del endpoint
 * @param {object} options - Opciones de fetch
 * @returns {Promise} Respuesta del fetch
 */
export const apiFetch = async (url, options = {}) => {
  const config = {
    ...API_CONFIG.FETCH_CONFIG,
    ...options,
    headers: {
      ...API_CONFIG.FETCH_CONFIG.headers,
      ...(options.headers || {}),
    },
  };
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
};

/**
 * URLs de CDN externos (no cambian por entorno)
 */
export const CDN_URLS = {
  ROBLOX: 'https://tr.rbxcdn.com',
  ROBLOX_STATIC: 'https://static.wikia.nocookie.net',
  DICEBEAR: 'https://api.dicebear.com',
  UNSPLASH: 'https://images.unsplash.com',
  POSTIMG: 'https://i.postimg.cc',
  WIKIPEDIA: 'https://upload.wikimedia.org',
};

/**
 * Logs de configuración (solo en desarrollo)
 */
if (isDevelopment) {
  console.log('🔧 API Configuration:', {
    baseURL: API_CONFIG.BASE_URL,
    environment: isProduction ? 'production' : 'development',
  });
}

export default API_CONFIG;
