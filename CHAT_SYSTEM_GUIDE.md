# 💬 Sistema de Chat en Tiempo Real - Guía Completa

## ✅ Sistema Completamente Implementado

### 📦 **Componentes Implementados**

#### **Backend (Node.js + Express + Socket.IO)**

1. **Autenticación de Usuarios** (`server/routes/user-auth.js`)
   - ✅ POST `/api/user-auth/register` - Registro de usuarios
   - ✅ POST `/api/user-auth/login` - Login de usuarios
   - ✅ GET `/api/user-auth/verify` - Verificar token JWT

2. **Rutas de Chat** (`server/routes/chat.js`)
   - ✅ GET `/api/chat/conversations` - Obtener conversaciones
   - ✅ GET `/api/chat/conversations/:id/messages` - Obtener mensajes
   - ✅ POST `/api/chat/conversations` - Crear conversación
   - ✅ POST `/api/chat/messages` - Enviar mensaje
   - ✅ PUT `/api/chat/conversations/:id/read` - Marcar como leído
   - ✅ PUT `/api/chat/conversations/:id/status` - Cambiar estado (ADMIN)

3. **WebSocket/Socket.IO** (`server/socket.js`)
   - ✅ Conexión en tiempo real
   - ✅ Identificación de usuarios y admins
   - ✅ Envío/recepción de mensajes instantáneos
   - ✅ Indicador de "escribiendo..."
   - ✅ Estado online/offline
   - ✅ Notificaciones en tiempo real

4. **Base de Datos** (`server/database.js`)
   - ✅ Colección `chat.conversations` - Conversaciones
   - ✅ Colección `chat.messages` - Mensajes
   - ✅ Auto-guardado con LowDB

#### **Frontend (React + Socket.IO Client)**

1. **AuthContext Mejorado** (`src/context/AuthContext.jsx`)
   - ✅ Login/Register con backend real
   - ✅ Verificación de token JWT
   - ✅ Persistencia de sesión
   - ✅ Helper `getAuthHeaders()`

2. **Componente Login/Register** (`src/pages/Login.jsx`)
   - ✅ Integrado con backend real
   - ✅ Validación de formularios
   - ✅ Manejo de errores
   - ✅ Redirección después de login

3. **ChatWidget para Usuarios** (`src/components/ChatWidget.jsx`)
   - ✅ Botón flotante elegante
   - ✅ Ventana de chat minimizable
   - ✅ Conexión Socket.IO en tiempo real
   - ✅ Envío/recepción de mensajes
   - ✅ Indicador de "escribiendo..."
   - ✅ Auto-scroll a últimos mensajes
   - ✅ Solo visible para usuarios autenticados

4. **AdminChat para Panel Admin** (`src/components/admin/AdminChat.jsx`)
   - ✅ Lista de conversaciones activas
   - ✅ Vista de mensajes en tiempo real
   - ✅ Envío de respuestas
   - ✅ Cambio de estado (abierta/resuelta/cerrada)
   - ✅ Indicador de usuarios online
   - ✅ Contador de mensajes no leídos
   - ✅ Notificaciones de nuevos mensajes

---

## 🚀 **Cómo Usar el Sistema**

### **1. Iniciar el Backend**

```bash
cd roblox-store/server
npm start
```

El servidor estará disponible en: `http://localhost:3001`
- API REST: `http://localhost:3001/api`
- Socket.IO: `ws://localhost:3001`

### **2. Iniciar el Frontend**

