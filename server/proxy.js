import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import { createServer } from 'http';
import { scrapeUserSearch, scrapeUserAvatar, scrapeUserPlaces, scrapePlaceGamePasses, scrapeGamePassDetails } from './scraper.js';
import { initDatabases } from './database.js';
import { setupSocket } from './socket.js';

// Import routes
import authRouter from './routes/auth.js';
import userAuthRouter from './routes/user-auth.js';
import discordAuthRouter from './routes/discord-auth.js'; // Discord OAuth
import chatRouter from './routes/chat.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import paymentMethodsRouter from './routes/payment-methods.js';
import usersRouter from './routes/users.js';
import communityVerificationRouter from './routes/community-verification.js';
import exchangeRatesRouter from './routes/exchange-rates.js';
import categoriesRouter from './routes/categories.js';
import currenciesRouter from './routes/currencies.js';
import homeConfigRouter from './routes/home-config.js';
import reviewsRouter from './routes/reviews.js';
import settingsRouter from './routes/settings.js';
import orderChatRouter from './routes/order-chat.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const PORT = 3001;

// Enable CORS
app.use(cors());
app.use(express.json());

// Configurar multer para uploads de comprobantes
const uploadsDir = join(__dirname, 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    // Formatos de imagen ampliados para el admin
    const allowedTypes = [
      'image/jpeg',          // .jpg, .jpeg
      'image/png',           // .png
      'image/webp',          // .webp (WebP - formato moderno y eficiente)
      'image/svg+xml',       // .svg (Scalable Vector Graphics)
      'image/avif',         // .avif (AV1 Image File Format - muy eficiente)
      'image/tiff',         // .tiff, .tif (Tagged Image File Format)
      'image/bmp',          // .bmp (Bitmap)
      'image/gif',          // .gif (Graphics Interchange Format)
      'application/pdf'      // .pdf (para comprobantes)
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

// Configuración de multer para archivos de chat (imágenes y videos)
const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${file.originalname}`;
    cb(null, uniqueName);
  }
});

const chatUpload = multer({
  storage: chatStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max para chat
  fileFilter: (req, file, cb) => {
    // Formatos de imagen y video ampliados para chat
    const allowedTypes = [
      // Imágenes
      'image/jpeg',          // .jpg, .jpeg
      'image/png',           // .png
      'image/webp',          // .webp (WebP - formato moderno y eficiente)
      'image/svg+xml',       // .svg (Scalable Vector Graphics)
      'image/avif',         // .avif (AV1 Image File Format - muy eficiente)
      'image/tiff',         // .tiff, .tif (Tagged Image File Format)
      'image/bmp',          // .bmp (Bitmap)
      'image/gif',          // .gif (Graphics Interchange Format)
      // Videos
      'video/mp4',          // .mp4 (MPEG-4)
      'video/webm',         // .webm (Web Media)
      'video/mov',          // .mov (QuickTime)
      'video/avi',          // .avi (Audio Video Interleave)
      'video/mpeg',         // .mpeg, .mpg
      'video/quicktime'     // .mov (QuickTime alternativo)
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes y videos'));
    }
  }
});

// Servir archivos estáticos de uploads
app.use('/uploads', express.static(uploadsDir));

// Inicializar base de datos
await initDatabases();
console.log('📦 Base de datos inicializada');

// Inicializar Socket.IO
const io = setupSocket(httpServer);
app.set('io', io); // Guardar io para que las rutas puedan acceder
console.log('🔌 Socket.IO disponible en app');

// API Routes
app.use('/api/auth', authRouter); // Admin auth
app.use('/api/user-auth', userAuthRouter); // User auth (login/register)
app.use('/auth', discordAuthRouter); // Discord OAuth (sin /api)

// Ruta especial para upload de chat con multer
app.post('/api/chat/:conversationId/upload', chatUpload.single('file'), (req, res, next) => {
  next();
});

app.use('/api/chat', chatRouter); // Chat routes
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payment-methods', paymentMethodsRouter);
app.use('/api/users', usersRouter);
app.use('/api/community', communityVerificationRouter);
app.use('/api/exchange-rates', exchangeRatesRouter); // Tasas de cambio
app.use('/api/categories', categoriesRouter); // Categorías
app.use('/api/currencies', currenciesRouter); // Monedas
app.use('/api/home-config', homeConfigRouter); // Configuración del Home
app.use('/api/reviews', reviewsRouter); // Sistema de reseñas
app.use('/api/settings', settingsRouter); // Configuración general
app.use('/api/order-chat', orderChatRouter); // Chat por pedido

// Upload endpoint para comprobantes
app.post('/api/upload/payment-proof', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se subió ningún archivo' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    console.log(`📤 Comprobante subido: ${fileUrl}`);
    
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    res.status(500).json({ success: false, error: 'Error al subir archivo' });
  }
});

// Upload endpoint para imágenes de categorías (ADMIN)
app.post('/api/upload/category-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se subió ninguna imagen' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    console.log(`🖼️ Imagen de categoría subida: ${imageUrl}`);
    
    res.json({
      success: true,
      filename: req.file.filename,
      url: imageUrl
    });
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    res.status(500).json({ success: false, error: 'Error al subir imagen' });
  }
});

// Upload endpoint para imágenes de productos in-game (ADMIN)
app.post('/api/upload/ingame-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se subió ninguna imagen' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    console.log(`🖼️ Imagen de producto in-game subida: ${imageUrl}`);
    
    res.json({
      success: true,
      filename: req.file.filename,
      url: imageUrl
    });
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    res.status(500).json({ success: false, error: 'Error al subir imagen' });
  }
});

// Upload endpoint para imágenes de productos Robux (ADMIN)
app.post('/api/upload/product-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se subió ninguna imagen' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    console.log(`🖼️ Imagen de producto subida: ${imageUrl}`);
    
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        url: imageUrl,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    res.status(500).json({ success: false, error: 'Error al subir imagen' });
  }
});

// Upload endpoint para imágenes de reseñas (múltiples)
const uploadMultiple = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max por imagen
  fileFilter: (req, file, cb) => {
    // Formatos de imagen ampliados para reseñas
    const allowedTypes = [
      'image/jpeg',          // .jpg, .jpeg
      'image/png',           // .png
      'image/webp',          // .webp (WebP - formato moderno y eficiente)
      'image/svg+xml',       // .svg (Scalable Vector Graphics)
      'image/avif',         // .avif (AV1 Image File Format - muy eficiente)
      'image/tiff',         // .tiff, .tif (Tagged Image File Format)
      'image/bmp',          // .bmp (Bitmap)
      'image/gif'           // .gif (Graphics Interchange Format)
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo imágenes.'));
    }
  }
}).array('images', 3); // Máximo 3 imágenes

app.post('/api/upload/review-images', (req, res) => {
  uploadMultiple(req, res, (err) => {
    if (err) {
      console.error('Error subiendo imágenes de reseña:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No se subieron imágenes' });
    }
    
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    console.log(`📸 Imágenes de reseña subidas: ${imageUrls.length} archivos`);
    
    res.json({
      success: true,
      data: {
        images: imageUrls,
        count: req.files.length
      }
    });
  });
});

// Upload endpoint para videos de ayuda
const uploadVideo = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max para videos
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo videos MP4, WebM, OGG.'));
    }
  }
}).single('video');

app.post('/api/upload/help-video', (req, res) => {
  uploadVideo(req, res, (err) => {
    if (err) {
      console.error('Error subiendo video:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se subió ningún video' });
    }
    
    const videoUrl = `/uploads/${req.file.filename}`;
    console.log(`🎥 Video de ayuda subido: ${videoUrl}`);
    
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        url: videoUrl,
        size: req.file.size
      }
    });
  });
});

// Sistema de caché mejorado con rate limiting por endpoint
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos (más tiempo para reducir peticiones)

// Rate limiting: máximo de peticiones por minuto por endpoint
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_MINUTE = 10; // Máximo 10 peticiones por minuto a Roblox

const getCached = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`✓ Usando caché para: ${key}`);
    return cached.data;
  }
  return null;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

const checkRateLimit = (endpoint) => {
  const now = Date.now();
  const limit = rateLimits.get(endpoint) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  // Reset si pasó la ventana
  if (now > limit.resetTime) {
    limit.count = 0;
    limit.resetTime = now + RATE_LIMIT_WINDOW;
  }
  
  // Verificar límite
  if (limit.count >= MAX_REQUESTS_PER_MINUTE) {
    const waitTime = Math.ceil((limit.resetTime - now) / 1000);
    console.log(`⚠️ Rate limit interno alcanzado. Espera ${waitTime}s`);
    return false;
  }
  
  // Incrementar contador
  limit.count++;
  rateLimits.set(endpoint, limit);
  return true;
};

// Limpiar caché vieja cada hora
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
  console.log(`🧹 Caché limpiado. Entradas actuales: ${cache.size}`);
}, 60 * 60 * 1000);

// Roblox API endpoints
const ROBLOX_USERS_API = 'https://users.roblox.com';
const ROBLOX_THUMBNAILS_API = 'https://thumbnails.roblox.com';
const ROBLOX_CATALOG_API = 'https://catalog.roblox.com';

// Search users usando SCRAPING
app.get('/api/users/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    console.log(`🔍 Buscando usuario via SCRAPING: "${keyword}"`);
    
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    // Revisar caché primero
    const cacheKey = `user-search-${keyword}`;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log('✅ Usando caché');
      return res.json(cached);
    }

    // Usar scraping en lugar de API
    const user = await scrapeUserSearch(keyword);
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      const emptyResult = { data: [] };
      setCache(cacheKey, emptyResult);
      return res.json(emptyResult);
    }
    
    // Formatear como respuesta de la API
    const result = { data: [user] };
    
    // Guardar en caché
    setCache(cacheKey, result);
    
    console.log(`✅ Usuario encontrado: ${user.name} (ID: ${user.id})`);
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get user by ID
app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const response = await fetch(`${ROBLOX_USERS_API}/v1/users/${userId}`);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get user thumbnails
app.get('/api/thumbnails/avatar-headshot', async (req, res) => {
  try {
    const { userIds, size = '150x150' } = req.query;
    
    if (!userIds) {
      return res.status(400).json({ error: 'userIds is required' });
    }

    const response = await fetch(
      `${ROBLOX_THUMBNAILS_API}/v1/users/avatar-headshot?userIds=${userIds}&size=${size}&format=Png&isCircular=false`
    );
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error getting thumbnails:', error);
    res.status(500).json({ error: 'Failed to get thumbnails' });
  }
});

// Get user games (to find gamepasses)
app.get('/api/users/:userId/games', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`Obteniendo juegos del usuario ${userId}...`);
    
    // Primero obtener los juegos del usuario
    const response = await fetch(
      `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50&sortOrder=Asc`
    );
    
    const data = await response.json();
    console.log(`Juegos encontrados:`, data.data?.length || 0);
    console.log('Datos:', JSON.stringify(data, null, 2));
    
    res.json(data);
  } catch (error) {
    console.error('Error getting games:', error);
    res.status(500).json({ error: 'Failed to get games' });
  }
});

// Get universe info from place
app.get('/api/places/:placeId/universe', async (req, res) => {
  try {
    const { placeId } = req.params;
    
    console.log(`Obteniendo universeId del place ${placeId}...`);
    
    const response = await fetch(
      `https://apis.roblox.com/universes/v1/places/${placeId}/universe`
    );
    
    const data = await response.json();
    console.log(`UniverseId obtenido:`, JSON.stringify(data, null, 2));
    
    res.json(data);
  } catch (error) {
    console.error('Error getting universe:', error);
    res.status(500).json({ error: 'Failed to get universe' });
  }
});

