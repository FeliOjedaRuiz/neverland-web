const mongoose = require('mongoose');
const Config = require('./models/config.model');

// Using the same connection URI from seed.js
const MONGO_URI = 'mongodb+srv://felicianoojedaruiz:h5D9YS7JO1QBAfYM@proyects-cluster.gmoy64l.mongodb.net/neverland-app';

const backupData = {
  "preciosExtras": {
    "tallerBase": 25,
    "tallerPlus": 30,
    "personaje": 40,
    "pinata": 15,
    "extension30": 30,
    "extension60": 50
  },
  "characters": [
    "Mickey", "Minnie", "Goofy", "Donald", "Daysi", "Sonic", "Stich", "Marshall",
    "Sky", "Mario", "Luigi", "Bella", "Bestia", "Cenicienta", "Príncipe",
    "Aladín", "Jasmín", "Blancanieves", "Elsa", "Anna", "Olaf", "K-Pop", "Vaina"
  ],
  "preciosAdultos": [
    { "id": "699397b24eb2caf3abf67a4a", "nombre": "Croquetas ", "precio": 15, "unidades": "12 unidades" },
    { "id": "699397b24eb2caf3abf67a4b", "nombre": "Salaillas con Jamón", "precio": 14, "unidades": "10 Unidades" },
    { "id": "699397b24eb2caf3abf67a4c", "nombre": "Tortilla de Patatas", "precio": 12, "unidades": "1 Unidad" },
    { "id": "699397b24eb2caf3abf67a4d", "nombre": "Saladitos Variados", "precio": 16, "unidades": "45 Unidades" },
    { "id": "699397b24eb2caf3abf67a4e", "nombre": "Pasteles Surtidos", "precio": 16, "unidades": "25 Unidades" },
    { "id": "699397b24eb2caf3abf67a4f", "nombre": "Bocadillos", "precio": 14, "unidades": "12 Unidades" }
  ],
  "workshops": [
    { "id": "699397b24eb2caf3abf67a50", "name": "Pintacaras", "priceBase": 25, "pricePlus": 30, "desc": "Maquillaje de fantasía arcoiris para todos." },
    { "id": "699397b24eb2caf3abf67a51", "name": "Taller de Slime", "priceBase": 25, "pricePlus": 30, "desc": "¡Creación de slime pegajoso y divertido!" },
    { "id": "699397b24eb2caf3abf67a52", "name": "Show de Magia", "priceBase": 25, "pricePlus": 30, "desc": "Trucos increíbles para sorprender." },
    { "id": "699397b24eb2caf3abf67a53", "name": "Spa de Princesas", "priceBase": 25, "pricePlus": 30, "desc": "¡Un momento de relax para nuestras princesitas!" },
    { "id": "6994d2fa9544d7ece264a68e", "name": "Taller de Princesas", "priceBase": 25, "pricePlus": 30, "desc": "¡Vive un cuento de hadas! Disfraces, coronas y maquillaje mágico.", "imageUrl": "princesas_workshop_banner.png" }
  ],
  "menusNiños": [
    { "id": "699397b24eb2caf3abf67a54", "nombre": "Menú 1", "precio": 9, "principal": "Sandwiches ( 2 1/2 ) dulce o salado", "resto": "-Zumo, batido o refresco\n-Tarta\n-Cono de chuches" },
    { "id": "699397b24eb2caf3abf67a55", "nombre": "Menú 2", "precio": 9, "principal": "Perrito caliente", "resto": "-Zumo, batido o refresco\n-Tarta\n-Cono de chuches" },
    { "id": "699397b24eb2caf3abf67a56", "nombre": "Menú 3", "precio": 10, "principal": "Porción de pizza", "resto": "-Zumo, batido o refresco\n-Tarta\n-Cono de chuches" },
    { "id": "699397b24eb2caf3abf67a57", "nombre": "Menú 4", "precio": 12, "principal": "Hamburguesa", "resto": "-Zumo, batido o refresco\n-Tarta\n-Cono de chuches" }
  ],
  "plusFinDeSemana": 1.5
};

const restoreConfig = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Connected to MongoDB');

    // Remove current config and insert the original one
    await Config.deleteMany({});
    await Config.create(backupData);

    console.log('✅ Configuration Restored Successfully from Backup');
    process.exit(0);
  } catch (err) {
    console.error('❌ Restore failed:', err);
    process.exit(1);
  }
};

restoreConfig();
