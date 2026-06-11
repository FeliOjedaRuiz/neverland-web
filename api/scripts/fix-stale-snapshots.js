/**
 * Script de migración — RECALCULA precioTotal y snapshots de las 6 reservas
 * afectadas por el bug de snapshots stale en PATCH.
 *
 * Usa la misma lógica de calculateEventPrice del controlador para garantizar
 * consistencia con la lógica de negocio.
 *
 * Uso: node scripts/fix-stale-snapshots.js
 *   Con --dry-run: solo reporta, no guarda.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Event = require('../models/event.model');
const Config = require('../models/config.model');
const { safeParseDate } = require('../utils/date');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no definida en api/.env');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');
const AFFECTED_IDS = ['ZCJ33Z', 'SKUTB3', '9MOMOF', 'YOS8HI', '9Z97MA', 'KWK6MQ'];

/**
 * Réplica fiel de calculateEventPrice de events.controllers.js (líneas 53-174).
 * Muta eventData para settear snapshots faltantes.
 */
async function calculatePrice(eventData) {
  const config = await Config.findOne().lean();
  const { tipo, fecha, detalles, horario } = eventData;

  if (tipo === 'bloqueo') return 0;

  const safeConfig = config || {
    menusNiños: [],
    plusFinDeSemana: 1.5,
    preciosAdultos: [],
    preciosExtras: { tallerBase: 25, tallerPlus: 30, personaje: 40, pinata: 15, extension30: 30, extension60: 50 },
    workshops: [],
  };

  let total = 0;

  // 1. Children
  if (detalles?.niños) {
    let childPrice = detalles.niños.precioApplied;
    if (childPrice === undefined || childPrice === null) {
      const menu = safeConfig.menusNiños?.find(
        (m) => String(m.id) === String(detalles.niños.menuId) ||
               String(m._id) === String(detalles.niños.menuId)
      );
      childPrice = menu ? menu.precio : 0;
      detalles.niños.precioApplied = childPrice;
      if (menu && !detalles.niños.menuNombre) {
        detalles.niños.menuNombre = menu.nombre;
      }
    }
    total += childPrice * (detalles.niños.cantidad || 0);

    if (fecha) {
      const dateObj = safeParseDate(fecha);
      const day = dateObj.getDay();
      if (day === 0 || day === 5 || day === 6) {
        total += (safeConfig.plusFinDeSemana || 1.5) * (detalles.niños.cantidad || 0);
      }
    }
  }

  // 2. Adults Food
  const adultosData = detalles?.adultos;
  const comidaList = Array.isArray(adultosData) ? adultosData : (adultosData?.comida || []);
  if (comidaList.length > 0) {
    comidaList.forEach((item) => {
      if (item.precioUnitario !== undefined && item.precioUnitario !== null) {
        total += item.precioUnitario * item.cantidad;
      } else if (safeConfig.preciosAdultos) {
        const adultOption = safeConfig.preciosAdultos.find(
          (opt) => opt.nombre === item.item || String(opt.id) === String(item.item) || String(opt.id) === String(item.id)
        );
        if (adultOption) {
          total += adultOption.precio * item.cantidad;
          item.precioUnitario = adultOption.precio;
        }
      }
    });
  }

  // 3. Extras
  if (detalles?.extras) {
    if (detalles.extras.taller && detalles.extras.taller !== 'ninguno') {
      let tallerPrice = detalles.extras.precioTallerApplied;
      if (tallerPrice === undefined || tallerPrice === null) {
        const workshop = safeConfig.workshops?.find(
          (w) => w.name.toLowerCase() === detalles.extras.taller.toLowerCase()
        );
        const isLargeGroup = (detalles.niños?.cantidad || 0) > 15;
        if (workshop) {
          tallerPrice = isLargeGroup ? workshop.pricePlus : workshop.priceBase;
        } else {
          tallerPrice = isLargeGroup ? 30 : 25;
        }
        detalles.extras.precioTallerApplied = tallerPrice;
      }
      total += tallerPrice;
    }

    if (detalles.extras.personaje && detalles.extras.personaje !== 'ninguno') {
      let charPrice = detalles.extras.precioPersonajeApplied;
      if (charPrice === undefined || charPrice === null) {
        charPrice = safeConfig.preciosExtras?.personaje || 40;
        detalles.extras.precioPersonajeApplied = charPrice;
      }
      total += charPrice;
    }

    if (detalles.extras.pinata) {
      let pinataPrice = detalles.extras.precioPinataApplied;
      if (pinataPrice === undefined || pinataPrice === null) {
        pinataPrice = safeConfig.preciosExtras?.pinata || 15;
        detalles.extras.precioPinataApplied = pinataPrice;
      }
      total += pinataPrice;
    }

    if (detalles.extras.costoExtra) {
      total += detalles.extras.costoExtra;
    }
  }

  // 4. Extension
  if (horario?.extensionMinutos) {
    let extCost = horario.costoExtension;
    if (horario.extensionMinutos > 0 && !extCost) {
      if (horario.extensionMinutos === 30) extCost = safeConfig.preciosExtras?.extension30 || 30;
      if (horario.extensionMinutos === 60) extCost = safeConfig.preciosExtras?.extension60 || 50;
      horario.costoExtension = extCost;
    }
    total += extCost || 0;
  }

  return total;
}

