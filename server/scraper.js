import puppeteer from 'puppeteer';

let browser = null;
let pagePool = []; // Pool de páginas reutilizables
const MAX_POOL_SIZE = 3; // Máximo 3 páginas en el pool

// Inicializar el navegador una sola vez
const getBrowser = async () => {
  if (!browser) {
    console.log('🚀 Iniciando navegador Puppeteer...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-images', // No cargar imágenes (más rápido)
        '--disable-javascript-harmony-shipping',
        '--disable-gpu',
        '--disable-software-rasterizer'
      ]
    });
    console.log('✅ Navegador iniciado');
  }
  return browser;
};

// Obtener una página del pool o crear una nueva
const getPage = async () => {
  const browser = await getBrowser();
  
  // Si hay páginas disponibles en el pool, reutilizar
  if (pagePool.length > 0) {
    const page = pagePool.pop();
    console.log(`♻️ Reutilizando página del pool (${pagePool.length} restantes)`);
    return page;
  }
  
  // Si no, crear una nueva
  console.log('📄 Creando nueva página');
  const page = await browser.newPage();
  
  // Configurar la página
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Bloquear solo recursos pesados
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const resourceType = request.resourceType();
    if (['image', 'media'].includes(resourceType)) {
      request.abort();
    } else {
      request.continue();
    }
  });
  
  return page;
};

// Devolver página al pool para reutilizar
const releasePage = async (page) => {
  try {
    // Limpiar la página para reutilizarla
    await page.goto('about:blank');
    
    // Si el pool no está lleno, guardar la página
    if (pagePool.length < MAX_POOL_SIZE) {
      pagePool.push(page);
      console.log(`♻️ Página devuelta al pool (${pagePool.length}/${MAX_POOL_SIZE})`);
    } else {
      // Si el pool está lleno, cerrar la página
      await page.close();
      console.log('📄 Página cerrada (pool lleno)');
    }
  } catch (error) {
    console.error('Error liberando página:', error.message);
    await page.close().catch(() => {});
  }
};

/**
 * Busca un usuario de Roblox scrapeando el sitio web
 * @param {string} username - Nombre de usuario a buscar
 * @returns {Promise<Object|null>} - Información del usuario o null
 */
