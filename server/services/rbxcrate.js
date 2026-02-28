import fetch from 'node-fetch';

const RBXCRATE_API_URL = 'https://rbxcave.com/api/orders/gamepass';
const RBXCRATE_API_KEY = 'lycmCSzJefXgJmQsCNyCwKSLHyY6bgr04DTYv9x7GnWZhvhekX8oh7bcDWAF62dlwoGRnZVSAWq0MvlE';

/**
 * Procesa una orden de Gamepass usando RBX Crate
 * @param {Object} orderData - Datos de la orden
 * @param {string} orderData.orderId - ID de la orden en nuestro sistema
 * @param {string} orderData.robloxUsername - Usuario de Roblox del cliente
 * @param {number} orderData.robuxAmount - Cantidad de Robux
 * @param {number} orderData.placeId - ID del lugar de Roblox
 * @param {boolean} orderData.isPreOrder - Si es pre-orden (recomendado: true)
 * @param {boolean} orderData.checkOwnership - Verificar propiedad (false para group passes)
 * @returns {Promise<Object>} Respuesta de RBX Crate
 */
export const processGamepassOrder = async (orderData) => {
  try {
    console.log('🎫 Procesando orden de gamepass con RBX Crate:', orderData.orderId);

    const payload = {
      orderId: orderData.orderId,
      robloxUsername: orderData.robloxUsername,
      robuxAmount: orderData.robuxAmount,
      placeId: orderData.placeId,
      isPreOrder: orderData.isPreOrder !== undefined ? orderData.isPreOrder : true,
      checkOwnership: orderData.checkOwnership !== undefined ? orderData.checkOwnership : false
    };

    console.log('📦 Payload para RBX Crate:', payload);

    const response = await fetch(RBXCRATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': RBXCRATE_API_KEY
      },
      body: JSON.stringify(payload)
    });

    // Obtener el texto de la respuesta primero
    const responseText = await response.text();
    console.log('🔍 Respuesta raw de RBX Crate:', responseText);
    
    // Intentar parsear como JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Error parseando respuesta de RBX Crate:', responseText);
      throw new Error(`RBX Crate devolvió una respuesta no válida: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
      console.error('❌ Error de RBX Crate:', data);
      throw new Error(data.message || 'Error al procesar con RBX Crate');
    }

    console.log('✅ Respuesta exitosa de RBX Crate:', data);
    return {
      success: true,
      data: data
    };

  } catch (error) {
    console.error('❌ Error procesando gamepass con RBX Crate:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verifica el estado de una orden en RBX Crate
 * @param {string} orderId - ID de la orden
 * @returns {Promise<Object>} Estado de la orden
 */
export const checkOrderStatus = async (orderId) => {
  try {
    console.log('🔍 Verificando estado de orden:', orderId);

    const response = await fetch(`${RBXCRATE_API_URL}/${orderId}`, {
      method: 'GET',
      headers: {
        'api-key': RBXCRATE_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error('Error al verificar estado de la orden');
    }

    const data = await response.json();
    console.log('✅ Estado de la orden:', data);
    
    return {
      success: true,
      data: data
    };

  } catch (error) {
    console.error('❌ Error verificando estado:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
