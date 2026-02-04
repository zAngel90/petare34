# 📘 Guía de Uso de API Centralizada

## 🎯 Objetivo

Esta guía explica cómo usar la configuración centralizada de API para evitar URLs hardcodeadas en el código.

---

## 📁 Archivos Principales

### 1. **`src/config/api.js`** - Configuración Centralizada
Contiene todas las URLs y configuraciones de API.

### 2. **`.env`** - Variables de Entorno
Almacena las URLs específicas del entorno (dev/prod).

### 3. **`.env.example`** - Plantilla de Variables
Plantilla para que otros desarrolladores configuren su `.env`.

---

## 🚀 Uso Básico

### Importar la Configuración

```javascript
import { API_CONFIG, buildURL, apiFetch } from '../config/api';
```

### Ejemplo 1: Hacer un Fetch Simple

```javascript
// ❌ ANTES (hardcoded)
const response = await fetch('http://localhost:3001/api/users/123');

// ✅ AHORA (centralizado)
const response = await fetch(`${API_CONFIG.BASE_URL}/users/123`);
```

### Ejemplo 2: Usar Endpoints Predefinidos

```javascript
// ✅ Usando endpoints del config
const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMUNITY.LIST}`;
const response = await fetch(url);
```

### Ejemplo 3: Usar Helper buildURL

```javascript
// ✅ Con parámetros de query
const url = buildURL('/users/search', { 
  username: 'JohnDoe',
  limit: 10 
});
// Resultado: http://localhost:3001/api/users/search?username=JohnDoe&limit=10

const response = await fetch(url);
```

### Ejemplo 4: Usar Helper apiFetch

```javascript
// ✅ Con configuración por defecto y manejo de errores
try {
  const response = await apiFetch(
    `${API_CONFIG.BASE_URL}/products`,
    { method: 'GET' }
  );
  const data = await response.json();
} catch (error) {
  console.error('Error:', error);
}
```

---

## 🌍 Configuración de Entornos

### Desarrollo Local

```env
# .env
VITE_API_URL=http://localhost:3001/api
NODE_ENV=development
```

### Producción

```env
# .env
VITE_API_URL=https://tudominio.com/api
NODE_ENV=production
```

### Auto-detección

Si no defines `VITE_API_URL`, el sistema detecta automáticamente:
- **Desarrollo**: usa `http://localhost:3001/api`
- **Producción**: usa `window.location.origin + '/api'`

---

## 📋 Endpoints Disponibles

### Roblox API Proxy

```javascript
API_CONFIG.ENDPOINTS.USERS                  // '/users'
API_CONFIG.ENDPOINTS.SEARCH_USERS           // '/search/users'
API_CONFIG.ENDPOINTS.USER_AVATAR            // '/thumbnails/avatar'
API_CONFIG.ENDPOINTS.USER_PLACES            // '/users/places'
API_CONFIG.ENDPOINTS.GAMEPASSES             // '/gamepasses'
API_CONFIG.ENDPOINTS.THUMBNAILS_ASSETS      // '/thumbnails/assets'
```

### Community Verification

```javascript
API_CONFIG.ENDPOINTS.COMMUNITY.LIST         // '/community/communities'
API_CONFIG.ENDPOINTS.COMMUNITY.STATUS       // '/community/status'
API_CONFIG.ENDPOINTS.COMMUNITY.CHECK        // '/community/check'
API_CONFIG.ENDPOINTS.COMMUNITY.REGISTER     // '/community/register'
```

### Productos, Órdenes y Usuarios

```javascript
API_CONFIG.ENDPOINTS.PRODUCTS               // '/products'
API_CONFIG.ENDPOINTS.ORDERS                 // '/orders'
API_CONFIG.ENDPOINTS.PAYMENT_METHODS        // '/payment-methods'
API_CONFIG.ENDPOINTS.USER_PROFILE           // '/users/profile'
```

---

## 🔧 CDN URLs Externas

Para imágenes y recursos externos:

```javascript
import { CDN_URLS } from '../config/api';

// Roblox CDN
const avatarUrl = `${CDN_URLS.ROBLOX}/avatar.png`;

// Dicebear (avatares generados)
const generatedAvatar = `${CDN_URLS.DICEBEAR}/7.x/avataaars/svg?seed=user123`;

// Unsplash
const backgroundImage = `${CDN_URLS.UNSPLASH}/photo-123456?w=1920`;
```

---

## ✅ Ejemplos Reales del Proyecto

### Ejemplo del `robloxApi.js`

```javascript
import { API_CONFIG } from '../config/api';

const PROXY_BASE = API_CONFIG.BASE_URL;

export const searchRobloxUser = async (username) => {
  const response = await fetch(
    `${PROXY_BASE}/search/users?username=${username}`
  );
  return response.json();
};
```

### Ejemplo del `CommunityVerification.jsx`

```javascript
import { API_CONFIG } from '../config/api';

const fetchCommunities = async () => {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMUNITY.LIST}`
  );
  const data = await response.json();
  return data;
};
```

---

## 🛠️ Agregar Nuevos Endpoints

1. **Edita `src/config/api.js`**:

```javascript
export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  
  ENDPOINTS: {
    // ... endpoints existentes
    
    // ✅ Agregar nuevo endpoint
    NEW_FEATURE: '/api/new-feature',
  },
};
```

2. **Úsalo en tu componente**:

```javascript
import { API_CONFIG } from '../config/api';

const response = await fetch(
  `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEW_FEATURE}`
);
```

---

## ⚠️ Reglas Importantes

### ✅ HACER

- Siempre importar `API_CONFIG` desde `src/config/api.js`
- Usar variables de entorno para URLs sensibles
- Definir nuevos endpoints en `API_CONFIG.ENDPOINTS`
- Usar helpers `buildURL()` y `apiFetch()` cuando sea posible

### ❌ NO HACER

- **Nunca** hardcodear URLs como `http://localhost:3001`
- **Nunca** hacer fetch directo sin usar la config
- **Nunca** commitear `.env` con datos sensibles (solo `.env.example`)

---

## 🔍 Verificar URLs Hardcodeadas

Ejecuta este comando para buscar URLs hardcodeadas:

```bash
# Buscar localhost hardcodeado
grep -r "localhost:3001" src/

# Buscar fetch con URLs directas
grep -r "fetch('http" src/
```

---

## 🎓 Beneficios

✅ **Centralización**: Una sola fuente de verdad para todas las URLs  
✅ **Flexibilidad**: Cambiar entre dev/prod fácilmente  
✅ **Mantenibilidad**: Actualizar URLs en un solo lugar  
✅ **Escalabilidad**: Agregar nuevos endpoints sin modificar componentes  
✅ **Seguridad**: Variables sensibles en `.env` no commiteadas  

---

## 📞 Soporte

Si tienes dudas sobre cómo usar la API centralizada:
1. Revisa `src/config/api.js`
2. Consulta ejemplos en `src/api/robloxApi.js`
3. Lee esta guía completa

---

**Última actualización**: $(date)
