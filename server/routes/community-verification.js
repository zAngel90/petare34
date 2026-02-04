import express from 'express';
import fetch from 'node-fetch';
import { getDB, dbHelpers } from '../database.js';

const router = express.Router();

// Comunidades requeridas
const REQUIRED_COMMUNITIES = [
  { id: 36096274, name: 'Sideral Studios' },
  { id: 36098826, name: 'Weezy Studios' },
  { id: 36098969, name: 'Talla Studios' },
  { id: 776242820, name: 'Brahma Studios' },
  { id: 701884342, name: 'Maello Studios' },
  { id: 505924865, name: 'Remko Games' },
  { id: 181415500, name: 'Damer Studios' },
  { id: 35833534, name: 'AlpacaGamesStudios' },
  { id: 35937154, name: 'Rayita Games' },
  { id: 35714192, name: 'Peru UGC' }
];

const DAYS_REQUIRED = 14;

/**
 * Verifica si un usuario está en un grupo específico
 */
const isUserInGroup = async (userId, groupId) => {
  try {
    const response = await fetch(
      `https://groups.roblox.com/v1/users/${userId}/groups/roles`
    );
    
    if (!response.ok) {
      console.error(`Error verificando grupo ${groupId} para usuario ${userId}`);
      return false;
    }
    
    const data = await response.json();
    const groups = data.data || [];
    
    return groups.some(g => g.group.id === groupId);
  } catch (error) {
    console.error(`Error en verificación de grupo:`, error);
    return false;
  }
};

/**
 * Verifica membresía en todas las comunidades
 */
const verifyAllCommunities = async (userId) => {
  const results = await Promise.all(
    REQUIRED_COMMUNITIES.map(async (community) => {
      const isMember = await isUserInGroup(userId, community.id);
      return {
        communityId: community.id,
        communityName: community.name,
        isMember
      };
    })
  );
  
  const allJoined = results.every(r => r.isMember);
  const joinedCount = results.filter(r => r.isMember).length;
  
  return {
    allJoined,
    joinedCount,
    totalRequired: REQUIRED_COMMUNITIES.length,
    details: results
  };
};

// POST - Registrar usuario para verificación
router.post('/register', async (req, res) => {
  try {
    const { robloxUserId, robloxUsername } = req.body;
    
    if (!robloxUserId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de usuario de Roblox requerido' 
      });
    }
    
    console.log(`📝 Registrando verificación para usuario ${robloxUserId}...`);
    
    // Verificar membresía actual
    const verification = await verifyAllCommunities(robloxUserId);
    
    if (!verification.allJoined) {
      return res.json({
        success: false,
        error: 'No estás en todas las comunidades',
        data: {
          joined: verification.joinedCount,
          required: verification.totalRequired,
          missing: verification.details.filter(d => !d.isMember)
        }
      });
    }
    
    // Guardar en base de datos
    const db = getDB('users');
    await db.read();
    
    // Buscar si ya existe registro
    let userVerification = db.data.communityVerifications?.find(
      v => v.robloxUserId === parseInt(robloxUserId)
    );
    
    if (!db.data.communityVerifications) {
      db.data.communityVerifications = [];
    }
    
    const now = new Date().toISOString();
    
    if (userVerification) {
      // Ya existe, verificar si aún está en todos
      if (userVerification.leftCommunity) {
        // Había salido, reiniciar contador
        userVerification.firstVerifiedAt = now;
        userVerification.daysVerified = 1;
        userVerification.leftCommunity = false;
      }
    } else {
      // Nuevo registro
      userVerification = {
        robloxUserId: parseInt(robloxUserId),
        robloxUsername,
        firstVerifiedAt: now,
        lastVerifiedAt: now,
        daysVerified: 1,
        isFullyVerified: false,
        leftCommunity: false
      };
      db.data.communityVerifications.push(userVerification);
    }
    
    await db.write();
    
    console.log(`✅ Usuario ${robloxUserId} registrado. Día 1/${DAYS_REQUIRED}`);
    
    res.json({
      success: true,
      message: 'Registro exitoso',
      data: {
        daysVerified: userVerification.daysVerified,
        daysRequired: DAYS_REQUIRED,
        isFullyVerified: userVerification.isFullyVerified,
        canBuyInstant: userVerification.daysVerified >= DAYS_REQUIRED
      }
    });
    
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ success: false, error: 'Error al registrar' });
  }
});

