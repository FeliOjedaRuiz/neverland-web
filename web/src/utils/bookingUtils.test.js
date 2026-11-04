import { describe, it, expect } from 'vitest';
import {
  calculateBookingTotal,
  validateBookingStep,
  filterActiveCatalog,
  getCatalogItemById,
  sumCatalogPrices,
  esGrupoGrande,
  obtenerPrecioTaller,
  sumarPrecioTalleres,
  obtenerTalleres,
} from './bookingUtils';

describe('BookingUtils - Lógica de Negocio Frontend', () => {

  const mockPrices = {
    plusFinDeSemana: 1.5,
    preciosExtras: {
      tallerBase: 25,
      tallerPlus: 30,
      personaje: 40,
      precioPack3Personajes: 100,
      pinata: 15,
      extension30: 30,
      extension60: 50
    },
    workshops: [
      { name: 'Cocina', priceBase: 20, pricePlus: 25 },
      { name: 'Magia', priceBase: 30, pricePlus: 0 },
      { name: 'Pintura', priceBase: 22 },
      { name: 'Slime', priceBase: 20, pricePlus: 30 },
      { name: 'Tattoos', priceBase: 30, pricePlus: 35 }
    ]
  };

  const mockMenus = [
    { id: 'm1', price: 10 }
  ];

  describe('esGrupoGrande', () => {
    it('debería devolver false para 15 niños exactos', () => {
      expect(esGrupoGrande(15)).toBe(false);
    });

    it('debería devolver true para 16 niños', () => {
      expect(esGrupoGrande(16)).toBe(true);
    });

    it('debería devolver false para cantidades ausentes o cero', () => {
      expect(esGrupoGrande(0)).toBe(false);
      expect(esGrupoGrande(null)).toBe(false);
      expect(esGrupoGrande(undefined)).toBe(false);
    });
  });

  describe('obtenerPrecioTaller', () => {
    it('debería devolver priceBase para grupo normal', () => {
      expect(obtenerPrecioTaller({ priceBase: 20, pricePlus: 25 }, 10)).toBe(20);
    });

    it('debería devolver pricePlus para grupo grande', () => {
      expect(obtenerPrecioTaller({ priceBase: 20, pricePlus: 25 }, 16)).toBe(25);
    });

    it('debería hacer fallback a priceBase cuando pricePlus es 0', () => {
      expect(obtenerPrecioTaller({ priceBase: 30, pricePlus: 0 }, 16)).toBe(30);
    });

    it('debería hacer fallback a priceBase cuando pricePlus no está definido', () => {
      expect(obtenerPrecioTaller({ priceBase: 22 }, 18)).toBe(22);
    });

    it('debería devolver 0 si el taller no es válido', () => {
      expect(obtenerPrecioTaller(null, 10)).toBe(0);
      expect(obtenerPrecioTaller(undefined, 10)).toBe(0);
      expect(obtenerPrecioTaller('string', 10)).toBe(0);
    });
  });

  describe('sumarPrecioTalleres', () => {
    const workshops = [
      { name: 'Cocina', priceBase: 20, pricePlus: 25 },
      { name: 'Slime', priceBase: 20, pricePlus: 30 },
      { name: 'Tattoos', priceBase: 30, pricePlus: 35 },
    ];
    const preciosExtras = { tallerBase: 25, tallerPlus: 30 };

    it('debería devolver 0 para un array vacío', () => {
      expect(sumarPrecioTalleres([], workshops, 10, preciosExtras)).toBe(0);
      expect(sumarPrecioTalleres(null, workshops, 10, preciosExtras)).toBe(0);
    });

    it('debería sumar priceBase para grupo normal', () => {
      expect(sumarPrecioTalleres(['Cocina', 'Slime'], workshops, 10, preciosExtras)).toBe(40);
    });

    it('debería sumar pricePlus para grupo grande', () => {
      expect(sumarPrecioTalleres(['Cocina', 'Slime'], workshops, 16, preciosExtras)).toBe(55);
    });

    it('debería ignorar nombres vacíos o nulos', () => {
      expect(sumarPrecioTalleres(['Cocina', '', null], workshops, 10, preciosExtras)).toBe(20);
    });

    it('debería aplicar fallback a preciosExtras si el nombre no está en el catálogo', () => {
      expect(sumarPrecioTalleres(['NoExiste'], workshops, 10, preciosExtras)).toBe(25);
      expect(sumarPrecioTalleres(['NoExiste'], workshops, 16, preciosExtras)).toBe(30);
    });

    it('debería aplicar fallback duro 25/30 si preciosExtras no está definido', () => {
      expect(sumarPrecioTalleres(['NoExiste'], workshops, 10, undefined)).toBe(25);
      expect(sumarPrecioTalleres(['NoExiste'], workshops, 16, undefined)).toBe(30);
    });

    it('D-01: debería resolver un nombre con espacio final en el catálogo (priceBase 30, no fallback 25)', () => {
      const catalogoConEspacioFinal = [
        { name: 'Fiesta aquatica básica ', priceBase: 30, pricePlus: 35 }
      ];
      expect(
        sumarPrecioTalleres(['Fiesta aquatica básica'], catalogoConEspacioFinal, 12, preciosExtras)
      ).toBe(30);
    });

    it('D-01: debería resolver el catálogo ignorando mayúsculas y espacios en ambos lados', () => {
      const catalogo = [{ name: 'Taller de chapas ', priceBase: 20, pricePlus: 30 }];
      expect(sumarPrecioTalleres(['  TALLER DE CHAPAS'], catalogo, 12, preciosExtras)).toBe(20);
    });
  });

  describe('obtenerTalleres', () => {
    it('debería devolver una copia defensiva del array talleres', () => {
      const talleres = ['Cocina', 'Magia'];
      const extras = { talleres };
      const result = obtenerTalleres(extras);
      expect(result).toEqual(talleres);
      expect(result).not.toBe(talleres);
      result.push('Slime');
      expect(extras.talleres).toHaveLength(2);
    });

    it('debería devolver array vacío explícito cuando talleres está vacío', () => {
      expect(obtenerTalleres({ talleres: [] })).toEqual([]);
    });

    it('debería leer extras.taller legacy cuando talleres no es array', () => {
      expect(obtenerTalleres({ taller: 'Cocina' })).toEqual(['Cocina']);
    });

    it('debería normalizar el sentinel legacy "ninguno" ignorando mayúsculas y espacios', () => {
      expect(obtenerTalleres({ taller: 'ninguno' })).toEqual([]);
      expect(obtenerTalleres({ taller: '  NINGUNO  ' })).toEqual([]);
      expect(obtenerTalleres({ taller: 'Ninguno' })).toEqual([]);
    });

    it('debería ignorar taller legacy vacío o no string', () => {
      expect(obtenerTalleres({ taller: '' })).toEqual([]);
      expect(obtenerTalleres({ taller: '   ' })).toEqual([]);
      expect(obtenerTalleres({ taller: null })).toEqual([]);
      expect(obtenerTalleres({ taller: 123 })).toEqual([]);
    });

    it('el array nuevo debería ganar al legacy aunque esté vacío', () => {
      expect(obtenerTalleres({ talleres: [], taller: 'Cocina' })).toEqual([]);
    });

    it('debería devolver [] cuando extras es undefined', () => {
      expect(obtenerTalleres(undefined)).toEqual([]);
      expect(obtenerTalleres(null)).toEqual([]);
    });
  });

  describe('calculateBookingTotal', () => {
    it('debería cobrar el precio del catálogo usando extras.taller legacy', () => {
      const formData = {
        fecha: '2026-05-13',
        niños: { cantidad: 10, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { taller: 'Cocina' }
      };

      // (10 * 10) + 20 (Cocina base) = 120€
      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(120);
    });

    it('debería cobrar 0 cuando talleres es [] explícito aunque exista taller legacy', () => {
      const formData = {
        fecha: '2026-05-13',
        niños: { cantidad: 10, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { talleres: [], taller: 'Cocina' }
      };

      // 10 * 10 = 100€ (array vacío explícito gana al legacy)
      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(100);
    });

    it('debería calcular el precio base correctamente para niños en día de semana', () => {
      const formData = {
        fecha: '2026-05-13', // Miércoles
        niños: { cantidad: 10, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { talleres: [] }
      };

      // 10 niños * 10€ = 100€
      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(100);
    });

    it('debería aplicar el plus de fin de semana (Viernes)', () => {
      const formData = {
        fecha: '2026-05-15', // Viernes
        niños: { cantidad: 10, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { talleres: [] }
      };

      // (10 * 10) + (10 * 1.5) = 115€
      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(115);
    });

    it('debería calcular el taller base para exactamente 15 niños (umbral > 15, corregido)', () => {
      // Corrección deliberada: el cliente veía plus a 15 niños, pero el servidor
      // cobraba base (umbral > 15). Ahora ambas capas usan esGrupoGrande = ninos > 15.
      const formData = {
        fecha: '2026-05-13',
        niños: { cantidad: 15, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { talleres: ['Cocina'] }
      };

      // (15 * 10) + 20 (base taller, porque 15 no es grupo grande) = 170€
      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(170);
    });


    it('debería calcular el taller plus para más de 15 niños', () => {
      const formData = {
        fecha: '2026-05-13',
        niños: { cantidad: 16, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { talleres: ['Cocina'] }
      };

      // (16 * 10) + 25 (plus taller, porque 16 > 15) = 185€
      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(185);
    });

    it('debería aplicar fallback a priceBase si pricePlus está configurado en 0 euros para >= 15 niños', () => {
      const pricesWithZeroPlus = {
        ...mockPrices,
        workshops: [
          { name: 'Magia', priceBase: 30, pricePlus: 0 }
        ]
      };
      const formData = {
        fecha: '2026-05-13',
        niños: { cantidad: 16, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { talleres: ['Magia'] }
      };

      // 16 * 10 = 160€ + 30€ (fallback a priceBase en vez de 0€) = 190€
      expect(calculateBookingTotal(formData, pricesWithZeroPlus, mockMenus)).toBe(190);
    });

    it('debería aplicar fallback a priceBase si pricePlus no está definido para >= 15 niños', () => {
      const pricesWithoutPlus = {
        ...mockPrices,
        workshops: [
          { name: 'Pintura', priceBase: 22 }
        ]
      };
      const formData = {
        fecha: '2026-05-13',
        niños: { cantidad: 18, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { talleres: ['Pintura'] }
      };

      // 18 * 10 = 180€ + 22€ (fallback a priceBase) = 202€
      expect(calculateBookingTotal(formData, pricesWithoutPlus, mockMenus)).toBe(202);
    });

    it('debería calcular 0€ sin actividades seleccionadas', () => {
      const formData = {
        fecha: '2026-05-13',
        niños: { cantidad: 10, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { talleres: [] }
      };

      // 10 niños * 10€ = 100€ (sin actividades)
      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(100);
    });

    it('debería sumar el precio de 2 actividades seleccionadas', () => {
      const formData = {
        fecha: '2026-05-13',
        niños: { cantidad: 10, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { talleres: ['Slime', 'Tattoos'] }
      };

      // (10 * 10) + 20 (Slime) + 30 (Tattoos) = 150€
      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(150);
    });

    it('debería sumar el precio de 3 actividades seleccionadas con grupo grande', () => {
      const formData = {
        fecha: '2026-05-13',
        niños: { cantidad: 18, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { talleres: ['Slime', 'Tattoos', 'Cocina'] }
      };

      // (18 * 10) + 30 (Slime plus) + 35 (Tattoos plus) + 25 (Cocina plus) = 270€
      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(270);
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
        extras: { talleres: [] }
      };

      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(20);
    });

    it('debería calcular 0€ cuando no hay personajes seleccionados', () => {
      const formData = {
        fecha: '2026-05-13',
        niños: { cantidad: 10, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { talleres: [], personajes: [] }
      };

      // 10 niños * 10€ = 100€ (sin personajes)
      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(100);
    });

    it('debería calcular 40€ para 1 personaje', () => {
      const formData = {
        fecha: '2026-05-13',
        niños: { cantidad: 10, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { talleres: [], personajes: ['Elsa'] }
      };

      // 100€ (menú) + 40€ (1 personaje) = 140€
      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(140);
    });

    it('debería calcular 80€ para 2 personajes', () => {
      const formData = {
        fecha: '2026-05-13',
        niños: { cantidad: 10, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { talleres: [], personajes: ['Elsa', 'Anna'] }
      };

      // 100€ (menú) + 80€ (2 personajes) = 180€
      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(180);
    });

    it('debería calcular 100€ (pack) para 3 personajes', () => {
      const formData = {
        fecha: '2026-05-13',
        niños: { cantidad: 10, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { talleres: [], personajes: ['Elsa', 'Anna', 'Mickey'] }
      };

      // 100€ (menú) + 100€ (pack 3 personajes) = 200€
      expect(calculateBookingTotal(formData, mockPrices, mockMenus)).toBe(200);
    });

    it('debería usar precioPack3Personajes del mockPrices', () => {
      const customPrices = {
        ...mockPrices,
        preciosExtras: {
          ...mockPrices.preciosExtras,
          precioPack3Personajes: 95
        }
      };
      const formData = {
        fecha: '2026-05-13',
        niños: { cantidad: 10, menuId: 'm1' },
        adultos: { comida: [] },
        extras: { talleres: [], personajes: ['A', 'B', 'C'] }
      };

      // 100€ (menú) + 95€ (pack custom) = 195€
      expect(calculateBookingTotal(formData, customPrices, mockMenus)).toBe(195);
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

  describe('Catálogo de extras', () => {
    const catalogItems = [
      { id: 'pinata', slug: 'pinata', nombre: 'Piñata Neverland', precio: 15, active: true },
      { id: 'snack', slug: 'snack-bar', nombre: 'Snack Bar', precio: 25, active: true },
      { id: 'decoracion', slug: 'decoracion-tematica', nombre: 'Decoración', precio: 35, active: true },
      { id: 'inactivo', slug: 'extra-inactivo', nombre: 'Extra Inactivo', precio: 10, active: false }
    ];

    it('filterActiveCatalog debería excluir solo items inactivos', () => {
      const active = filterActiveCatalog(catalogItems);
      expect(active).toHaveLength(3);
      expect(active.map((i) => i.slug)).toEqual(['pinata', 'snack-bar', 'decoracion-tematica']);
    });

    it('sumCatalogPrices debería sumar precios de items seleccionados', () => {
      const total = sumCatalogPrices(['snack-bar', 'decoracion-tematica'], catalogItems);
      expect(total).toBe(60);
    });

    it('sumCatalogPrices debería devolver 0 si el item está inactivo', () => {
      const total = sumCatalogPrices(['extra-inactivo'], catalogItems);
      expect(total).toBe(0);
    });

    it('sumCatalogPrices debería devolver 0 para IDs desconocidos', () => {
      const total = sumCatalogPrices(['no-existe'], catalogItems);
      expect(total).toBe(0);
    });

    it('getCatalogItemById debería encontrar un item por id', () => {
      const item = getCatalogItemById('snack-bar', catalogItems);
      expect(item).toBeDefined();
      expect(item.nombre).toBe('Snack Bar');
    });

    it('getCatalogItemById debería devolver null si no existe', () => {
      const item = getCatalogItemById('no-existe', catalogItems);
      expect(item).toBeNull();
    });
  });
});
