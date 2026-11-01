const { obtenerTalleres, obtenerPrecioTaller, esGrupoGrande } = require('../utils/pricing');

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
});