// GET - Verificar estado de usuario
router.get('/status/:robloxUserId', async (req, res) => {
  try {
    const { robloxUserId } = req.params;
    
    const db = getDB('users');
    await db.read();
    
    const verification = db.data.communityVerifications?.find(
      v => v.robloxUserId === parseInt(robloxUserId)
    );
    
    if (!verification) {
      return res.json({
        success: true,
        data: {
          isRegistered: false,
          daysVerified: 0,
          daysRequired: DAYS_REQUIRED,
          isFullyVerified: false,
          deliveryType: 'pending',
          deliveryTime: '48 horas - 7 días'
        }
      });
    }
    
    const deliveryType = verification.daysVerified >= DAYS_REQUIRED ? 'instant' : 'pending';
    const deliveryTime = verification.daysVerified >= DAYS_REQUIRED 
      ? 'Instantáneo (pocos minutos)' 
      : '48 horas - 7 días';
    
    res.json({
      success: true,
      data: {
        isRegistered: true,
        daysVerified: verification.daysVerified,
        daysRequired: DAYS_REQUIRED,
        isFullyVerified: verification.isFullyVerified,
        deliveryType,
        deliveryTime,
        firstVerifiedAt: verification.firstVerifiedAt,
        lastVerifiedAt: verification.lastVerifiedAt
      }
    });
    
  } catch (error) {
    console.error('Error verificando estado:', error);
    res.status(500).json({ success: false, error: 'Error al verificar estado' });
  }
});

// GET - Verificar membresía actual
router.get('/check/:robloxUserId', async (req, res) => {
  try {
    const { robloxUserId } = req.params;
    
    console.log(`🔍 Verificando comunidades para usuario ${robloxUserId}...`);
    
    const verification = await verifyAllCommunities(robloxUserId);
    
    res.json({
      success: true,
      data: verification
    });
    
  } catch (error) {
    console.error('Error verificando comunidades:', error);
    res.status(500).json({ success: false, error: 'Error al verificar' });
  }
});

// POST - Verificación diaria automática (CRON)
router.post('/daily-check', async (req, res) => {
  try {
    console.log('🔄 Ejecutando verificación diaria de comunidades...');
    
    const db = getDB('users');
    await db.read();
    
    if (!db.data.communityVerifications) {
      return res.json({ success: true, message: 'No hay usuarios para verificar' });
    }
    
    let verified = 0;
    let leftCommunity = 0;
    let completed = 0;
    
    for (const userVerification of db.data.communityVerifications) {
      // Solo verificar si no ha completado los 14 días
      if (userVerification.isFullyVerified) continue;
      
      const check = await verifyAllCommunities(userVerification.robloxUserId);
      
      if (check.allJoined) {
        // Sigue en todas, incrementar contador
        userVerification.daysVerified++;
        userVerification.lastVerifiedAt = new Date().toISOString();
        userVerification.leftCommunity = false;
        
        if (userVerification.daysVerified >= DAYS_REQUIRED) {
          userVerification.isFullyVerified = true;
          completed++;
          console.log(`✅ Usuario ${userVerification.robloxUserId} completó 14 días!`);
        } else {
          verified++;
          console.log(`✓ Usuario ${userVerification.robloxUserId}: Día ${userVerification.daysVerified}/${DAYS_REQUIRED}`);
        }
      } else {
        // Salió de alguna comunidad, reiniciar
        userVerification.leftCommunity = true;
        userVerification.daysVerified = 0;
        userVerification.isFullyVerified = false;
        leftCommunity++;
        console.log(`❌ Usuario ${userVerification.robloxUserId} salió de comunidades. Contador reiniciado.`);
      }
    }
    
    await db.write();
    
    console.log(`✅ Verificación diaria completada: ${verified} verificados, ${completed} completados, ${leftCommunity} salieron`);
    
    res.json({
      success: true,
      data: {
        verified,
        completed,
        leftCommunity,
        total: db.data.communityVerifications.length
      }
    });
    
  } catch (error) {
    console.error('Error en verificación diaria:', error);
    res.status(500).json({ success: false, error: 'Error en verificación' });
  }
});

// GET - Lista de comunidades requeridas
router.get('/communities', (req, res) => {
  res.json({
    success: true,
    data: {
      communities: REQUIRED_COMMUNITIES,
      daysRequired: DAYS_REQUIRED,
      totalRequired: REQUIRED_COMMUNITIES.length
    }
  });
});

export default router;
