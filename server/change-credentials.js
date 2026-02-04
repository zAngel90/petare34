import bcrypt from 'bcryptjs';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Nuevas credenciales
const NEW_EMAIL = 'wbadmin@rlseirl.com';
const NEW_PASSWORD = 'l_S#R18@msh';

async function changeCredentials() {
  try {
    console.log('🔄 Cambiando credenciales del admin...\n');

    // Conectar a la base de datos
    const dbPath = join(__dirname, 'db', 'admins.json');
    const adapter = new JSONFile(dbPath);
    const db = new Low(adapter, { admins: [] });

    await db.read();

    // Generar hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

    // Actualizar credenciales del admin principal
    if (db.data.admins.length > 0) {
      db.data.admins[0].email = NEW_EMAIL;
      db.data.admins[0].password = hashedPassword;
      db.data.admins[0].updatedAt = new Date().toISOString();

      await db.write();

      console.log('✅ Credenciales actualizadas exitosamente!\n');
      console.log('📧 Nuevo email:', NEW_EMAIL);
      console.log('🔑 Nueva contraseña: [CONFIGURADA]');
      console.log('\n⚠️  Reinicia el servidor para aplicar los cambios.');
      console.log('    pm2 restart all  (si usas pm2)');
      console.log('    o reinicia el proceso de node manualmente\n');
    } else {
      console.log('❌ No se encontró ningún admin en la base de datos');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

changeCredentials();