```bash
cd roblox-store
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

---

## 👤 **Flujo de Usuario**

### **Paso 1: Registro/Login**

1. Usuario va a `/login`
2. Puede elegir "Iniciar Sesión" o "Registrarse"
3. **Registro**:
   - Email
   - Contraseña (mínimo 6 caracteres)
   - Nombre de usuario
   - Username de Roblox (opcional)
4. **Login**:
   - Email
   - Contraseña
5. Después de login exitoso, se guarda JWT en localStorage
6. El usuario es redirigido a la página principal

### **Paso 2: Usar el Chat**

1. Una vez logueado, aparece un **botón flotante de chat** (💬) en la esquina inferior derecha
2. Al hacer clic, se abre la ventana de chat
3. El usuario puede:
   - Escribir mensajes
   - Ver respuestas del admin en tiempo real
   - Minimizar la ventana
   - Cerrar el chat

### **Paso 3: Navbar con Usuario**

- El navbar muestra el nombre de usuario y avatar
- Dropdown con opciones:
  - Mi Perfil
  - Mis Pedidos
  - Configuración
  - Cerrar Sesión

---

## 👑 **Flujo de Admin**

### **Paso 1: Login Admin**

1. Admin va a `/admin/login`
2. Credenciales por defecto:
   - Email: `admin@rlsstore.com`
   - Contraseña: `admin123`

### **Paso 2: Acceder al Chat**

1. En el panel admin, ir a la pestaña **"Chat Soporte"**
2. Ver lista de conversaciones en el panel izquierdo
3. Conversaciones muestran:
   - Nombre del usuario
   - Estado (online/offline)
   - Último mensaje
   - Estado (abierta/resuelta/cerrada)
   - Contador de mensajes no leídos

### **Paso 3: Responder Mensajes**

1. Hacer clic en una conversación
2. Ver historial completo de mensajes
3. Escribir respuesta en el input inferior
4. Enviar con Enter o botón "Enviar"
5. Cambiar estado de conversación (desplegable en el header)

### **Paso 4: Características en Tiempo Real**

- 🟢 **Indicador online/offline** - Ver quién está conectado
- ✍️ **"Escribiendo..."** - Ver cuando el usuario está escribiendo
- 🔔 **Notificaciones** - Nuevos mensajes aparecen instantáneamente
- 📊 **Contador de no leídos** - Badge con cantidad de mensajes sin leer

---

## 🔐 **Autenticación y Seguridad**

### **Usuarios**
- Contraseñas hasheadas con `bcryptjs` (10 rounds)
- JWT con expiración de 7 días
- Token almacenado en `localStorage` como `user-token`
- Middleware de verificación en rutas protegidas

### **Admins**
- Sistema separado de autenticación
- JWT con expiración de 24 horas
- Token almacenado en `localStorage` como `admin-token`
- Middleware `requireAdmin` en rutas de admin

---

## 📡 **Eventos de Socket.IO**

### **Eventos del Cliente → Servidor**

| Evento | Datos | Descripción |
|--------|-------|-------------|
| `user:identify` | `{ userId, userName, userType }` | Identificar usuario/admin al conectar |
| `message:send` | `{ conversationId, senderId, senderName, senderType, message }` | Enviar mensaje |
| `typing:start` | `{ conversationId, userName, userType }` | Empezar a escribir |
| `typing:stop` | `{ conversationId, userType }` | Dejar de escribir |

### **Eventos del Servidor → Cliente**

| Evento | Datos | Descripción |
|--------|-------|-------------|
| `message:received` | `{ conversationId, senderId, senderName, senderType, message, timestamp }` | Nuevo mensaje recibido |
| `user:online` | `{ userId, userName }` | Usuario se conectó |
| `user:offline` | `{ userId }` | Usuario se desconectó |
| `typing:user` | `{ conversationId, userName }` | Usuario está escribiendo |
| `typing:user:stop` | `{ conversationId }` | Usuario dejó de escribir |
| `typing:admin` | `{ conversationId }` | Admin está escribiendo |
| `typing:admin:stop` | `{ conversationId }` | Admin dejó de escribir |

---

## 🗄️ **Estructura de Base de Datos**

### **Usuarios** (`db/users.json`)
```json
{
  "users": [
    {
      "id": 1,
      "email": "usuario@ejemplo.com",
      "password": "$2a$10$hash...",
      "username": "Usuario123",
      "robloxUsername": "RobloxUser",
      "robloxUserId": null,
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=...",
      "role": "user",
      "active": true,
      "balance": 0,
      "totalOrders": 0,
      "totalSpent": 0,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### **Chat** (`db/chat.json`)
```json
{
  "conversations": [
    {
      "id": 1,
      "userId": 1,
      "userName": "Usuario123",
      "userEmail": "usuario@ejemplo.com",
      "status": "open",
      "unreadCount": 2,
      "lastMessage": "¿Me pueden ayudar?",
      "lastMessageAt": "2024-01-01T12:00:00.000Z",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "messages": [
    {
      "id": 1,
      "conversationId": 1,
      "senderId": 1,
      "senderName": "Usuario123",
      "senderType": "user",
      "message": "Hola, necesito ayuda con mi orden",
      "read": true,
      "createdAt": "2024-01-01T10:30:00.000Z"
    }
  ]
}
```

---

## 🎨 **Personalización**

### **Cambiar Colores del Chat**

En `ChatWidget.css` y `AdminChat.css`, buscar las variables de color:
- `#667eea` - Morado principal
- `#764ba2` - Morado secundario
- `#00d084` - Verde (online)
- `#ff4757` - Rojo (no leídos)

### **Cambiar Posición del Widget**

En `ChatWidget.css`:
```css
.chat-widget-button {
  bottom: 24px;  /* Cambiar esta posición */
  right: 24px;   /* Cambiar esta posición */
}
```

---

## 🐛 **Troubleshooting**

### **El chat no se conecta**
1. Verificar que el servidor esté corriendo en puerto 3001
2. Verificar que Socket.IO esté instalado: `npm install socket.io socket.io-client`
3. Revisar la consola del navegador para errores de WebSocket

### **No puedo hacer login**
1. Verificar que el backend esté corriendo
2. Revisar las credenciales
3. Verificar la URL del API en `src/config/api.js`

### **Los mensajes no llegan en tiempo real**
1. Verificar conexión Socket.IO en la consola
2. Verificar que el usuario se identifique correctamente
3. Revisar logs del servidor

---

## 📝 **Credenciales por Defecto**

### **Admin**
- Email: `admin@rlsstore.com`
- Contraseña: `admin123`

### **Usuario de Prueba**
Crear uno nuevo desde `/login` → "Registrarse"

---

## 🔄 **Próximas Mejoras Sugeridas**

1. **Notificaciones Push** - Notificaciones del navegador cuando llega un mensaje
2. **Historial Paginado** - Cargar mensajes antiguos bajo demanda
3. **Envío de Archivos** - Permitir adjuntar imágenes en el chat
4. **Chat de Grupo** - Multiple admins respondiendo
5. **Respuestas Rápidas** - Templates de respuestas comunes
6. **Encuestas de Satisfacción** - Después de resolver conversación
7. **Búsqueda de Mensajes** - Buscar en el historial
8. **Exportar Conversaciones** - Descargar como PDF o TXT

---

## 📞 **Soporte**

Si tienes problemas con la implementación:
1. Revisar los logs del servidor (consola donde corre `npm start`)
2. Revisar la consola del navegador (F12)
3. Verificar que todas las dependencias estén instaladas

**Dependencias necesarias:**
- Backend: `socket.io`
- Frontend: `socket.io-client`

---

✨ **¡El sistema de chat está completamente funcional y listo para usar!**
