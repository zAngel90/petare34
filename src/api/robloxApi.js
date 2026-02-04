/**
 * Roblox API Service
 * Interactúa con la API pública de Roblox a través de nuestro proxy backend
 */

import { API_CONFIG, buildURL, apiFetch } from '../config/api';

// Nuestro backend proxy
const PROXY_BASE = API_CONFIG.BASE_URL;

/**
 * Busca usuarios de Roblox por nombre de usuario
 * @param {string} username - Nombre de usuario a buscar
 * @returns {Promise<Array>} - Lista de usuarios encontrados
 */
export const searchRobloxUser = async (username) => {
  if (!username || username.length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `${PROXY_BASE}/users/search?keyword=${encodeURIComponent(username)}`
    );
    
    if (response.status === 429) {
      console.warn('Rate limit alcanzado');
      return null; // null indica rate limit
    }
    
    if (!response.ok) {
      throw new Error('Error al buscar usuario');
    }

    const data = await response.json();
    const users = data.data || [];
    
    // Solo aceptar match exacto (case insensitive)
    const exactMatch = users.find(u => u.name.toLowerCase() === username.toLowerCase());
    if (exactMatch) {
      return [exactMatch]; // Solo devolver el match exacto
    }
    
    // Si no hay match exacto, no devolver nada
    return [];
  } catch (error) {
    console.error('Error buscando usuario de Roblox:', error);
    return [];
  }
};

/**
 * Obtiene información detallada de un usuario por ID
 * @param {number} userId - ID del usuario de Roblox
 * @returns {Promise<Object>} - Información del usuario
 */
export const getRobloxUserById = async (userId) => {
  try {
    const response = await fetch(`${PROXY_BASE}/users/${userId}`);
    
    if (!response.ok) {
      throw new Error('Usuario no encontrado');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo usuario de Roblox:', error);
    return null;
  }
};

/**
 * Obtiene el avatar/thumbnail de un usuario
 * @param {number} userId - ID del usuario de Roblox
 * @param {string} size - Tamaño del thumbnail (48x48, 60x60, 150x150, 420x420)
 * @returns {Promise<string>} - URL del thumbnail
 */
export const getRobloxUserThumbnail = async (userId, size = '150x150') => {
  try {
    const response = await fetch(
      `${PROXY_BASE}/thumbnails/avatar-headshot?userIds=${userId}&size=${size}`
    );
    
    if (!response.ok) {
      throw new Error('Error al obtener thumbnail');
    }

    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      return data.data[0].imageUrl;
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo thumbnail de Roblox:', error);
    return null;
  }
};

/**
 * Obtiene información completa del usuario incluyendo avatar
 * @param {string} username - Nombre de usuario
 * @returns {Promise<Object>} - Usuario con toda la información
 */
export const getCompleteRobloxUser = async (username) => {
  try {
    // Primero buscamos el usuario
    const searchResults = await searchRobloxUser(username);
    
    if (!searchResults || searchResults.length === 0) {
      return null;
    }

    // Tomamos el primer resultado (match exacto o más cercano)
    const user = searchResults[0];
    
    // Obtenemos el thumbnail
    const thumbnail = await getRobloxUserThumbnail(user.id);
    
    return {
      ...user,
      avatarUrl: thumbnail
    };
  } catch (error) {
    console.error('Error obteniendo usuario completo:', error);
    return null;
  }
};

/**
 * Valida si un nombre de usuario existe en Roblox
 * @param {string} username - Nombre de usuario a validar
 * @returns {Promise<boolean>} - true si existe, false si no
 */
export const validateRobloxUsername = async (username) => {
  try {
    const results = await searchRobloxUser(username);
    
    // Buscamos coincidencia exacta (case insensitive)
    const exactMatch = results.find(
      user => user.name.toLowerCase() === username.toLowerCase()
    );
    
    return !!exactMatch;
  } catch (error) {
    console.error('Error validando usuario:', error);
    return false;
  }
};

/**
 * Obtiene los places/juegos de un usuario
 * @param {number} userId - ID del usuario de Roblox
 * @returns {Promise<Array>} - Lista de places
 */
export const getUserPlaces = async (userId) => {
  try {
    const response = await fetch(
      `${PROXY_BASE}/users/${userId}/places`
    );
    
    if (!response.ok) {
      throw new Error('Error al obtener places');
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error obteniendo places:', error);
    return [];
  }
};

/**
 * Obtiene los gamepasses de un place específico
 * @param {number} placeId - ID del place
 * @returns {Promise<Array>} - Lista de gamepasses
 */
export const getPlaceGamePasses = async (placeId) => {
  try {
    const response = await fetch(
      `${PROXY_BASE}/places/${placeId}/gamepasses`,
      {
        cache: 'no-store', // Forzar búsqueda fresca, no usar caché
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Error al obtener gamepasses');
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error obteniendo gamepasses del place:', error);
    return [];
  }
};

/**
 * Busca gamepasses por ID directamente
 * @param {number} gamepassId - ID del gamepass
 * @returns {Promise<Object>} - Información del gamepass
 */
export const getGamePassById = async (gamepassId) => {
  try {
    const response = await fetch(
      `${PROXY_BASE}/gamepasses/${gamepassId}`,
      {
        cache: 'no-store', // Forzar búsqueda fresca, no usar caché
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Gamepass no encontrado');
    }

    const data = await response.json();
    console.log('Datos recibidos del gamepass:', data);
    
    // Obtener thumbnail (sin caché también)
    const thumbResponse = await fetch(
      `${PROXY_BASE}/thumbnails/assets?assetIds=${gamepassId}&size=150x150`,
      {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    );
    const thumbData = await thumbResponse.json();
    const thumbnail = thumbData.data?.[0]?.imageUrl;

    // Adaptar según la estructura de respuesta
    const gamepassInfo = {
      id: gamepassId,
      name: data.Name || data.name || data.displayName || 'Gamepass',
      displayName: data.DisplayName || data.displayName || data.Name || data.name || 'Gamepass',
      thumbnail: thumbnail || null,
      price: data.PriceInRobux || data.priceInRobux || data.price || 0
    };

    console.log('Gamepass procesado:', gamepassInfo);
    return gamepassInfo;
  } catch (error) {
    console.error('Error obteniendo gamepass:', error);
    return null;
  }
};
