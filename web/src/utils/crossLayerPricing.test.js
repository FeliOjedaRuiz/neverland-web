import { describe, it, expect } from 'vitest';
import {
  esGrupoGrande as webEsGrupoGrande,
  obtenerPrecioTaller as webObtenerPrecioTaller,
} from './bookingUtils';
import {
  esGrupoGrande as apiEsGrupoGrande,
  obtenerPrecioTaller as apiObtenerPrecioTaller,
} from '../../../api/utils/pricing.js';

/**
 * Suite transversal de contrato cross-layer para el umbral de grupo grande.
 *
 * El helper del backend (`api/utils/pricing.js`) es CommonJS. Vitest lo importa
 * limpiamente como ES module mediante interoperabilidad de Vite, por lo que
 * podemos comparar directamente las dos implementaciones con el mismo catálogo
 * y cantidad de niños.
 */
describe('Cross-layer pricing contract (web vs api)', () => {
  const workshops = [
    { name: 'Cocina', priceBase: 20, pricePlus: 25 },
    { name: 'Slime', priceBase: 20, pricePlus: 30 },
    { name: 'Magia', priceBase: 30, pricePlus: 0 },        // sin pricePlus válido
    { name: 'Pintura', priceBase: 22 },                    // pricePlus ausente
  ];

  it('ambas capas coinciden en esGrupoGrande: false a 15 niños y true a 16', () => {
    expect(webEsGrupoGrande(15)).toBe(false);
    expect(apiEsGrupoGrande(15)).toBe(false);
    expect(webEsGrupoGrande(16)).toBe(true);
    expect(apiEsGrupoGrande(16)).toBe(true);
  });

  describe('obtenerPrecioTaller', () => {
    it('a 15 niños ambas capas devuelven priceBase para cada actividad', () => {
      workshops.forEach((ws) => {
        const web = webObtenerPrecioTaller(ws, 15);
        const api = apiObtenerPrecioTaller(ws, 15);
        expect(web).toBe(api);
        expect(web).toBe(Number(ws.priceBase));
      });
    });

    it('a 16 niños ambas capas devuelven pricePlus cuando es válido', () => {
      [workshops[0], workshops[1]].forEach((ws) => {
        const web = webObtenerPrecioTaller(ws, 16);
        const api = apiObtenerPrecioTaller(ws, 16);
        expect(web).toBe(api);
        expect(web).toBe(Number(ws.pricePlus));
      });
    });

    it('a 16 niños ambas capas hacen fallback a priceBase cuando pricePlus es 0 o ausente', () => {
      [workshops[2], workshops[3]].forEach((ws) => {
        const web = webObtenerPrecioTaller(ws, 16);
        const api = apiObtenerPrecioTaller(ws, 16);
        expect(web).toBe(api);
        expect(web).toBe(Number(ws.priceBase));
      });
    });

    it('ambas capas devuelven 0 para un taller inválido', () => {
      expect(webObtenerPrecioTaller(null, 15)).toBe(0);
      expect(apiObtenerPrecioTaller(null, 15)).toBe(0);
      expect(webObtenerPrecioTaller(undefined, 16)).toBe(0);
      expect(apiObtenerPrecioTaller(undefined, 16)).toBe(0);
    });
  });
});