async function main() {
  console.log(`${DRY_RUN ? '🧪 DRY RUN — ' : ''}🔍 Conectando a MongoDB...`);
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Conectado.\n');

  const events = await Event.find({ publicId: { $in: AFFECTED_IDS } });
  console.log(`📅 Reservas encontradas: ${events.length} de ${AFFECTED_IDS.length}\n`);

  // Buscar las que no se encontraron
  const found = new Set(events.map((e) => e.publicId));
  for (const id of AFFECTED_IDS) {
    if (!found.has(id)) console.log(`⚠️  ${id} no encontrada en la DB.`);
  }

  let fixed = 0;
  let skipped = 0;

  for (const event of events) {
    const oldTotal = event.precioTotal;
    const oldTallerPrice = event.detalles?.extras?.precioTallerApplied;
    const fecha = new Date(event.fecha).toISOString().split('T')[0];

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔄 ${event.publicId} | ${fecha} | ${event.turno} | ${event.cliente?.nombreNiño}`);

    const eventData = event.toObject();

    // Forzar recálculo SOLO del taller: limpiar precioTallerApplied para que
    // calculatePrice lo recalcule desde config con el taller y cantidad actuales.
    // El resto de snapshots (menú, adultos, personaje, piñata) no tenían
    // discrepancias según el análisis previo, así que los preservamos.
    if (eventData.detalles?.extras) {
      eventData.detalles.extras.precioTallerApplied = undefined;
    }

    const newTotal = await calculatePrice(eventData);
    const newTallerPrice = eventData.detalles?.extras?.precioTallerApplied;

    const diff = newTotal - oldTotal;
    console.log(`   precioTotal:      ${oldTotal?.toFixed(2)}€ → ${newTotal.toFixed(2)}€ (${diff >= 0 ? '+' : ''}${diff.toFixed(2)}€)`);
    if (oldTallerPrice != null || newTallerPrice != null) {
      console.log(`   precioTaller:     ${oldTallerPrice ?? '—'}€ → ${newTallerPrice ?? '—'}€`);
    }

    if (oldTotal === newTotal) {
      console.log(`   ⏭️  Sin cambios.`);
      skipped++;
      continue;
    }

    if (!DRY_RUN) {
      event.detalles = eventData.detalles;
      event.precioTotal = newTotal;
      await event.save();
      console.log(`   ✅ Guardado.`);
    } else {
      console.log(`   🧪 Dry run — no se guardó.`);
    }
    fixed++;
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 RESULTADO ${DRY_RUN ? '(dry run)' : ''}:`);
  console.log(`   Corregidas: ${fixed}`);
  console.log(`   Sin cambios: ${skipped}`);
  console.log(`   Total procesadas: ${events.length}`);

  await mongoose.disconnect();
  console.log('\n👋 Desconectado.');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
