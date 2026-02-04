import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB, dbHelpers } from '../database.js';

const router = express.Router();

// Secret para JWT (mismo que admin pero con prefijo diferente)
const JWT_SECRET = process.env.JWT_SECRET || 'rls-store-secret-key-2024';

// POST - Register de usuario
router.post('/register', async (req, res) => {
  try {
    const { email, password, username, robloxUsername } = req.body;

    // Validación
    if (!email || !password || !username) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, contraseña y nombre de usuario son requeridos' 
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email inválido' 
      });
    }

    // Validar contraseña (mínimo 6 caracteres)
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    const db = getDB('users');
    await db.read();

    // Verificar si el email ya existe
    const existingUser = db.data.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Este email ya está registrado' 
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = {
      id: dbHelpers.generateId(db.data.users),
      email,
      password: hashedPassword,
      username,
      robloxUsername: robloxUsername || '',
      robloxUserId: null,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      role: 'user',
      active: true,
      balance: 0,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString()
    };

    db.data.users.push(newUser);
    await db.write();

    // Generar JWT
    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email, 
        role: 'user' 
      },
      JWT_SECRET,
      { expiresIn: '7d' } // 7 días para usuarios
    );

    console.log(`✅ Usuario registrado: ${email}`);

    // No enviar password en la respuesta
    const { password: _, ...safeUser } = newUser;

    res.json({
      success: true,
      data: {
        token,
        user: safeUser
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al registrar usuario' 
    });
  }
});

// POST - Login de usuario
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email y contraseña son requeridos' 
      });
    }

    const db = getDB('users');
    await db.read();

    // Buscar usuario
    const user = db.data.users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales incorrectas' 
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales incorrectas' 
      });
    }

    // Verificar que el usuario esté activo
    if (!user.active) {
      return res.status(403).json({ 
        success: false, 
        error: 'Usuario desactivado. Contacta con soporte.' 
      });
    }

    // Generar JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: 'user' 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ Usuario login: ${email}`);

    // No enviar password
    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      data: {
        token,
        user: safeUser
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al iniciar sesión' 
    });
  }
});

// GET - Verificar token (mantener sesión)
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token no proporcionado' 
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    // Buscar usuario actualizado
    const db = getDB('users');
    await db.read();

    const user = db.data.users.find(u => u.id === decoded.id);

    if (!user || !user.active) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuario no encontrado o desactivado' 
      });
    }

    // No enviar password
    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      data: {
        user: safeUser
      }
    });
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(401).json({ 
      success: false, 
      error: 'Token inválido o expirado' 
    });
  }
});

export default router;