export const scrapeUserSearch = async (username) => {
  const page = await getPage();
  
  try {
    console.log(`🔍 Scrapeando búsqueda de usuario: ${username}`);
    
    // Ir a la página de búsqueda
    const encodedUsername = encodeURIComponent(username);
    const searchUrl = 'https://www.roblox.com/search/users?keyword=' + encodedUsername;
    console.log(`📄 URL completa: ${searchUrl}`);
    
    // Esperar a que la página cargue con timeout más largo para primera carga
    await page.goto(searchUrl, { 
      waitUntil: 'load',
      timeout: 45000 
    });
    
    // Esperar al selector principal con más tiempo
    await page.waitForSelector('.avatar-card-content, .search-results, .people-list-container', { 
      timeout: 15000 
    }).catch(() => {
      console.log('⚠️ Timeout esperando resultados, intentando extraer datos de todos modos...');
    });
    
    // Tiempo para que JavaScript renderice
    await page.waitForTimeout(2000);
    
    // Extraer datos de los usuarios
    const users = await page.evaluate(() => {
      const results = [];
      
      // Intentar varios selectores porque Roblox cambia su HTML
      const selectors = [
        '.avatar-card-content',
        '.border-bottom.ng-scope',
        '.people-list-container .list-item',
        '[ng-repeat*="user"]'
      ];
      
      let userElements = [];
      for (const selector of selectors) {
        userElements = document.querySelectorAll(selector);
        if (userElements.length > 0) {
          console.log(`Usando selector: ${selector}`);
          break;
        }
      }
      
      userElements.forEach((element) => {
        // Intentar extraer username (no display name)
        // En Roblox, el username está precedido por @ y el display name es el texto grande
        
        // Buscar el link del perfil
        const linkElement = element.querySelector('a[href*="/users/"]');
        const avatarElement = element.querySelector('img, .avatar, .avatar-card-image');
        
        if (linkElement) {
          const profileUrl = linkElement.getAttribute('href');
          const userId = profileUrl ? profileUrl.match(/\/users\/(\d+)/)?.[1] : null;
          
          // Buscar el username (generalmente está después del @ o en un span específico)
          let username = null;
          let displayName = null;
          
          // Método 1: Buscar texto que empiece con @
          const textNodes = element.querySelectorAll('span, div, p');
          textNodes.forEach(node => {
            const text = node.textContent.trim();
            if (text.startsWith('@')) {
              username = text.substring(1); // Quitar el @
            } else if (!displayName && text && text.length > 0 && text.length < 50) {
              displayName = text;
            }
          });
          
          // Método 2: Si no encontró con @, usar el título/texto del link
          if (!username) {
            username = linkElement.getAttribute('title') || linkElement.textContent.trim();
          }
          
          // Método 3: Buscar en clases específicas
          if (!username) {
            const usernameSpan = element.querySelector('.text-overflow, .text-name, .avatar-name');
            if (usernameSpan) {
              username = usernameSpan.textContent.trim().replace('@', '');
            }
          }
          
          const avatar = avatarElement ? avatarElement.getAttribute('src') : null;
          
          if (username && userId) {
            results.push({
              id: parseInt(userId),
              name: username,
              displayName: displayName || username,
              avatarUrl: avatar
            });
          }
        }
      });
      
      return results;
    });
    
    console.log(`✅ Encontrados ${users.length} usuarios via scraping`);
    
    // Buscar match exacto (sin logs detallados para ser más rápido)
    const exactMatch = users.find(u => u.name.toLowerCase() === username.toLowerCase());
    
    if (exactMatch) {
      console.log(`✅ Match encontrado: ${exactMatch.name} (ID: ${exactMatch.id})`);
    } else {
      console.log(`❌ No match exacto. Usuarios: ${users.map(u => u.name).join(', ')}`);
    }
    
    await releasePage(page);
    
    return exactMatch || null;
    
  } catch (error) {
    console.error('❌ Error en scraping:', error.message);
    
    // Intentar cerrar página y devolver al pool si es posible
    try {
      await releasePage(page);
    } catch (e) {
      await page.close().catch(() => {});
    }
    
    return null;
  }
};

/**
 * Obtiene el thumbnail/avatar de un usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<string|null>} - URL del avatar
 */
