# 🔧 Panel Administrativo - Guía Completa

## 📋 Resumen del Sistema

Se ha implementado un sistema completo de gestión de órdenes con verificación de comprobantes de pago. Los usuarios **DEBEN** subir el comprobante ANTES de crear la orden, y el administrador debe aprobar/rechazar cada pago.

---

## 🔄 Flujo de Trabajo

### **Para el Cliente:**
1. ✅ Selecciona producto (Robux, Gamepass, etc.)
2. ✅ Sube comprobante de pago
3. ✅ Crea la orden (requiere URL del comprobante)
4. ⏳ Espera verificación del admin
5. ✅ Recibe notificación de aprobación/rechazo

### **Para el Admin:**
1. 👀 Ve órdenes pendientes en `/admin`
2. 🔍 Revisa comprobante de pago
3. ✅ Aprueba o ❌ Rechaza el pago
4. 📦 La orden pasa a "processing" o "rejected"

---

## 🎯 Estados de Órdenes

| Estado | Descripción | Acción Admin |
|--------|-------------|--------------|
| `awaiting_verification` | Esperando verificación del comprobante | Aprobar/Rechazar |
| `processing` | Pago aprobado, procesando orden | Actualizar a completado |
| `completed` | Orden completada | - |
| `rejected` | Pago rechazado | - |
| `cancelled` | Orden cancelada | - |

---

## 🌐 Endpoints Backend

### **Órdenes**

#### `POST /api/orders`
Crear nueva orden (REQUIERE comprobante)

**Body:**
```json
{
  "userEmail": "user@example.com",
  "robloxUsername": "PlayerName",
  "robloxUserId": "123456",
  "productType": "robux",
  "productDetails": { "amount": 1000 },
  "amount": 1000,
  "price": 9.99,
  "currency": "USD",
  "paymentMethod": "binance",
  "paymentProofUrl": "https://example.com/proof.jpg" // ⭐ OBLIGATORIO
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "status": "awaiting_verification",
    "paymentProof": "https://example.com/proof.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z",
    ...
  }
}
```

---

#### `PUT /api/orders/:id/verify-payment`
Verificar y aprobar/rechazar comprobante (ADMIN)

**Body:**
```json
{
  "approved": true, // true = aprobar, false = rechazar
  "adminEmail": "admin@rlsstore.com",
  "adminNotes": "Comprobante verificado correctamente"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "status": "processing", // o "rejected"
    "verifiedAt": "2024-01-01T00:00:00.000Z",
    "verifiedBy": "admin@rlsstore.com",
    ...
  }
}
```

---

#### `GET /api/orders?status=awaiting_verification`
Obtener órdenes por estado (ADMIN)

**Query Params:**
- `status` (opcional): `awaiting_verification`, `processing`, `completed`, `rejected`

---

#### `GET /api/orders/stats/summary`
Estadísticas de órdenes (ADMIN)

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "awaitingVerification": 5,
    "processing": 10,
    "completed": 80,
    "rejected": 3,
    "cancelled": 2,
    "totalRevenue": 5000.00,
    "pendingRevenue": 250.00
  }
}
```

---

## 💻 Frontend - Panel Admin

### **Acceso:**
```
http://localhost:5173/admin
```

### **Componentes Creados:**

#### 1. **`Admin.jsx`** - Panel Principal
- Sidebar con navegación
- Tabs: Dashboard, Órdenes, Productos, Usuarios, Métodos de Pago

#### 2. **`AdminStats.jsx`** - Estadísticas
- Cards con métricas clave
- Revenue total y pendiente
- Órdenes por estado

#### 3. **`AdminOrders.jsx`** - Gestión de Órdenes
- Lista de órdenes con filtros
- Ver comprobante de pago
- Aprobar/Rechazar pagos
- Modal con detalles completos

#### 4. **`AdminProducts.jsx`** - Productos (Placeholder)
- Pendiente de implementación

#### 5. **`AdminUsers.jsx`** - Usuarios (Placeholder)
- Pendiente de implementación

---

## 🎨 Uso en el Frontend

### **Importar configuración:**
```javascript
import { API_CONFIG } from '../../config/api';
```

### **Crear orden con comprobante:**
```javascript
// 1. Primero subir comprobante
const formData = new FormData();
formData.append('file', paymentProofFile);

const uploadResponse = await fetch(
  `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD.PAYMENT_PROOF}`,
  { method: 'POST', body: formData }
);

const { fileUrl } = await uploadResponse.json();

// 2. Crear orden con URL del comprobante
const orderResponse = await fetch(
  `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS.BASE}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userEmail: 'user@example.com',
      robloxUsername: 'PlayerName',
      productType: 'robux',
      amount: 1000,
      price: 9.99,
      paymentProofUrl: fileUrl // ⭐ Obligatorio
    })
  }
);
```

### **Verificar pago (Admin):**
```javascript
const response = await fetch(
  `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS.VERIFY_PAYMENT(orderId)}`,
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      approved: true,
      adminEmail: 'admin@rlsstore.com',
      adminNotes: 'Pago verificado'
    })
  }
);
```

---

## 🔐 Seguridad (Pendiente)

### **TODO - Implementar:**
- [ ] Autenticación de admin (JWT o sesiones)
- [ ] Middleware de verificación de roles
- [ ] Rate limiting en endpoints admin
- [ ] Logs de acciones admin

### **Recomendaciones:**
```javascript
// Middleware ejemplo (a implementar)
const isAdmin = (req, res, next) => {
  const { user } = req.session;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// Aplicar a rutas admin
router.put('/orders/:id/verify-payment', isAdmin, async (req, res) => {
  // ...
});
```

---

## 📊 Base de Datos

### **Estructura de Orden:**
```json
{
  "id": "123",
  "userId": "user123",
  "userEmail": "user@example.com",
  "robloxUsername": "PlayerName",
  "robloxUserId": "456789",
  "productType": "robux",
  "productDetails": { "amount": 1000 },
  "amount": 1000,
  "price": 9.99,
  "currency": "USD",
  "paymentMethod": "binance",
  "status": "awaiting_verification",
  "paymentProof": "https://example.com/proof.jpg", // ⭐ URL del comprobante
  "adminNotes": "",
  "verifiedAt": null, // ⭐ Fecha de verificación
  "verifiedBy": null, // ⭐ Email del admin que verificó
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## 🚀 Próximos Pasos

1. **Implementar autenticación admin**
2. **Crear sistema de notificaciones** (email/webhook)
3. **Implementar gestión de productos**
4. **Implementar gestión de usuarios**
5. **Agregar historial de acciones admin**
6. **Implementar búsqueda y paginación**
7. **Agregar exportación de reportes**

---

## 🐛 Testing

### **Probar flujo completo:**

1. **Cliente sube comprobante y crea orden:**
```bash
# En consola del navegador (cliente)
fetch('http://localhost:3001/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userEmail: 'test@example.com',
    robloxUsername: 'TestUser',
    productType: 'robux',
    amount: 1000,
    price: 9.99,
    paymentProofUrl: 'https://i.imgur.com/example.jpg'
  })
})
```

2. **Admin verifica en `/admin`**

3. **Admin aprueba/rechaza pago**

---

## 📝 Notas Importantes

- ⚠️ **SIN comprobante NO se puede crear orden**
- ⚠️ **Todas las órdenes nuevas tienen status `awaiting_verification`**
- ⚠️ **Solo admin puede cambiar a `processing` o `rejected`**
- ⚠️ **El comprobante es obligatorio en el body del POST**

---

**Fecha de creación**: 2024-01-01  
**Versión**: 1.0  
**Autor**: RLS Store Development Team