// Get user places (via scraping)
app.get('/api/users/:userId/places', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🏠 Obteniendo places del usuario ${userId}...`);
    
    // Revisar caché primero
    const cacheKey = `user-places-${userId}`;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log('✅ Usando caché');
      return res.json(cached);
    }

    // Usar scraping
    const places = await scrapeUserPlaces(userId);
    
    const result = { data: places };
    
    // Guardar en caché
    setCache(cacheKey, result);
    
    console.log(`✅ ${places.length} places encontrados`);
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error obteniendo places:', error);
    res.status(500).json({ error: 'Failed to get places' });
  }
});

// Get gamepasses from a place (via scraping)
app.get('/api/places/:placeId/gamepasses', async (req, res) => {
  try {
    const { placeId } = req.params;
    
    console.log(`🎫 Obteniendo gamepasses del place ${placeId}... (SIN CACHÉ)`);
    
    // NO usar caché - siempre buscar datos frescos
    // Esto permite que si un usuario crea un gamepass nuevo, lo detecte inmediatamente
    
    // Usar scraping
    const gamepasses = await scrapePlaceGamePasses(placeId);
    
    const result = { data: gamepasses };
    
    // NO guardar en caché
    
    console.log(`✅ ${gamepasses.length} gamepasses encontrados (datos frescos)`);
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error obteniendo gamepasses:', error);
    res.status(500).json({ error: 'Failed to get gamepasses' });
  }
});

// Get gamepass details by product ID
app.get('/api/gamepasses/:gamepassId', async (req, res) => {
  try {
    const { gamepassId } = req.params;
    
    console.log(`Obteniendo detalles del gamepass ${gamepassId}...`);
    
    // Intentar con product info API
    const response = await fetch(
      `https://apis.roblox.com/game-passes/v1/game-passes/${gamepassId}/product-info`
    );
    
    if (!response.ok) {
      console.log('Product info no disponible, intentando con badges API...');
      // Fallback: intentar obtener info básica
      const catalogResponse = await fetch(
        `https://catalog.roblox.com/v1/assets/${gamepassId}/details`
      );
      const catalogData = await catalogResponse.json();
      console.log('Datos del catálogo:', JSON.stringify(catalogData, null, 2));
      return res.json(catalogData);
    }
    
    const data = await response.json();
    console.log('Datos del gamepass:', JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    console.error('Error getting gamepass:', error);
    res.status(500).json({ error: 'Failed to get gamepass' });
  }
});

// Get asset thumbnails (for gamepasses)
app.get('/api/thumbnails/assets', async (req, res) => {
  try {
    const { assetIds, size = '150x150' } = req.query;
    
    if (!assetIds) {
      return res.status(400).json({ error: 'assetIds is required' });
    }

    const response = await fetch(
      `${ROBLOX_THUMBNAILS_API}/v1/assets?assetIds=${assetIds}&size=${size}&format=Png`
    );
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error getting asset thumbnails:', error);
    res.status(500).json({ error: 'Failed to get asset thumbnails' });
  }
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin panel ready`);
  console.log(`💾 Database: JSON files (LowDB)`);
  console.log(`🎮 Roblox scraping: Active`);
  console.log(`💬 Socket.IO Chat: Active on ws://localhost:${PORT}`);
});
