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

    it('debería calcular el taller plus para exactamente 15 niños (umbral >= 15)', () => {
      const formData = {
        fecha: '2026-05-13',
        niños: { cantidad: 15, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { taller: 'Cocina' }
      };

      // (15 * 10) + 25 (plus taller, porque cantidad >= 15) = 175€
      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(175);
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

    it('paso 2: debería validar cantidad de niños y menú seleccionado', () => {
      // Válido
      expect(validateBookingStep(2, { niños: { cantidad: 12, menuId: 'm1' } })).toBe(true);

      // Cantidad insuficiente
      expect(validateBookingStep(2, { niños: { cantidad: 11, menuId: 'm1' } })).toBe(false);

      // Sin menú seleccionado
      expect(validateBookingStep(2, { niños: { cantidad: 12, menuId: null } })).toBe(false);
      expect(validateBookingStep(2, { niños: { cantidad: 12 } })).toBe(false);
    });

    it('paso 3: debería validar que haya mínimo 1 adulto', () => {
      expect(validateBookingStep(3, { adultos: { cantidad: 1 } })).toBe(true);
      expect(validateBookingStep(3, { adultos: { cantidad: 0 } })).toBe(false);
      expect(validateBookingStep(3, { adultos: { cantidad: 40 } })).toBe(true);
      expect(validateBookingStep(3, { adultos: { cantidad: 41 } })).toBe(false);
    });

    it('pasos 4, 5, 6 y 7: deberên ser siempre válidos (opcionales o lectura)', () => {
      expect(validateBookingStep(4, {})).toBe(true);
      expect(validateBookingStep(5, {})).toBe(true);
      expect(validateBookingStep(6, {})).toBe(true);
      expect(validateBookingStep(7, {})).toBe(true);
    });

    it('paso 8: debería validar datos del cliente y formato de email', () => {
      const validClient = {
        nombreNiño: 'Leo',
        edadNiño: '5',
        nombrePadre: 'Juan',
        telefono: '123456789',
        email: 'test@neverland.com'
      };

      expect(validateBookingStep(8, { cliente: validClient })).toBe(true);

      // Email inválido
      expect(validateBookingStep(8, { cliente: { ...validClient, email: 'invalido' } })).toBe(false);

      // Teléfono corto
      expect(validateBookingStep(8, { cliente: { ...validClient, telefono: '123' } })).toBe(false);

      // Teléfono español correcto (9 dígitos)
      expect(validateBookingStep(8, { cliente: { ...validClient, telefono: '+34 600000000' } })).toBe(true);

      // Teléfono español incorrecto (demasiado largo)
      expect(validateBookingStep(8, { cliente: { ...validClient, telefono: '+34 6000000001' } })).toBe(false);

      // Teléfono internacional largo (15 dígitos locales)
      expect(validateBookingStep(8, { cliente: { ...validClient, telefono: '+1 123456789012345' } })).toBe(true);
    });
  });
});
