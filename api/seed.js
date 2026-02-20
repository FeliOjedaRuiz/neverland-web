// require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/event.model');
const Config = require('./models/config.model');

// Hardcoded for seed script simplicity in this environment
const MONGO_URI = 'mongodb+srv://felicianoojedaruiz:h5D9YS7JO1QBAfYM@proyects-cluster.gmoy64l.mongodb.net/neverland-app';

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Connected to MongoDB');

    // CLEAR DB
    await Event.deleteMany({});
    await Config.deleteMany({});
    console.log('🧹 Database Cleared');

    // 1. CREATE ROBUST CONFIG
    const config = await Config.create({
      menusNiños: [
        { id: 1, nombre: 'Menú 1', precio: 10, principal: 'Sandwich', resto: 'Patatas, Bebida, Postre', active: true },
        { id: 2, nombre: 'Menú 2', precio: 11, principal: 'Pizza', resto: 'Patatas, Bebida, Postre', active: true },
        { id: 3, nombre: 'Menú 3', precio: 12, principal: 'Hamburguesa', resto: 'Patatas, Bebida, Postre', active: true },
        { id: 4, nombre: 'Menú 4', precio: 14, principal: 'Nuggets', resto: 'Patatas, Bebida, Postre', active: true }
      ],
      plusFinDeSemana: 1.5,
      preciosAdultos: [
        { id: 'salaillas', nombre: 'Salaillas con Jamón', precio: 14, unidades: '10 unidades', active: true },
        { id: 'tortilla', nombre: 'Tortilla de Patatas', precio: 12, unidades: '1 unidad', active: true },
        { id: 'croquetas', nombre: 'Croquetas Caseras', precio: 15, unidades: '12 unidades', active: true },
        { id: 'empanada', nombre: 'Empanada Atún', precio: 18, unidades: '1 unidad', active: true }
      ],
      workshops: [
        { id: 'w1', name: 'Cocina Creativa', priceBase: 25, pricePlus: 30, desc: 'Taller de cocina', active: true },
        { id: 'w2', name: 'Ciencia Divertida', priceBase: 25, pricePlus: 30, desc: 'Experimentos', active: true },
        { id: 'w3', name: 'Spa de Princesas', priceBase: 30, pricePlus: 35, desc: 'Relax y belleza', active: true }
      ],
      characters: ['Mickey', 'Minnie', 'Elsa', 'Spiderman'],
      preciosExtras: {
        tallerBase: 25,
        tallerPlus: 30,
        personaje: 40,
        pinata: 15,
        extension30: 30,
        extension60: 50
      }
    });
    console.log('✅ Configuration Seeded');

    // 2. CREATE TEST EVENTS

    // Event A: Pending, Basic (Just Menu 1)
    await Event.create({
      tipo: 'reserva',
      estado: 'pendiente',
      fecha: new Date('2026-03-10'), // Weekday
      turno: 'T1',
      cliente: {
        nombreNiño: 'Test Niño 1',
        edadNiño: 5,
        nombrePadre: 'Padre Test',
        telefono: '+34600000000',
        email: 'test@test.com'
      },
      detalles: {
        niños: { cantidad: 15, menuId: 1, precioApplied: 10 }, // Snapshot 10
        adultos: { cantidad: 2, comida: [] },
        extras: { taller: 'ninguno', personaje: 'ninguno', pinata: false }
      },
      horario: { inicio: '17:00', fin: '19:00' },
      precioTotal: 150 // 15 * 10
    });

    // Event B: Confirmed, Full Extras (Weekend)
    await Event.create({
      tipo: 'reserva',
      estado: 'confirmado',
      fecha: new Date('2026-03-14'), // Saturday (+1.5/child)
      turno: 'T2',
      cliente: {
        nombreNiño: 'Test Niño 2',
        edadNiño: 8,
        nombrePadre: 'Madre Test',
        telefono: '+34600000000',
        email: 'test2@test.com'
      },
      detalles: {
        niños: { cantidad: 12, menuId: 2, precioApplied: 11 }, // Snapshot 11 + 1.5 weekend logic calculation
        adultos: {
          cantidad: 10,
          comida: [
            { item: 'Salaillas con Jamón', cantidad: 2, precioUnitario: 14 }
          ]
        },
        extras: {
          taller: 'Spa de Princesas',
          precioTallerApplied: 30, // Base price for < 15 kids
          personaje: 'Elsa',
          precioPersonajeApplied: 40
        }
      },
      horario: { inicio: '18:00', fin: '20:00' },
      precioTotal: 248 // Manual calculation set
    });

    console.log('✅ Events Seeded');

    console.log('🚀 SEED COMPLETE');
    process.exit(0);

  } catch (err) {
    console.error('❌ SEED FAILED:', err);
    process.exit(1);
  }
};

seedDB();
