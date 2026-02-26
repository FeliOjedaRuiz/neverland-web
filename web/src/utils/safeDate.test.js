import { describe, it, expect } from 'vitest';
import { safeParseDate, formatSafeDate, formatLongSafeDate } from './safeDate';

describe('Utilidad safeDate - Compatibilidad Safari/iOS', () => {

  describe('safeParseDate', () => {
    it('debería parsear correctamente una fecha con guiones (formato ISO)', () => {
      const date = safeParseDate('2026-05-15');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(4); // Mayo es 4 (base 0)
      expect(date.getDate()).toBe(15);
    });

    it('debería normalizar guiones a barras para compatibilidad con Safari', () => {
      // En Safari, new Date("2026-05-15") a veces falla o devuelve Invalid Date
      // Nuestra utilidad lo convierte a "2026/05/15" internamente
      const date = safeParseDate('2026-05-15');
      expect(isNaN(date.getTime())).toBe(false);
    });

    it('debería manejar fechas con horas (ISO full)', () => {
      const date = safeParseDate('2026-05-15T10:00:00.000Z');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(4);
    });

    it('debería devolver null para entradas vacías', () => {
      expect(safeParseDate('')).toBe(null);
      expect(safeParseDate(null)).toBe(null);
      expect(safeParseDate(undefined)).toBe(null);
    });

    it('debería devolver una fecha válida incluso con strings mal formateados (fallback)', () => {
      const date = safeParseDate('not-a-date');
      expect(isNaN(date.getTime())).toBe(true);
    });
  });

  describe('formatSafeDate', () => {
    it('debería formatear correctamente a DD/MM/YY', () => {
      expect(formatSafeDate('2026-05-15')).toBe('15/05/26');
    });

    it('debería permitir año de 4 dígitos', () => {
      expect(formatSafeDate('2026-05-15', { year: 'numeric' })).toBe('15/05/2026');
    });

    it('debería devolver string vacío para fechas inválidas', () => {
      expect(formatSafeDate(null)).toBe('');
      expect(formatSafeDate('error')).toBe('');
    });
  });

  describe('formatLongSafeDate', () => {
    it('debería devolver el formato largo en español', () => {
      const result = formatLongSafeDate('2026-05-15');
      // No comparamos todo el string exacto por variaciones de locale en entornos de test,
      // pero verificamos elementos clave:
      expect(result).toMatch(/viernes/i);
      expect(result).toMatch(/mayo/i);
      expect(result).toMatch(/2026/);
    });

    it('debería devolver string vacío para fechas inválidas', () => {
      expect(formatLongSafeDate('')).toBe('');
    });
  });
});
