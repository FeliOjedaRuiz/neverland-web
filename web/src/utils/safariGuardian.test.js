/**
 * 🛡️ Safari Guardian Test
 *
 * Este test escanea AUTOMÁTICAMENTE el código fuente de los componentes de booking
 * para detectar usos peligrosos de `new Date()` que rompen en Safari/iOS.
 *
 * CONTEXTO: Safari no soporta correctamente new Date("YYYY-MM-DD").
 * Siempre se debe usar safeParseDate() de utils/safeDate.js.
 *
 * INCIDENTE (Feb 2026): Un `new Date(formData.fecha)` en Step8Summary.jsx
 * causó pantalla en blanco en la confirmación de reserva para clientes iPhone.
 *
 * Si este test FALLA, significa que alguien introdujo un new Date() inseguro
 * en un componente de booking. La solución es reemplazarlo con safeParseDate().
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

// Directorio de componentes de booking
const BOOKING_DIR = path.resolve(_dirname, '../components/booking');
const PAGES_DIR = path.resolve(_dirname, '../pages');
const UTILS_DIR = path.resolve(_dirname, '../utils');

/**
 * Lee recursivamente todos los archivos .jsx y .js de un directorio
 * (excluyendo archivos .test.)
 */
const getSourceFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /\.(jsx?|tsx?)$/.test(f) && !f.includes('.test.'))
    .map(f => ({
      name: f,
      path: path.join(dir, f),
      content: fs.readFileSync(path.join(dir, f), 'utf-8'),
    }));
};

/**
 * Busca ocurrencias peligrosas de new Date() que reciben strings de fecha.
 * Patrones peligrosos:
 *   - new Date(formData.fecha)
 *   - new Date(someVariable)
 *   - new Date("2026-02-27")
 *
 * Patrones SEGUROS (no reportados):
 *   - new Date() sin argumentos (fecha actual)
 *   - new Date(date) dentro de safeDate.js (es la propia utilidad)
 *   - Comentarios
 */
const findUnsafeDateUsage = (content, fileName) => {
  const lines = content.split('\n');
  const violations = [];

  // Si el archivo usa .replace(/-/g, '/') es una normalización manual aceptable
  const usesManualReplace = content.includes('.replace(/-/g');

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Ignorar comentarios
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;

    // Buscar `new Date(` con argumento
    const matches = [...line.matchAll(/new\s+Date\(([^)]*)\)/g)];
    for (const match of matches) {
      const arg = match[1].trim();

      // new Date() sin argumentos es seguro
      if (!arg || arg === '') continue;

      // new Date(date) ya usado con .replace() manual es aceptable
      if (usesManualReplace && line.includes('.replace(/-/g')) continue;

      // Si el argumento contiene comas, son args numéricos: new Date(year, month, day) — SEGURO
      if (arg.includes(',')) continue;

      // Si el argumento es puramente numérico (timestamp), es seguro
      if (/^\d+$/.test(arg)) continue;

      // Si el argumento es una variable que se sabe que es un Date object (no string), es seguro.
      // Heurística: variables comunes que son objetos Date
      const safeVarPatterns = [
        /^currentMonth$/,   // Es un state que almacena un objeto Date
        /^date$/,           // Variable local que es un Date creado con new Date(year,month,day)
        /^today$/,          // Variable local creada con new Date()
        /^nextDate$/,       // Variable local de Date  
        /^monthDate$/,      // Variable local de Date
        /^headerDate$/,     // Variable local de Date
        /^newM$/,           // Variable local: new Date(date) clonación
      ];
      if (safeVarPatterns.some(p => p.test(arg))) continue;

      // Skip in safeDate.js (es la propia utilidad)
      if (fileName === 'safeDate.js') continue;

      violations.push({
        line: idx + 1,
        code: trimmed,
        argument: arg,
      });
    }
  });

  return violations;
};

