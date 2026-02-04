import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbDir = join(__dirname, 'db');

// Crear directorio de base de datos si no existe
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Estructura inicial de datos
const defaultData = {
  users: {
    users: []
  },
  products: {
    robuxPackages: [
      {
        id: 1,
        amount: 400,
        price: 4.99,
        discount: 0,
        popular: false,
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        amount: 800,
        price: 9.99,
        discount: 0,
        popular: true,
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        amount: 1700,
        price: 19.99,
        discount: 0,
        popular: false,
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 4,
        amount: 4500,
        price: 49.99,
        discount: 10,
        popular: false,
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 5,
        amount: 10000,
        price: 99.99,
        discount: 15,
        popular: false,
        active: true,
        createdAt: new Date().toISOString()
      }
    ],
    inGameProducts: []
  },
  orders: {
    orders: []
  },
  paymentMethods: {
    methods: [
      {
        id: 'bank_transfer',
        name: 'Transferencia Bancaria',
        type: 'bank',
        active: true,
        config: {
          bankName: '',
          accountNumber: '',
          accountHolder: '',
          accountType: '',
          identification: ''
        },
        createdAt: new Date().toISOString()
      }
    ]
  },
  settings: {
    siteName: 'RoboStore',
    commission: 0.7, // 70% que recibe el usuario (30% se queda Roblox)
    currency: 'USD',
    adminEmail: 'admin@robostore.com',
    createdAt: new Date().toISOString()
  },
  admins: {
    admins: [
      {
        id: 'admin-1',
        email: 'admin@rlsstore.com',
        password: '$2a$10$lwxqYcb5MtEjy7gHWbk.HeOOo5c6XLLEkcMy..X3YqRHnMD6GFEYy', // admin123
        name: 'Admin Principal',
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    ]
  },
  chat: {
    conversations: [],
    messages: []
  },
  homeConfig: {
    slides: [
      {
        id: 1,
        type: 'corporate', // 'custom' o 'corporate'
        title: 'Robux Premium Bundle',
        description: 'Get the best value with our exclusive bundles',
        image: 'https://via.placeholder.com/1200x500',
        active: true,
        order: 1,
        buttons: [
          {
            text: 'Shop Now',
            url: '/robux',
            style: 'primary'
          },
          {
            text: 'Learn More',
            url: '/catalogo',
            style: 'secondary'
          }
        ],
        createdAt: new Date().toISOString()
      }
    ],
    featuredProducts: {
      topSales: [
        {
          id: 1,
          productId: 2, // ID del producto Robux
          productType: 'robux', // 'robux' o 'ingame'
          customAmount: 800,
          customPrice: 9.99,
          soldCount: 1250,
          order: 1,
          active: true
        }
      ],
      trending: [
        {
          id: 1,
          productId: 1,
          productType: 'robux',
          customAmount: 400,
          customPrice: 4.99,
          soldCount: 890,
          order: 1,
          active: true
        }
      ]
    }
  },
  reviews: {
    reviews: []
  }
};

// Inicializar bases de datos
const databases = {};

const initDB = async (name, defaultValue) => {
  const adapter = new JSONFile(join(dbDir, `${name}.json`));
  const db = new Low(adapter, defaultValue);
  await db.read();
  
  // Si no existe data, usar default
  if (!db.data) {
    db.data = defaultValue;
    await db.write();
  }
  
  return db;
};

// Inicializar todas las bases de datos
export const initDatabases = async () => {
  databases.users = await initDB('users', defaultData.users);
  databases.products = await initDB('products', defaultData.products);
  databases.orders = await initDB('orders', defaultData.orders);
  databases.paymentMethods = await initDB('paymentMethods', defaultData.paymentMethods);
  databases.settings = await initDB('settings', defaultData.settings);
  databases.admins = await initDB('admins', defaultData.admins);
  databases.chat = await initDB('chat', defaultData.chat);
  databases.homeConfig = await initDB('homeConfig', defaultData.homeConfig);
  databases.reviews = await initDB('reviews', defaultData.reviews);
  
  console.log('✅ Bases de datos inicializadas');
  return databases;
};

// Obtener una base de datos específica
export const getDB = (name) => {
  if (!databases[name]) {
    throw new Error(`Base de datos '${name}' no encontrada`);
  }
  return databases[name];
};

// Helpers para operaciones comunes
export const dbHelpers = {
  // Generar ID único
  generateId: (items) => {
    if (!items || items.length === 0) return 1;
    return Math.max(...items.map(item => item.id || 0)) + 1;
  },
  
  // Buscar por ID
  findById: (items, id) => {
    return items.find(item => item.id === parseInt(id));
  },
  
  // Actualizar item
  updateItem: (items, id, updates) => {
    const index = items.findIndex(item => item.id === parseInt(id));
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    return items[index];
  },
  
  // Eliminar item
  deleteItem: (items, id) => {
    const index = items.findIndex(item => item.id === parseInt(id));
    if (index === -1) return false;
    items.splice(index, 1);
    return true;
  }
};

export default databases;
