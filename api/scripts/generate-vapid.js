/**
 * Script para generar las claves VAPID necesarias para Push Notifications.
 * Ejecutar UNA SOLA VEZ y guardar las claves generadas en .env y en Fly.io secrets.
 *
 * Uso: node api/scripts/generate-vapid.js
 */
const webPush = require('web-push');

const vapidKeys = webPush.generateVAPIDKeys();

console.log('\n✅ VAPID Keys generadas correctamente!\n');
console.log('Copia estas líneas en tu archivo api/.env:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_EMAIL=mailto:hola@neverlandcullarvega.es`);
console.log('\nY también configúralas como secrets en Fly.io:');
console.log(`fly secrets set VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
console.log(`fly secrets set VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
console.log(`fly secrets set VAPID_EMAIL="mailto:hola@neverlandcullarvega.es"\n`);
