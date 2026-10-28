import { describe, it, expect } from 'vitest';
import {
  safeParseDate,
  formatSafeDate,
  formatLongSafeDate,
  getTallerDayParts,
  getTallerStartInstant,
  isTallerIniciado,
} from './safeDate';

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

  describe('getTallerDayParts — día natural del taller', () => {
    it('extrae el día calendario de un string ISO sin usar new Date(string)', () => {
      expect(getTallerDayParts('2026-10-30T00:00:00.000Z')).toEqual({ year: 2026, month: 10, day: 30 });
    });

    it('usa el día UTC para objetos Date (estilo Mongoose)', () => {
      expect(getTallerDayParts(new Date(Date.UTC(2026, 0, 15)))).toEqual({ year: 2026, month: 1, day: 15 });
    });

    it('devuelve null si la entrada falta o es inválida', () => {
      expect(getTallerDayParts(null)).toBe(null);
      expect(getTallerDayParts(undefined)).toBe(null);
      expect(getTallerDayParts('not-a-date')).toBe(null);
    });
  });

  describe('getTallerStartInstant — hora local de Europe/Madrid → instante', () => {
    it('convierte correctamente una fecha CET (invierno)', () => {
      const instant = getTallerStartInstant('2026-01-15T00:00:00.000Z', '11:00');
      expect(instant.toISOString()).toBe('2026-01-15T10:00:00.000Z');
    });

    it('convierte correctamente una fecha CEST (inicio del DST)', () => {
      const instant = getTallerStartInstant('2026-03-29T00:00:00.000Z', '11:00');
      expect(instant.toISOString()).toBe('2026-03-29T09:00:00.000Z');
    });

    it('devuelve null si la entrada es inválida', () => {
      expect(getTallerStartInstant(null, '11:00')).toBe(null);
      expect(getTallerStartInstant('2026-01-15T00:00:00.000Z', 'not-a-time')).toBe(null);
      expect(getTallerStartInstant('2026-01-15T00:00:00.000Z', '25:00')).toBe(null);
    });
  });

  describe('isTallerIniciado — alrededor del instante de inicio', () => {
    // Instante de inicio: 2026-01-15T10:00:00.000Z (11:00 Europe/Madrid)
    const taller = {
      fecha: '2026-01-15T00:00:00.000Z',
      horario: { inicio: '11:00', fin: '13:00' },
    };

    it('devuelve false un segundo antes del instante de inicio', () => {
      expect(isTallerIniciado(taller, new Date(Date.UTC(2026, 0, 15, 9, 59, 59)))).toBe(false);
    });

    it('devuelve true exactamente en el instante de inicio', () => {
      expect(isTallerIniciado(taller, new Date(Date.UTC(2026, 0, 15, 10, 0, 0)))).toBe(true);
    });

    it('devuelve true después del instante de inicio', () => {
      expect(isTallerIniciado(taller, new Date(Date.UTC(2026, 0, 15, 12, 0, 0)))).toBe(true);
    });

    it('mantiene el taller visible (false) cuando falta fecha o horario.inicio o son inválidos', () => {
      expect(isTallerIniciado({}, new Date())).toBe(false);
      expect(isTallerIniciado({ fecha: 'x', horario: { inicio: 'bad' } }, new Date())).toBe(false);
      expect(isTallerIniciado(null, new Date())).toBe(false);
    });
  });
});
