/**
 * Script de análisis — NO modifica datos.
 * Detecta reservas futuras con snapshots de precio inconsistentes
 * (síntoma del bug de recálculo en PATCH).
 *
 * Uso: node scripts/analyze-stale-snapshots.js
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

// Replica mínima de calculateEventPrice para detectar discrepancias
function detectStaleSnapshot(event, config) {
  const issues = [];
  const safeConfig = config || {};
  const { detalles, fecha } = event;

  // --- Niños: precioApplied vs config ---
  if (detalles?.niños?.menuId && detalles.niños.precioApplied != null) {
    const menu = (safeConfig.menusNiños || []).find(
      (m) => String(m.id || m._id) === String(detalles.niños.menuId)
    );
    if (menu) {
      const expected = menu.precio || menu.price || 0;
      if (detalles.niños.precioApplied !== expected) {
        issues.push({
          field: 'detalles.niños.precioApplied',
          current: detalles.niños.precioApplied,
          expected,
          menu: menu.nombre || menu.name,
        });
      }
    }
  }

  // --- Taller: precioTallerApplied vs config ---
  if (detalles?.extras?.taller && detalles.extras.taller !== 'ninguno' && detalles.extras.precioTallerApplied != null) {
    const ws = (safeConfig.workshops || []).find(
      (w) => (w.name || '').toLowerCase() === detalles.extras.taller.toLowerCase()
    );
    if (ws) {
      const isLarge = (detalles.niños?.cantidad || 0) > 15;
      const expected = isLarge ? (ws.pricePlus || 0) : (ws.priceBase || 0);
      if (detalles.extras.precioTallerApplied !== expected) {
        issues.push({
          field: 'detalles.extras.precioTallerApplied',
          current: detalles.extras.precioTallerApplied,
          expected,
          taller: detalles.extras.taller,
          grupo: isLarge ? 'plus (>15)' : 'base (≤15)',
        });
      }
    }
  }

  // --- Personaje: precioPersonajeApplied vs config ---
  if (detalles?.extras?.personaje && detalles.extras.personaje !== 'ninguno' && detalles.extras.precioPersonajeApplied != null) {
    const expected = safeConfig.preciosExtras?.personaje || 40;
    if (detalles.extras.precioPersonajeApplied !== expected) {
      issues.push({
        field: 'detalles.extras.precioPersonajeApplied',
        current: detalles.extras.precioPersonajeApplied,
        expected,
      });
    }
  }

  // --- Piñata: precioPinataApplied vs catalog (since legacy preciosExtras.pinata is gone) ---
  if (detalles?.extras?.pinata && detalles.extras.precioPinataApplied != null) {
    const pinataCatalogItem = (safeConfig.extrasCatalogo || []).find(i => i.slug === 'pinata');
    const expected = pinataCatalogItem ? pinataCatalogItem.precio : 15;
    if (detalles.extras.precioPinataApplied !== expected) {
      issues.push({
        field: 'detalles.extras.precioPinataApplied',
        current: detalles.extras.precioPinataApplied,
        expected,
      });
    }
  }

  // --- Catálogo de extras ---
  const catalogoItemIds = detalles?.extras?.catalogoItemIds;
  if (Array.isArray(catalogoItemIds) && catalogoItemIds.length > 0) {
    const catalogItems = safeConfig.extrasCatalogo || [];
    const catalogMap = new Map(catalogItems.map((i) => [i.slug, i]));
    let expectedCatalogTotal = 0;

    for (const itemId of catalogoItemIds) {
      const item = catalogMap.get(itemId);
      if (item && item.active) {
        expectedCatalogTotal += item.precio || 0;
      }
    }

    const currentCatalogTotal = detalles.extras.precioCatalogoApplied || 0;
    if (currentCatalogTotal !== expectedCatalogTotal) {
      issues.push({
        field: 'detalles.extras.precioCatalogoApplied',
        current: currentCatalogTotal,
        expected: expectedCatalogTotal,
      });
    }

    if (catalogoItemIds.includes('pinata') && !detalles.extras?.pinata) {
      issues.push({
        field: 'detalles.extras.pinata',
        current: false,
        expected: true,
        reason: 'pinata está en catalogoItemIds pero el flag pinata es false',
      });
    }
  }

  // --- Plus Fin de Semana ---
  if (detalles?.niños?.cantidad && fecha) {
    const dateObj = safeParseDate(fecha);
    const day = dateObj.getDay();
    if (day === 0 || day === 5 || day === 6) {
      const plus = safeConfig.plusFinDeSemana || 1.5;
      const expectedPlus = plus * detalles.niños.cantidad;
      // El plus no tiene snapshot dedicado; se recalcula siempre en calculateEventPrice.
      // Pero si precioTotal no refleja el plus, es señal de que no se recalculó.
    }
  }

  return issues;
}

async function main() {
  console.log('🔍 Conectando a MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Conectado.\n');

  // 1. Cargar config
  const config = await Config.findOne().lean();
  if (!config) {
    console.error('❌ No se encontró configuración (Config).');
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`📋 Config cargada: ${config.menusNiños?.length || 0} menús, ${config.workshops?.length || 0} talleres.\n`);

  // 2. Reservas futuras (desde hoy, inclusive)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await Event.find({
    fecha: { $gte: today },
    tipo: 'reserva',
    estado: { $ne: 'cancelada' },
  })
    .sort({ fecha: 1 })
    .lean();

  console.log(`📅 Reservas futuras (desde ${today.toISOString().split('T')[0]}): ${events.length}\n`);

  // 3. Analizar cada una
  let affectedCount = 0;
  let totalIssues = 0;

  for (const event of events) {
    const issues = detectStaleSnapshot(event, config);
    if (issues.length > 0) {
      affectedCount++;
      totalIssues += issues.length;
      const fecha = new Date(event.fecha).toISOString().split('T')[0];
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`⚠️  ${event.publicId} | ${fecha} | ${event.turno} | ${event.cliente?.nombreNiño || '?'} | Estado: ${event.estado}`);
      console.log(`   precioTotal actual: ${event.precioTotal?.toFixed(2) || '?'}€`);
      for (const issue of issues) {
        console.log(`   ❌ ${issue.field}: guardado=${issue.current}, esperado=${issue.expected}${issue.menu ? ` (${issue.menu})` : ''}${issue.taller ? ` (${issue.taller}, ${issue.grupo})` : ''}`);
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 RESUMEN:`);
  console.log(`   Total reservas futuras: ${events.length}`);
  console.log(`   Afectadas (snapshots inconsistentes): ${affectedCount}`);
  console.log(`   Issues detectadas: ${totalIssues}`);
  console.log(`   Reservas OK: ${events.length - affectedCount}`);

  if (affectedCount === 0) {
    console.log(`\n✨ Ninguna reserva futura tiene snapshots inconsistentes.`);
  }

  await mongoose.disconnect();
  console.log('\n👋 Desconectado.');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
