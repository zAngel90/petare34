import express from 'express';
import jwt from 'jsonwebtoken';
import { getDB, dbHelpers } from '../database.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'rls-store-secret-key-2024';

// Credenciales de Discord
const DISCORD_CLIENT_ID = '1477146018251538563';
const DISCORD_CLIENT_SECRET = 'RD3TltW_pex_Rh3WMXHmCEDKqzYUGnP4';
const DISCORD_REDIRECT_URI = 'https://rbxlatamstore.com/auth/discord/callback';

// GET - Redirigir a Discord para autenticación
router.get('/discord', (req, res) => {
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20email`;
  res.redirect(discordAuthUrl);
});

// GET - Callback de Discord
router.get('/discord/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    // Intercambiar código por access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Error obteniendo access token:', tokenData);
      return res.redirect('/?error=token_failed');
    }

    // Obtener información del usuario de Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const discordUser = await userResponse.json();

    if (!discordUser.id) {
      console.error('Error obteniendo usuario de Discord:', discordUser);
      return res.redirect('/?error=user_failed');
    }

    // Buscar o crear usuario en la base de datos
    const db = getDB('users');
    await db.read();

    let user = db.data.users.find(u => u.discordId === discordUser.id);

    if (!user) {
      // Crear nuevo usuario
      const newUser = {
        id: dbHelpers.generateId(db.data.users),
        email: discordUser.email || `${discordUser.id}@discord.user`,
        password: null, // No tiene password porque usa Discord
        username: discordUser.username || `discord_${discordUser.id}`,
        robloxUsername: '',
        robloxUserId: null,
        avatar: discordUser.avatar 
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${discordUser.id}`,
        role: 'user',
        active: true,
        emailVerified: true, // Discord ya verificó el email
        discordId: discordUser.id, // ⭐ Guardar Discord ID
        balance: 0,
        totalOrders: 0,
        totalSpent: 0,
        createdAt: new Date().toISOString()
      };

      db.data.users.push(newUser);
      await db.write();
      user = newUser;

      console.log(`✅ Nuevo usuario registrado via Discord: ${user.username}`);
    } else {
      console.log(`✅ Usuario existente login via Discord: ${user.username}`);
    }

    // Generar JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirigir al frontend con el token
    res.redirect(`/?discord_token=${token}`);

  } catch (error) {
    console.error('Error en callback de Discord:', error);
    res.redirect('/?error=auth_failed');
  }
});

export default router;
