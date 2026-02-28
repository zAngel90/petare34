import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB, dbHelpers } from '../database.js';
import emailService from '../services/emailService.js';

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
    const existingEmail = db.data.users.find(u => u.email === email);
    if (existingEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Este email ya está registrado' 
      });
    }

    // Verificar si el username ya existe
    const existingUsername = db.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUsername) {
      return res.status(400).json({ 
        success: false, 
        error: 'Este nombre de usuario ya está en uso' 
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar código de verificación
    const verificationCode = emailService.generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Crear nuevo usuario (sin verificar)
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
      emailVerified: false, // Usuario no verificado inicialmente
      verificationCode: verificationCode,
      verificationExpires: verificationExpires.toISOString(),
      balance: 0,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString()
    };

    db.data.users.push(newUser);
    await db.write();

    // Enviar email de verificación
    await emailService.sendVerificationEmail(email, username, verificationCode);

    console.log(`✅ Usuario registrado (pendiente verificación): ${email}`);

    // No enviar password en la respuesta
    const { password: _, verificationCode: __, ...safeUser } = newUser;

    res.json({
      success: true,
      message: 'Usuario registrado. Por favor verifica tu email.',
      data: {
        user: safeUser,
        requiresVerification: true
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

// POST - Verificar código de email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email y código son requeridos' 
      });
    }

    const db = getDB('users');
    await db.read();

    // Buscar usuario
    const user = db.data.users.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
    }

    // Verificar si ya está verificado
    if (user.emailVerified) {
      return res.status(400).json({ 
        success: false, 
        error: 'El email ya está verificado' 
      });
    }

    // Verificar si el código expiró
    if (new Date() > new Date(user.verificationExpires)) {
      return res.status(400).json({ 
        success: false, 
        error: 'El código de verificación ha expirado. Solicita uno nuevo.' 
      });
    }

    // Verificar código
    if (user.verificationCode !== code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Código de verificación incorrecto' 
      });
    }

    // Marcar como verificado
    user.emailVerified = true;
    user.verificationCode = null;
    user.verificationExpires = null;
    await db.write();

    // Enviar email de bienvenida
    await emailService.sendWelcomeEmail(email, user.username);

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

    console.log(`✅ Email verificado: ${email}`);

    // No enviar password
    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      message: '¡Email verificado exitosamente!',
      data: {
        token,
        user: safeUser
      }
    });
  } catch (error) {
    console.error('Error verificando email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al verificar email' 
    });
  }
});

// POST - Reenviar código de verificación
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email es requerido' 
      });
    }

    const db = getDB('users');
    await db.read();

    const user = db.data.users.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({ 
        success: false, 
        error: 'El email ya está verificado' 
      });
    }

    // Generar nuevo código
    const verificationCode = emailService.generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationExpires = verificationExpires.toISOString();
    await db.write();

    // Enviar email
    await emailService.sendVerificationEmail(email, user.username, verificationCode);

    console.log(`✅ Código reenviado: ${email}`);

    res.json({
      success: true,
      message: 'Código de verificación reenviado'
    });
  } catch (error) {
    console.error('Error reenviando código:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al reenviar código' 
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