export const scrapeUserAvatar = async (userId) => {
  const page = await getPage();
  
  try {
    console.log(`🖼️ Scrapeando avatar del usuario: ${userId}`);
    
    await page.goto(`https://www.roblox.com/users/${userId}/profile`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    const avatar = await page.evaluate(() => {
      const avatarImg = document.querySelector('.profile-avatar-thumb img');
      return avatarImg ? avatarImg.getAttribute('src') : null;
    });
    
    await releasePage(page);
    
    console.log(`✅ Avatar obtenido`);
    return avatar;
    
  } catch (error) {
    console.error('❌ Error obteniendo avatar:', error.message);
    await page.close().catch(() => {});
    return null;
  }
};

/**
 * Obtiene los Places/juegos de un usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<Array>} - Lista de places
 */
export const scrapeUserPlaces = async (userId) => {
  const page = await getPage();
  
  try {
    console.log(`🎮 Scrapeando Places del usuario: ${userId}`);
    
    await page.goto(`https://www.roblox.com/users/${userId}/profile#!/creations`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    // Esperar a que carguen los juegos
    await page.waitForSelector('#games-switcher, .slide-item-container-left', { timeout: 5000 }).catch(() => {
      console.log('⚠️ No se encontraron places');
    });
    
    await page.waitForTimeout(500);
    
    const places = await page.evaluate(() => {
      const results = [];
      const placeElements = document.querySelectorAll('.slide-item-container-left');
      
      placeElements.forEach((element) => {
        const linkElement = element.querySelector('a[href*="/games/"]');
        const imgElement = element.querySelector('.slide-item-image');
        const nameElement = element.closest('.hlist').querySelector('.slide-item-name.games');
        const descElement = element.closest('.hlist').querySelector('.slide-item-description.games');
        
        if (linkElement) {
          const href = linkElement.getAttribute('href');
          const placeId = href ? href.match(/\/games\/(\d+)/)?.[1] : null;
          const name = nameElement ? nameElement.textContent.trim() : null;
          const description = descElement ? descElement.textContent.trim() : '';
          const thumbnail = imgElement ? imgElement.getAttribute('src') : null;
          
          if (placeId && name) {
            results.push({
              id: parseInt(placeId),
              name: name,
              description: description,
              thumbnail: thumbnail
            });
          }
        }
      });
      
      return results;
    });
    
    await releasePage(page);
    
    console.log(`✅ Encontrados ${places.length} places`);
    return places;
    
  } catch (error) {
    console.error('❌ Error scrapeando places:', error.message);
    await page.close().catch(() => {});
    return [];
  }
};

/**
 * Obtiene los gamepasses de un Place específico
 * @param {number} placeId - ID del place/juego
 * @returns {Promise<Array>} - Lista de gamepasses
 */
export const scrapePlaceGamePasses = async (placeId) => {
  const page = await getPage();
  
  try {
    console.log(`🎫 Scrapeando gamepasses del place: ${placeId}`);
    
    await page.goto(`https://www.roblox.com/games/${placeId}/game#!/store`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Esperar a que carguen los gamepasses (más tiempo porque es contenido dinámico)
    await page.waitForSelector('.list-item.real-game-pass, #rbx-game-passes', { timeout: 10000 }).catch(() => {
      console.log('⚠️ No se encontraron gamepasses en este place');
    });
    
    await page.waitForTimeout(2000);
    
    const gamepasses = await page.evaluate(() => {
      const results = [];
      const passElements = document.querySelectorAll('.list-item.real-game-pass');
      
      passElements.forEach((element) => {
        const linkElement = element.querySelector('a[href*="/game-pass/"]');
        const imgElement = element.querySelector('img');
        const nameElement = element.querySelector('.store-card-name');
        const priceElement = element.querySelector('.text-robux');
        
        if (linkElement) {
          const href = linkElement.getAttribute('href');
          const passId = href ? href.match(/\/game-pass\/(\d+)/)?.[1] : null;
          const name = nameElement ? nameElement.textContent.trim() : null;
          const thumbnail = imgElement ? imgElement.getAttribute('src') : null;
          const priceText = priceElement ? priceElement.textContent.trim() : '0';
          const price = parseInt(priceText.replace(/\D/g, '')) || 0;
          
          if (passId && name) {
            results.push({
              id: parseInt(passId),
              name: name,
              displayName: name,
              thumbnail: thumbnail,
              price: price
            });
          }
        }
      });
      
      return results;
    });
    
    await releasePage(page);
    
    console.log(`✅ Encontrados ${gamepasses.length} gamepasses en el place`);
    return gamepasses;
    
  } catch (error) {
    console.error('❌ Error scrapeando gamepasses del place:', error.message);
    await page.close().catch(() => {});
    return [];
  }
};

/**
 * Obtiene detalles de un gamepass por ID
 * @param {number} gamepassId - ID del gamepass
 * @returns {Promise<Object|null>} - Información del gamepass
 */
export const scrapeGamePassDetails = async (gamepassId) => {
  const page = await getPage();
  
  try {
    console.log(`🎫 Scrapeando detalles del gamepass: ${gamepassId}`);
    
    await page.goto(`https://www.roblox.com/game-pass/${gamepassId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    const details = await page.evaluate(() => {
      const titleElement = document.querySelector('.game-pass-title, h1');
      const priceElement = document.querySelector('.price-text, .text-robux');
      const imgElement = document.querySelector('.game-pass-image img, .item-image img');
      
      return {
        name: titleElement ? titleElement.textContent.trim() : 'Gamepass',
        price: priceElement ? parseInt(priceElement.textContent.replace(/\D/g, '')) || 0 : 0,
        thumbnail: imgElement ? imgElement.getAttribute('src') : null
      };
    });
    
    await releasePage(page);
    
    console.log(`✅ Detalles del gamepass obtenidos:`, details);
    return {
      id: gamepassId,
      ...details,
      displayName: details.name
    };
    
  } catch (error) {
    console.error('❌ Error obteniendo detalles del gamepass:', error.message);
    await page.close().catch(() => {});
    return null;
  }
};

// Cerrar el navegador cuando el proceso termina
process.on('exit', async () => {
  if (browser) {
    await browser.close();
  }
});

process.on('SIGINT', async () => {
  if (browser) {
    await browser.close();
  }
  process.exit();
});
