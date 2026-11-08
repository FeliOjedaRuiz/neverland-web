const {
  obtenerTalleres,
  obtenerPrecioTaller,
  esGrupoGrande,
  normalizarNombreActividad,
  resolverWorkshop,
  normalizarActividadesLegacy
} = require('../utils/pricing');

describe('helpers de precio', () => {
  describe('obtenerTalleres', () => {
    it('debería devolver un array vacío cuando extras no existe', () => {
      expect(obtenerTalleres(undefined)).toEqual([]);
    });

    it('debería devolver el array talleres cuando ya está migrado', () => {
      const extras = { talleres: ['Slime', 'Tattoos'] };
      expect(obtenerTalleres(extras)).toEqual(['Slime', 'Tattoos']);
    });

    it('debería devolver un array con el taller legacy cuando es válido', () => {
      const extras = { taller: 'Cocina' };
      expect(obtenerTalleres(extras)).toEqual(['Cocina']);
    });

    it("debería devolver un array vacío cuando el taller legacy es 'ninguno'", () => {
      const extras = { taller: 'ninguno' };
      expect(obtenerTalleres(extras)).toEqual([]);
    });

    it('debería devolver un array vacío cuando no hay taller ni talleres', () => {
      const extras = {};
      expect(obtenerTalleres(extras)).toEqual([]);
    });

    it('debería priorizar talleres sobre taller cuando ambos coexisten (post-parcial)', () => {
      const extras = { talleres: ['Slime'], taller: 'Cocina' };
      expect(obtenerTalleres(extras)).toEqual(['Slime']);
    });

    it('debería respetar un array vacío explícito (la selección vacía gana al legacy)', () => {
      const extras = { talleres: [], taller: 'Cocina' };
      expect(obtenerTalleres(extras)).toEqual([]);
    });

    it('debería devolver array vacío cuando talleres es vacío y no hay legacy taller', () => {
      const extras = { talleres: [] };
      expect(obtenerTalleres(extras)).toEqual([]);
    });

    it('debería ignorar un talleres que no sea array y caer al legacy', () => {
      expect(obtenerTalleres({ talleres: 'Slime' })).toEqual([]);
      expect(obtenerTalleres({ talleres: 'Slime', taller: 'Cocina' })).toEqual(['Cocina']);
    });

    it('debería descartar un taller legacy que no sea string', () => {
      expect(obtenerTalleres({ taller: 42 })).toEqual([]);
      expect(obtenerTalleres({ taller: { nombre: 'Cocina' } })).toEqual([]);
    });

    it('debería devolver una copia defensiva del array de actividades', () => {
      const extras = { talleres: ['Slime'] };
      const resultado = obtenerTalleres(extras);
      resultado.push('Tattoos');
      expect(extras.talleres).toEqual(['Slime']);
    });

    it('debería ignorar talleres cuando no es un array y caer al legacy', () => {
      const extras = { talleres: 'Slime', taller: 'Cocina' };
      expect(obtenerTalleres(extras)).toEqual(['Cocina']);
    });

    it('debería devolver un array vacío cuando el taller legacy es mayúsculas "NINGUNO"', () => {
      const extras = { taller: 'NINGUNO' };
      expect(obtenerTalleres(extras)).toEqual([]);
    });

    it('debería limpiar espacios en el taller legacy válido', () => {
      const extras = { taller: '  Cocina  ' };
      expect(obtenerTalleres(extras)).toEqual(['Cocina']);
    });

    it('debería devolver un array vacío cuando el taller legacy es un string vacío', () => {
      const extras = { taller: '' };
      expect(obtenerTalleres(extras)).toEqual([]);
    });
  });

  describe('normalizarActividadesLegacy', () => {
    it('debería convertir un string legacy válido en el array talleres (con trim)', () => {
      expect(normalizarActividadesLegacy({ taller: 'Cocina' })).toEqual({ talleres: ['Cocina'] });
      expect(normalizarActividadesLegacy({ taller: '  Cocina  ' })).toEqual({ talleres: ['Cocina'] });
    });

    it("debería convertir el sentinel legacy 'ninguno' en un array vacío", () => {
      expect(normalizarActividadesLegacy({ taller: 'ninguno' })).toEqual({ talleres: [] });
      expect(normalizarActividadesLegacy({ taller: ' NINGUNO ' })).toEqual({ talleres: [] });
    });

    it('debería convertir un string vacío o de solo espacios en un array vacío', () => {
      expect(normalizarActividadesLegacy({ taller: '' })).toEqual({ talleres: [] });
      expect(normalizarActividadesLegacy({ taller: '   ' })).toEqual({ talleres: [] });
    });

    it('debería conservar un talleres ya presente y eliminar taller (sin dual-write)', () => {
      expect(normalizarActividadesLegacy({ talleres: ['Slime'], taller: 'Cocina' })).toEqual({ talleres: ['Slime'] });
      expect(normalizarActividadesLegacy({ talleres: [], taller: 'Cocina' })).toEqual({ talleres: [] });
      expect(normalizarActividadesLegacy({ talleres: 'Slime', taller: 'Cocina' })).toEqual({ talleres: ['Cocina'] });
    });

    it('debería ser no-op cuando no hay taller', () => {
      expect(normalizarActividadesLegacy({ talleres: ['Slime'] })).toEqual({ talleres: ['Slime'] });
      const vacio = {};
      expect(normalizarActividadesLegacy(vacio)).toEqual({});
      expect(vacio).toEqual({});
    });

    it('debería devolver tal cual cualquier entrada que no sea un objeto', () => {
      expect(normalizarActividadesLegacy(undefined)).toBeUndefined();
      expect(normalizarActividadesLegacy(null)).toBeNull();
      expect(normalizarActividadesLegacy('taller')).toBe('taller');
      expect(normalizarActividadesLegacy(42)).toBe(42);
    });

    it('debería mutar el objeto en sitio y devolver la misma referencia (contrato del flujo)', () => {
      const extras = { taller: 'Magia' };
      const resultado = normalizarActividadesLegacy(extras);
      expect(resultado).toBe(extras);
      expect(extras.talleres).toEqual(['Magia']);
      expect('taller' in extras).toBe(false);
    });

    it('debería descartar un taller legacy que no sea string y limpiar la clave', () => {
      expect(normalizarActividadesLegacy({ taller: 42 })).toEqual({});
      expect(normalizarActividadesLegacy({ taller: { nombre: 'Cocina' } })).toEqual({});
    });
  });

  describe('esGrupoGrande', () => {
    it('debería devolver false con exactamente 15 niños', () => {
      expect(esGrupoGrande(15)).toBe(false);
    });

    it('debería devolver true con 16 niños', () => {
      expect(esGrupoGrande(16)).toBe(true);
    });
  });

  describe('obtenerPrecioTaller', () => {
    it('debería aplicar el precio base con exactamente 15 niños', () => {
      const workshop = { priceBase: 20, pricePlus: 30 };
      expect(obtenerPrecioTaller(workshop, 15)).toBe(20);
    });

    it('debería aplicar el precio plus con 16 niños', () => {
      const workshop = { priceBase: 20, pricePlus: 30 };
      expect(obtenerPrecioTaller(workshop, 16)).toBe(30);
    });

    it('debería usar el precio base como fallback cuando pricePlus es 0 en grupo grande', () => {
      const workshop = { priceBase: 20, pricePlus: 0 };
      expect(obtenerPrecioTaller(workshop, 18)).toBe(20);
    });

    it('debería usar el precio plus cuando es válido en grupo grande', () => {
      const workshop = { priceBase: 20, pricePlus: 35 };
      expect(obtenerPrecioTaller(workshop, 18)).toBe(35);
    });

    it('debería devolver 0 cuando el taller es nulo o inválido', () => {
      expect(obtenerPrecioTaller(null, 15)).toBe(0);
      expect(obtenerPrecioTaller(undefined, 15)).toBe(0);
    });

    it('debería coercer priceBase y pricePlus cuando vienen como strings', () => {
      const workshop = { priceBase: '20', pricePlus: '35' };
      expect(obtenerPrecioTaller(workshop, 15)).toBe(20);
      expect(obtenerPrecioTaller(workshop, 16)).toBe(35);
    });

    it('debería devolver 0 cuando los precios no son números válidos', () => {
      expect(obtenerPrecioTaller({ priceBase: 'abc', pricePlus: 'xyz' }, 18)).toBe(0);
    });

    it('debería aplicar el precio base cuando la cantidad de niños no es numérica', () => {
      const workshop = { priceBase: 20, pricePlus: 30 };
      expect(obtenerPrecioTaller(workshop, undefined)).toBe(20);
      expect(obtenerPrecioTaller(workshop, 'muchos')).toBe(20);
    });
  });

  describe('normalizarNombreActividad', () => {
    it('debería recortar espacios exteriores y pasar a minúsculas', () => {
      expect(normalizarNombreActividad('Taller de chapas ')).toBe('taller de chapas');
      expect(normalizarNombreActividad('  Fiesta aquatica básica  ')).toBe('fiesta aquatica básica');
    });

    it('debería ser insensible a mayúsculas', () => {
      expect(normalizarNombreActividad('TALLER GAMER')).toBe('taller gamer');
      expect(normalizarNombreActividad('Taller Gamer')).toBe('taller gamer');
    });

    it('debería devolver cadena vacía para entradas nulas o undefined', () => {
      expect(normalizarNombreActividad(undefined)).toBe('');
      expect(normalizarNombreActividad(null)).toBe('');
    });

    it('debería coercer el resto de tipos a string (comportamiento de String())', () => {
      expect(normalizarNombreActividad(42)).toBe('42');
      expect(normalizarNombreActividad({ name: 'Slime' })).toBe('[object object]');
    });

    it('debería devolver cadena vacía para cadenas vacías o solo espacios', () => {
      expect(normalizarNombreActividad('')).toBe('');
      expect(normalizarNombreActividad('   ')).toBe('');
    });
  });

  describe('resolverWorkshop', () => {
    const workshops = [
      { name: 'Taller de chapas ', priceBase: 20, pricePlus: 30 },
      { name: 'Fiesta aquatica básica', priceBase: 30, pricePlus: 35 },
      { name: 'Slime', priceBase: 20, pricePlus: 30 }
    ];

    it('debería resolver un nombre del catálogo que tiene espacio final', () => {
      const resultado = resolverWorkshop(workshops, 'Taller de chapas');
      expect(resultado).not.toBeNull();
      expect(resultado.name).toBe('Taller de chapas ');
      expect(resultado.priceBase).toBe(20);
    });

    it('debería resolver ignorando mayúsculas y espacios en ambos lados', () => {
      expect(resolverWorkshop(workshops, '  FIESTA AQUATICA BÁSICA ')).not.toBeNull();
      expect(resolverWorkshop(workshops, 'sLiMe')?.priceBase).toBe(20);
    });

    it('debería devolver null cuando el nombre no está en el catálogo', () => {
      expect(resolverWorkshop(workshops, 'ActividadFantasma')).toBeNull();
    });

    it('debería devolver null para cadenas vacías o de solo espacios', () => {
      expect(resolverWorkshop(workshops, '')).toBeNull();
      expect(resolverWorkshop(workshops, '   ')).toBeNull();
    });

    it('debería devolver null cuando el nombre no es string', () => {
      expect(resolverWorkshop(workshops, 42)).toBeNull();
      expect(resolverWorkshop(workshops, null)).toBeNull();
      expect(resolverWorkshop(workshops, undefined)).toBeNull();
    });

    it('debería devolver null cuando el catálogo no es un array', () => {
      expect(resolverWorkshop(undefined, 'Slime')).toBeNull();
      expect(resolverWorkshop(null, 'Slime')).toBeNull();
      expect(resolverWorkshop('Slime', 'Slime')).toBeNull();
    });

    it('debería ignorar entradas del catálogo sin name string', () => {
      const sucio = [null, { priceBase: 10 }, { name: 7 }, { name: 'Slime', priceBase: 5 }];
      expect(resolverWorkshop(sucio, 'Slime')?.priceBase).toBe(5);
      expect(resolverWorkshop(sucio, 'Desconocida')).toBeNull();
    });
  });
});
