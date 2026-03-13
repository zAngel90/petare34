# 📁 Guía de Formatos de Archivos Soportados

## 🎨 Formatos de Imagen Habilitados

El backend ahora soporta una amplia variedad de formatos de imagen para mejorar la flexibilidad del admin panel.

---

## ✅ Formatos Soportados

### **Formatos Comunes**
- **JPEG/JPG** - `image/jpeg`, `image/jpg`
  - Compatible universalmente
  - Buena compresión
  - Ideal para fotografías

- **PNG** - `image/png`
  - Soporta transparencia
  - Sin pérdida de calidad
  - Ideal para logos y gráficos

### **Formatos Modernos**
- **WebP** - `image/webp`
  - Formato moderno y eficiente de Google
  - Compresión superior (~25-35% más pequeño que JPEG)
  - Soporta transparencia y animación
  - Compatible con navegadores modernos
  - **Recomendado para web**

- **AVIF** - `image/avif`
  - Formato más reciente y eficiente
  - Compresión aún mejor que WebP
  - Soporta animación y transparencia
  - Soporte creciente en navegadores
  - **Recomendado para calidad máxima**

### **Formatos Vectoriales**
- **SVG** - `image/svg+xml`
  - Formato vectorial escalable
  - Tamaño de archivo muy pequeño
  - Sin pérdida de calidad al escalar
  - Ideal para logos e iconos
  - Soporta animaciones CSS

### **Formatos Especializados**
- **GIF** - `image/gif`
  - Formato clásico
  - Soporta animación
  - Compatible universalmente
  - Limitado a 256 colores

- **TIFF** - `image/tiff`
  - Alta calidad sin compresión
  - Usado en impresión profesional
  - Archivos grandes
  - Compatible con software de edición

- **BMP** - `image/bmp`
  - Formato simple sin compresión
  - Archivos muy grandes
  - Compatible universalmente
  - No recomendado para web

### **Documentos**
- **PDF** - `application/pdf`
  - Para comprobantes de pago
  - Formato de documento estándar
  - Compatible universalmente

---

## 🎬 Formatos de Video (Chat)

El sistema de chat también soporta múltiples formatos de video:

- **MP4** - `video/mp4`
  - Estándar moderno
  - Compatible universalmente
  - **Recomendado**

- **WebM** - `video/webm`
  - Formato abierto de Google
  - Excelente calidad/compresión
  - Compatible con navegadores modernos

- **MOV** - `video/mov`, `video/quicktime`
  - Formato QuickTime
  - Compatible con dispositivos Apple
  - Buena calidad

- **AVI** - `video/avi`
  - Formato clásico
  - Compatible con software antiguo

- **MPEG** - `video/mpeg`, `video/mpg`
  - Formato estándar
  - Compatible universalmente

---

## 📊 Límites de Archivo

| Tipo de Upload | Tamaño Máximo | Formatos Soportados |
|----------------|---------------|-------------------|
| Comprobantes de pago | 5MB | JPEG, PNG, JPG, WebP, AVIF, SVG, TIFF, BMP, GIF, PDF |
| Imágenes de productos | 5MB | JPEG, PNG, JPG, WebP, AVIF, SVG, TIFF, BMP, GIF |
| Imágenes de categorías | 5MB | JPEG, PNG, JPG, WebP, AVIF, SVG, TIFF, BMP, GIF |
| Imágenes de reseñas | 5MB (x3 imágenes) | JPEG, PNG, JPG, WebP, AVIF, SVG, TIFF, BMP, GIF |
| Chat (imágenes/videos) | 10MB | JPEG, PNG, JPG, WebP, AVIF, SVG, TIFF, BMP, GIF + MP4, WebM, MOV, AVI, MPEG, QuickTime |
| Videos de ayuda | 50MB | MP4, WebM, OGG |

---

## 🎯 Recomendaciones

### **Para Productos y Categorías**
- ✅ **WebP** para imágenes con buena calidad y tamaño pequeño
- ✅ **PNG** para imágenes con transparencia
- ✅ **JPEG** para fotografías
- ✅ **SVG** para logos e iconos

### **Para Reservas**
- ✅ **JPEG** o **PNG** para capturas de pantalla
- ✅ **PDF** para documentos oficiales

### **Para Chat**
- ✅ **WebP** para imágenes pequeñas y rápidas
- ✅ **MP4** para videos
- ✅ **GIF** para animaciones pequeñas

---

## 🔧 Endpoints de Upload

### **Admin Panel**
```
POST /api/upload/product-image       - Imágenes de productos
POST /api/upload/category-image      - Imágenes de categorías
POST /api/upload/ingame-image       - Imágenes de productos in-game
```

### **Usuarios**
```
POST /api/upload/payment-proof       - Comprobantes de pago
POST /api/upload/review-images      - Imágenes de reseñas (múltiples)
POST /api/upload/help-video         - Videos de ayuda
```

### **Chat**
```
POST /api/chat/:conversationId/upload - Archivos de chat (imágenes/videos)
```

---

## 🚀 Beneficios de los Nuevos Formatos

### **WebP**
- 🔥 Compresión superior (25-35% más pequeño)
- 🔥 Mayor calidad por tamaño
- 🔥 Soporte de transparencia
- 🔥 Compatible con 95%+ de navegadores

### **AVIF**
- 🔥 Mejor compresión disponible
- 🔥 Calidad excepcional
- 🔥 Soporte creciente en navegadores

### **SVG**
- 🔥 Escalable sin pérdida de calidad
- 🔥 Tamaño de archivo mínimo
- 🔥 Perfecto para logos y gráficos

---

## ⚠️ Notas Importantes

1. **Compatibilidad**: WebP y AVIF tienen excelente soporte en navegadores modernos, pero considera fallbacks para navegadores antiguos si es necesario.

2. **Tamaño de archivo**: SVG es el formato más eficiente para gráficos vectoriales. Úsalo para logos, iconos y elementos simples.

3. **Transparencia**: PNG y WebP tienen mejor soporte de transparencia que JPEG.

4. **Animación**: GIF es compatible universalmente, pero WebP es más eficiente para animaciones modernas.

5. **Documentos**: PDF es el formato estándar para comprobantes de pago.

---

## 📞 Soporte

Si tienes problemas subiendo archivos, verifica:
- El tamaño del archivo está dentro del límite
- El formato es compatible
- El archivo no está corrupto
- Tienes permisos de escritura en el directorio `/uploads`

---

**Última actualización**: 2026-03-12
**Versión**: 2.0
**Estado**: ✅ Implementado y funcional
