import { describe, it, expect } from 'vitest';
import { calculateBookingTotal, validateBookingStep } from './bookingUtils';

describe('BookingUtils - Lógica de Negocio Frontend', () => {

  const mockPrices = {
    plusFinDeSemana: 1.5,
    preciosExtras: {
      tallerBase: 25,
      tallerPlus: 30,
      personaje: 40,
      pinata: 15,
      extension30: 30,
      extension60: 50
    },
    workshops: [
      { name: 'Cocina', priceBase: 20, pricePlus: 25 }
    ]
  };

  const mockMenus = [
    { id: 'm1', price: 10 }
  ];

  describe('calculateBookingTotal', () => {
    it('debería calcular el precio base correctamente para niños en día de semana', () => {
      const formData = {
        fecha: '2026-05-13', // Miércoles
        niños: { cantidad: 10, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { taller: 'ninguno' }
      };

      // 10 niños * 10€ = 100€
      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(100);
    });

    it('debería aplicar el plus de fin de semana (Viernes)', () => {
      const formData = {
        fecha: '2026-05-15', // Viernes
        niños: { cantidad: 10, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { taller: 'ninguno' }
      };

      // (10 * 10) + (10 * 1.5) = 115€
      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(115);
    });

    it('debería calcular el taller base para exactamente 15 niños', () => {
      const formData = {
        fecha: '2026-05-13',
        niños: { cantidad: 15, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { taller: 'Cocina' }
      };

      // (15 * 10) + 20 (base taller) = 170€
      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(170);
    });

    it('debería calcular el taller plus para más de 15 niños', () => {
      const formData = {
        fecha: '2026-05-13',
        niños: { cantidad: 16, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { taller: 'Cocina' }
      };

      // (16 * 10) + 25 (plus taller) = 185€
      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(185);
    });

    it('debería sumar correctamente la comida de adultos', () => {
      const formData = {
        fecha: '2026-05-13',
        niños: { cantidad: 0, menuId: 'm1' },
        adultos: {
          comida: [
            { precioUnitario: 5, cantidad: 2 }, // 10
            { precioUnitario: 10, cantidad: 1 } // 10
          ]
        },
        extras: { taller: 'ninguno' }
      };

      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(20);
    });
  });

  describe('validateBookingStep', () => {
    it('paso 1: debería validar fecha y turno', () => {
      expect(validateBookingStep(1, { fecha: '2026-05-15', turno: 'T1' })).toBe(true);
      expect(validateBookingStep(1, { fecha: '', turno: 'T1' })).toBe(false);
    });

    it('paso 2: debería validar datos del cliente y formato de email', () => {
      const validClient = {
        nombreNiño: 'Leo',
        edadNiño: '5',
        nombrePadre: 'Juan',
        telefono: '123456789',
        email: 'test@neverland.com'
      };

      expect(validateBookingStep(2, { cliente: validClient })).toBe(true);

      // Email inválido
      expect(validateBookingStep(2, { cliente: { ...validClient, email: 'invalido' } })).toBe(false);

      // Teléfono corto
      expect(validateBookingStep(2, { cliente: { ...validClient, telefono: '123' } })).toBe(false);
    });
  });
});