describe('🛡️ Safari Guardian - Detección de new Date() inseguro', () => {

  it('NO debe haber new Date() con strings en componentes de booking', () => {
    const files = getSourceFiles(BOOKING_DIR);
    const allViolations = [];

    files.forEach(({ name, content }) => {
      const violations = findUnsafeDateUsage(content, name);
      if (violations.length > 0) {
        allViolations.push({ file: name, violations });
      }
    });

    if (allViolations.length > 0) {
      const report = allViolations.map(({ file, violations }) =>
        `\n  📄 ${file}:\n` +
        violations.map(v =>
          `    ❌ Línea ${v.line}: ${v.code}\n` +
          `       Argumento: ${v.argument}\n` +
          `       Fix: Usar safeParseDate(${v.argument}) en vez de new Date(${v.argument})`
        ).join('\n')
      ).join('\n');

      expect.fail(
        `\n🚨 SAFARI GUARDIAN: Se encontraron ${allViolations.reduce((a, v) => a + v.violations.length, 0)} usos inseguros de new Date() en componentes de booking.\n` +
        `Estos usos causan pantalla en blanco en Safari/iOS.\n${report}\n\n` +
        `💡 Solución: Importar { safeParseDate } de '../../utils/safeDate' y usar en vez de new Date().`
      );
    }
  });

  it('NO debe haber new Date() con strings en BookingPage.jsx', () => {
    const files = getSourceFiles(PAGES_DIR)
      .filter(f => f.name.includes('Booking'));
    const allViolations = [];

    files.forEach(({ name, content }) => {
      const violations = findUnsafeDateUsage(content, name);
      if (violations.length > 0) {
        allViolations.push({ file: name, violations });
      }
    });

    if (allViolations.length > 0) {
      const report = allViolations.map(({ file, violations }) =>
        violations.map(v => `  ❌ ${file}:${v.line} — ${v.code}`).join('\n')
      ).join('\n');

      expect.fail(
        `\n🚨 SAFARI GUARDIAN: Usos inseguros de new Date() en páginas de booking:\n${report}`
      );
    }
  });

  it('bookingUtils.js debe usar la normalización de guiones a barras', () => {
    const utilFile = getSourceFiles(UTILS_DIR)
      .find(f => f.name === 'bookingUtils.js');

    if (utilFile) {
      // Verificar que bookingUtils usa .replace(/-/g, '/') o safeParseDate
      const hasSafeApproach =
        utilFile.content.includes('.replace(/-/g') ||
        utilFile.content.includes('safeParseDate');

      expect(hasSafeApproach).toBe(true);
    }
  });

  it('BookingSuccess NO debe importar framer-motion', () => {
    const file = getSourceFiles(BOOKING_DIR)
      .find(f => f.name === 'BookingSuccess.jsx');

    if (file) {
      const importsFramerMotion = file.content.includes("from 'framer-motion'");
      expect(importsFramerMotion,
        '🚨 BookingSuccess NO debe usar framer-motion. ' +
        'Usar CSS @keyframes para animaciones en pantallas críticas de confirmación. ' +
        'Motivo: framer-motion puede fallar silenciosamente en Safari iOS.'
      ).toBe(false);
    }
  });

  it('BookingSuccess debe estar FUERA de AnimatePresence en BookingPage', () => {
    const bookingPage = getSourceFiles(PAGES_DIR)
      .find(f => f.name === 'BookingPage.jsx');

    if (bookingPage) {
      const content = bookingPage.content;

      // Verificar que step === 9 NO está dentro de AnimatePresence
      // Buscar el patrón seguro: step === 9 como condición ternaria ANTES de AnimatePresence
      const hasSafePattern =
        content.includes('step === 9 ?') ||
        content.includes('step === 9?');

      // Verificar que NO existe el patrón peligroso: step === 9 && dentro del bloque AnimatePresence
      const lines = content.split('\n');
      let animatePresenceDepth = 0;
      let hasDangerousPattern = false;

      for (const line of lines) {
        // Contar aperturas y cierres de AnimatePresence
        if (line.includes('<AnimatePresence')) animatePresenceDepth++;
        if (line.includes('</AnimatePresence>')) animatePresenceDepth--;

        // Buscar step === 9 SOLO con && (patrón peligroso), no con ? (patrón seguro)
        if (animatePresenceDepth > 0 && /step\s*===\s*9\s*&&/.test(line)) {
          hasDangerousPattern = true;
          break;
        }
      }

      expect(hasSafePattern,
        '🚨 BookingSuccess (step 9) debe renderizarse FUERA de AnimatePresence. ' +
        'Usar un ternario: step === 9 ? <BookingSuccess/> : <AnimatePresence>...</AnimatePresence>'
      ).toBe(true);

      expect(hasDangerousPattern,
        '🚨 Se detectó step === 9 DENTRO de AnimatePresence. ' +
        'Esto causa pantalla en blanco en Safari cuando la animación de salida falla.'
      ).toBe(false);
    }
  });
});
