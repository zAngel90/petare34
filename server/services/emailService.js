// Configuración de Brevo (anteriormente Sendinblue)
const BREVO_CONFIG = {
  apiKey: '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',
  apiUrl: 'https://api.brevo.com/v3/smtp/email',
  sender: {
    name: 'RLS Robux Store',
    email: 'noreply@rbxlatamstore.com'
  }
};

/**
 * Generar código de verificación de 6 dígitos
 */
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Enviar email usando Brevo API
 */
const sendBrevoEmail = async (to, subject, htmlContent) => {
  try {
    const response = await fetch(BREVO_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_CONFIG.apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: BREVO_CONFIG.sender,
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error sending email');
    }

    const result = await response.json();
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error enviando email con Brevo:', error);
    throw error;
  }
};

/**
 * Enviar email de verificación con código
 */
export const sendVerificationEmail = async (email, username, code) => {
  try {
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 30px; text-align: center; }
            .header h1 { color: #000; margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .code-box { background: #f8f8f8; border: 2px dashed #FFD700; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
            .code { font-size: 36px; font-weight: bold; color: #FFD700; letter-spacing: 8px; }
            .footer { background: #f8f8f8; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .btn { display: inline-block; padding: 12px 30px; background: #FFD700; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎮 RLS Robux Store</h1>
            </div>
            <div class="content">
              <h2>¡Hola ${username}!</h2>
              <p>Gracias por registrarte en RLS Robux Store. Para completar tu registro, por favor verifica tu dirección de correo electrónico.</p>
              
              <p><strong>Tu código de verificación es:</strong></p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <p>Este código expirará en <strong>15 minutos</strong>.</p>
              
              <p>Si no solicitaste este registro, puedes ignorar este correo.</p>
              
              <p>¡Gracias!<br>El equipo de RLS Robux Store</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} RLS Robux Store. Todos los derechos reservados.</p>
              <p>Este es un correo automático, por favor no respondas.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    const result = await sendBrevoEmail(email, '🔐 Verifica tu cuenta en RLS Robux Store', htmlContent);
    console.log('✅ Email de verificación enviado:', email);
    return result;
  } catch (error) {
    console.error('❌ Error enviando email de verificación:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Enviar notificación a administradores sobre nuevo pedido
 */
export const sendOrderNotificationToAdmins = async (order, adminEmails) => {
  if (!adminEmails || adminEmails.length === 0) {
    console.log('⚠️ No hay emails de admin configurados');
    return { success: false, error: 'No admin emails configured' };
  }

  try {
    const productName = order.productType === 'robux' 
      ? `${order.amount} Robux`
      : (order.productDetails?.items?.map(i => i.name).join(', ') || 'Producto In-Game');

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: #FFD700; padding: 20px; text-align: center; }
            .header h1 { color: #000; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .order-info { background: #f8f8f8; border-left: 4px solid #FFD700; padding: 20px; margin: 20px 0; }
            .order-info p { margin: 8px 0; }
            .label { font-weight: bold; color: #666; }
            .value { color: #000; }
            .btn { display: inline-block; padding: 12px 30px; background: #FFD700; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f8f8f8; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Nuevo Pedido Recibido</h1>
            </div>
            <div class="content">
              <p>Se ha registrado un nuevo pedido en la tienda:</p>
              
              <div class="order-info">
                <p><span class="label">ID del Pedido:</span> <span class="value">#${order.id}</span></p>
                <p><span class="label">Cliente:</span> <span class="value">${order.userEmail}</span></p>
                <p><span class="label">Usuario Roblox:</span> <span class="value">${order.robloxUsername || 'N/A'}</span></p>
                <p><span class="label">Producto:</span> <span class="value">${productName}</span></p>
                <p><span class="label">Precio:</span> <span class="value">${order.currency} ${order.price}</span></p>
                <p><span class="label">Método de Pago:</span> <span class="value">${order.paymentMethod}</span></p>
                <p><span class="label">Estado:</span> <span class="value">${order.status}</span></p>
                <p><span class="label">Fecha:</span> <span class="value">${new Date(order.createdAt).toLocaleString('es-ES')}</span></p>
              </div>
              
              <p>Por favor, revisa y procesa este pedido lo antes posible.</p>
              
              <a href="https://rbxlatamstore.com/admin" class="btn">Ver en Panel Admin</a>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} RLS Robux Store - Notificación Automática</p>
            </div>
          </div>
        </body>
        </html>
      `;

    // Enviar a cada admin por separado (Brevo no permite múltiples destinatarios en "to")
    const promises = adminEmails.map(adminEmail => 
      sendBrevoEmail(adminEmail, `🔔 Nuevo Pedido #${order.id} - ${order.userEmail}`, htmlContent)
    );
    
    await Promise.all(promises);
    console.log('✅ Notificación enviada a admins:', adminEmails.join(', '));
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando notificación a admins:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Enviar email de bienvenida después de verificar
 */
export const sendWelcomeEmail = async (email, username) => {
  try {
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 40px; text-align: center; }
            .header h1 { color: #000; margin: 0; font-size: 32px; }
            .content { padding: 40px 30px; }
            .footer { background: #f8f8f8; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .btn { display: inline-block; padding: 14px 35px; background: #FFD700; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 ¡Cuenta Verificada!</h1>
            </div>
            <div class="content">
              <h2>¡Hola ${username}!</h2>
              <p>Tu cuenta ha sido verificada exitosamente. ¡Ya puedes disfrutar de todas las funcionalidades de RLS Robux Store!</p>
              
              <p><strong>¿Qué puedes hacer ahora?</strong></p>
              <ul>
                <li>🎮 Comprar Robux al mejor precio</li>
                <li>⚔️ Adquirir items in-game exclusivos</li>
                <li>🎁 Acceder a ofertas especiales</li>
                <li>📦 Rastrear tus pedidos en tiempo real</li>
              </ul>
              
              <a href="https://rbxlatamstore.com" class="btn">Ir a la Tienda</a>
              
              <p>¡Gracias por confiar en nosotros!<br>El equipo de RLS Robux Store</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} RLS Robux Store. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    const result = await sendBrevoEmail(email, '🎉 ¡Bienvenido a RLS Robux Store!', htmlContent);
    console.log('✅ Email de bienvenida enviado:', email);
    return result;
  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error);
    return { success: false, error: error.message };
  }
};

export default {
  generateVerificationCode,
  sendVerificationEmail,
  sendOrderNotificationToAdmins,
  sendWelcomeEmail
};
