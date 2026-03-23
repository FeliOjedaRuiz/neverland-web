/**
 * 🛡️ Import Guardian Test
 * 
 * Este test escanea el código fuente para asegurar que todas las librerías
 * críticas usadas están correctamente importadas.
 * 
 * CASO DE USO: Prevenir ReferenceError: motion is not defined si se olvida
 * importar motion de framer-motion.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

const SRC_DIR = path.resolve(_dirname, '..');

const getFilesRecursively = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git')) {
        results = results.concat(getFilesRecursively(file));
      }
    } else if (/\.(jsx?)$/.test(file) && !file.includes('.test.')) {
      results.push({
        name: path.basename(file),
        path: file,
        content: fs.readFileSync(file, 'utf-8'),
      });
    }
  });
  return results;
};

describe('🛡️ Import Guardian - Validación de dependencias en runtime', () => {

  it('Cada archivo que use "motion." debe importar { motion } de "framer-motion"', () => {
    const files = getFilesRecursively(SRC_DIR);
    const violations = [];

    files.forEach(file => {
      const hasMotionUsage = /motion\./.test(file.content);
      const hasMotionImport = /import\s+.*motion.*from\s+['"]framer-motion['"]/.test(file.content);

      if (hasMotionUsage && !hasMotionImport) {
        violations.push(file.path);
      }
    });

    if (violations.length > 0) {
      expect.fail(
        `🚨 IMPORT GUARDIAN: Se detectaron archivos que usan 'motion.' sin importarlo:\n` +
        violations.map(v => `   ❌ ${v}`).join('\n') +
        `\n💡 Solución: Añade 'import { motion } from "framer-motion";' al inicio del archivo.`
      );
    }
  });

  it('Cada archivo que use iconos de lucide-react debe importarlos correctamente', () => {
    const files = getFilesRecursively(SRC_DIR);
    const violations = [];

    files.forEach(file => {
      // Buscar patrones como <IconName ... /> (mayúscula inicial, seguido de props)
      // Este es más complejo por falsos positivos, pero buscaremos los más comunes
      const lucideUsageMatches = [...file.content.matchAll(/<([A-Z][a-zA-Z0-9]+)\s/g)];
      const uniqueIconsUsed = [...new Set(lucideUsageMatches.map(m => m[1]))];
      
      // Filtrar por nombres que parecen iconos (heurística simple)
      const likelyIcons = uniqueIconsUsed.filter(name => 
        ['Search', 'Settings', 'LogOut', 'Inbox', 'Calendar', 'Menu', 'X', 'Lock', 'Mail'].includes(name)
      );

      if (likelyIcons.length > 0) {
        const hasLucideImport = /from\s+['"]lucide-react['"]/.test(file.content);
        if (!hasLucideImport) {
          violations.push(file.path);
        }
      }
    });

    if (violations.length > 0) {
      expect.fail(
        `🚨 IMPORT GUARDIAN: Archivos que parecen usar iconos de lucide sin importarlos:\n` +
        violations.map(v => `   ❌ ${v}`).join('\n')
      );
    }
  });
});
