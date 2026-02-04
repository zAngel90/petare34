import express from 'express';
import { getDB, dbHelpers } from '../database.js';
import { requireAdmin, logAdminAction } from '../middleware/auth.js';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Configurar multer para avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `avatar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max para avatars
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG o WEBP'));
    }
  }
});

// GET - Obtener todos los usuarios (ADMIN)
router.get('/', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const db = getDB('users');
    await db.read();
    
    const users = db.data.users || [];
    
    // No enviar passwords
    const safeUsers = users.map(({ password, ...user }) => user);
    
    res.json({ success: true, data: safeUsers });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ success: false, error: 'Error al obtener usuarios' });
  }
});

// GET - Obtener usuario por email
router.get('/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const db = getDB('users');
    await db.read();
    
    const user = db.data.users.find(u => u.email === email);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    
    // No enviar password
    const { password, ...safeUser } = user;
    
    res.json({ success: true, data: safeUser });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ success: false, error: 'Error al obtener usuario' });
  }
});

// POST - Crear usuario (Registro)
router.post('/', async (req, res) => {
  try {
    const { email, robloxUsername, robloxUserId } = req.body;
    
    if (!email || !robloxUsername) {
      return res.status(400).json({ success: false, error: 'Email y username requeridos' });
    }
    
    const db = getDB('users');
    await db.read();
    
    // Verificar si existe
    const exists = db.data.users.find(u => u.email === email);
    if (exists) {
      return res.status(400).json({ success: false, error: 'Email ya registrado' });
    }
    
    const newUser = {
      id: dbHelpers.generateId(db.data.users),
      email,
      robloxUsername,
      robloxUserId: robloxUserId || null,
      role: 'user', // user, admin
      active: true,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString()
    };
    
    db.data.users.push(newUser);
    await db.write();
    
    console.log(`✅ Usuario creado: ${email}`);
    
    const { password, ...safeUser } = newUser;
    res.json({ success: true, data: safeUser });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ success: false, error: 'Error al crear usuario' });
  }
});

// POST - Subir avatar personalizado (USER)
router.post('/:id/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se subió ningún archivo' });
    }
    
    const avatarUrl = `/uploads/${req.file.filename}`;
    
    const db = getDB('users');
    await db.read();
    
    const userIndex = db.data.users.findIndex(u => u.id === parseInt(id));
    
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    
    // Actualizar avatar
    db.data.users[userIndex].avatar = avatarUrl;
    db.data.users[userIndex].updatedAt = new Date().toISOString();
    
    await db.write();
    
    const { password, ...safeUser } = db.data.users[userIndex];
    
    console.log(`✅ Usuario ${id} actualizó su avatar`);
    
    res.json({ 
      success: true, 
      data: { 
        user: safeUser,
        avatarUrl 
      } 
    });
  } catch (error) {
    console.error('Error subiendo avatar:', error);
    res.status(500).json({ success: false, error: error.message || 'Error al subir avatar' });
  }
});

// PUT - Actualizar propio perfil (USER - sin requireAdmin)
router.put('/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, robloxUsername, email, avatar } = req.body;
    
    const db = getDB('users');
    await db.read();
    
    const userIndex = db.data.users.findIndex(u => u.id === parseInt(id));
    
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    
    // Solo permitir actualizar campos seguros
    const allowedUpdates = {
      username,
      robloxUsername,
      email,
      avatar
    };
    
    // Verificar si el email ya está en uso por otro usuario
    if (email && email !== db.data.users[userIndex].email) {
      const emailExists = db.data.users.find(u => u.email === email && u.id !== parseInt(id));
      if (emailExists) {
        return res.status(400).json({ success: false, error: 'Este email ya está en uso' });
      }
    }
    
    // Actualizar usuario
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key] !== undefined) {
        db.data.users[userIndex][key] = allowedUpdates[key];
      }
    });
    
    db.data.users[userIndex].updatedAt = new Date().toISOString();
    
    await db.write();
    
    const { password, ...safeUser } = db.data.users[userIndex];
    
    console.log(`✅ Usuario ${id} actualizó su perfil`);
    
    res.json({ success: true, data: safeUser });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar perfil' });
  }
});

// PUT - Actualizar usuario (ADMIN)
router.put('/:id', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const db = getDB('users');
    await db.read();
    
    const updated = dbHelpers.updateItem(db.data.users, id, updates);
    
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    
    await db.write();
    
    const { password, ...safeUser } = updated;
    res.json({ success: true, data: safeUser });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar usuario' });
  }
});

// DELETE - Eliminar usuario (ADMIN)
router.delete('/:id', requireAdmin, logAdminAction, async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDB('users');
    await db.read();
    
    const deleted = dbHelpers.deleteItem(db.data.users, id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    
    await db.write();
    
    res.json({ success: true, message: 'Usuario eliminado' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar usuario' });
  }
});

export default router;
