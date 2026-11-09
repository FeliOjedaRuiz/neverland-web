// Test de la función PURA extraída de `createCalendarEvent`.
// `google.service.js` ejecuta `init()` al cargarse: si no hay credenciales
// válidas emite el warning "Failed to initialize Google Calendar Service" y
// sigue adelante. Esto NO debe colgar ni hacer fallar el test, porque aquí
// solo se invoca `construirDetalleComercial` (sin tocar Calendar ni red).
//
// Para que la suite sea HERMÉTICA (sin autenticación real contra Google ni
// llamadas de red en cada ejecución) se inyecta un JSON de credenciales
// inválido ANTES de cargar el módulo: `init()` falla al parsearlo y no llega
// a autenticar. Hay que hacerlo antes del `require` porque `init()` se ejecuta
// al cargar el fichero.
process.env.GOOGLE_SERVICE_ACCOUNT_JSON = 'test-hermetico-sin-credenciales';

const { construirDetalleComercial } = require('../services/google.service');

// Martes garantizado: la línea "Plus Fin de Semana" solo aparece los viernes,
// sábados y domingos, así que con martes las aserciones del resumen quedan
// estables y sin ruido.
const martes = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  while (d.getDay() !== 2) d.setDate(d.getDate() + 1);
  return d;
})();

describe('construirDetalleComercial — detalle de precios de Google Calendar', () => {
  it('0 actividades → no genera línea de actividad', () => {
    const { precioLines, tallerNames, extrasNombres } = construirDetalleComercial(
      { extras: { talleres: [] } },
      martes,
      { extensionMinutos: 0, costoExtension: 0 },
      []
    );

    expect(tallerNames).toEqual([]);
    expect(precioLines.some(linea => linea.includes('Actividad'))).toBe(false);
    expect(extrasNombres).toEqual([]);
  });

  it('1 actividad → línea singular "Actividad (Slime) = 25.00€"', () => {
    const { precioLines, tallerNames } = construirDetalleComercial(
      { extras: { talleres: ['Slime'], precioTallerApplied: 25 } },
      martes,
      { extensionMinutos: 0, costoExtension: 0 },
      []
    );

    expect(tallerNames).toEqual(['Slime']);
    expect(precioLines).toContain('  Actividad (Slime) = 25.00€');
  });

  it('2 actividades → línea plural "Actividades (Slime, Tattoos) = 50.00€" con el total del snapshot', () => {
    const { precioLines, tallerNames } = construirDetalleComercial(
      { extras: { talleres: ['Slime', 'Tattoos'], precioTallerApplied: 50 } },
      martes,
      { extensionMinutos: 0, costoExtension: 0 },
      []
    );

    expect(tallerNames).toEqual(['Slime', 'Tattoos']);
    expect(precioLines).toContain('  Actividades (Slime, Tattoos) = 50.00€');
  });

  it('sin precioTallerApplied → no genera línea de actividad', () => {
    const sinSnapshot = construirDetalleComercial(
      { extras: { talleres: ['Slime'] } },
      martes,
      { extensionMinutos: 0, costoExtension: 0 },
      []
    );

    expect(sinSnapshot.precioLines.some(linea => linea.includes('Actividad'))).toBe(false);

    // Snapshot a 0 tampoco debe pintar la línea.
    const snapshotCero = construirDetalleComercial(
      { extras: { talleres: ['Slime'], precioTallerApplied: 0 } },
      martes,
      { extensionMinutos: 0, costoExtension: 0 },
      []
    );

    expect(snapshotCero.precioLines.some(linea => linea.includes('Actividad'))).toBe(false);
  });

  it('línea de personajes con su total', () => {
    const { precioLines } = construirDetalleComercial(
      { extras: { personajes: ['Elsa', 'Anna'], precioPersonajeApplied: 80 } },
      martes,
      { extensionMinutos: 0, costoExtension: 0 },
      []
    );

    expect(precioLines).toContain('  Personajes (Elsa, Anna) = 80.00€');
  });

  it('piñata legacy (sin catálogo) → línea "Piñata = 15.00€" y extrasNombres ["Piñata"]', () => {
    const { precioLines, extrasNombres } = construirDetalleComercial(
      { extras: { pinata: true, precioPinataApplied: 15 } },
      martes,
      { extensionMinutos: 0, costoExtension: 0 },
      []
    );

    expect(precioLines).toContain('  Piñata = 15.00€');
    expect(extrasNombres).toEqual(['Piñata']);
  });

  it('ítems de catálogo → nombres y precios del catálogo, sin línea de piñata legacy', () => {
    const catalogItems = [
      { id: 'c1', slug: 'snack-bar', nombre: 'Snack Bar', precio: 25 },
      { id: 'c2', slug: 'decoracion-tematica', nombre: 'Decoración Temática', precio: 35 }
    ];

    const { precioLines, extrasNombres } = construirDetalleComercial(
      {
        extras: {
          catalogoItemIds: ['snack-bar', 'decoracion-tematica'],
          // Con catálogo, la piñata no debe pintarse dos veces.
          pinata: true,
          precioPinataApplied: 15
        }
      },
      martes,
      { extensionMinutos: 0, costoExtension: 0 },
      catalogItems
    );

    expect(extrasNombres).toEqual(['Snack Bar', 'Decoración Temática']);
    expect(precioLines).toContain('  Snack Bar = 25.00€');
    expect(precioLines).toContain('  Decoración Temática = 35.00€');
    expect(precioLines.some(linea => linea.includes('Piñata'))).toBe(false);
  });

  it('extra de catálogo sin coincidencia → usa el id como nombre y 0 €', () => {
    const { precioLines, extrasNombres } = construirDetalleComercial(
      { extras: { catalogoItemIds: ['id-desconocido'] } },
      martes,
      { extensionMinutos: 0, costoExtension: 0 },
      []
    );

    expect(extrasNombres).toEqual(['id-desconocido']);
    expect(precioLines).toContain('  id-desconocido = 0.00€');
  });

  it('mantiene el orden exacto de las líneas del resumen de cuenta', () => {
    const { precioLines } = construirDetalleComercial(
      {
        niños: { cantidad: 15, precioApplied: 15 },
        adultos: { comida: [{ item: 'Tortilla', cantidad: 2, precioUnitario: 4 }] },
        extras: {
          talleres: ['Slime'],
          precioTallerApplied: 25,
          personajes: ['Elsa'],
          precioPersonajeApplied: 40,
          costoExtra: -10
        }
      },
      martes,
      { extensionMinutos: 30, costoExtension: 30 },
      []
    );

    expect(precioLines).toEqual([
      '  15 Niños × 15.00€ = 225.00€',
      '  Comida Adultos = 8.00€',
      '  Actividad (Slime) = 25.00€',
      '  Personajes (Elsa) = 40.00€',
      '  Extensión (+30min) = 30.00€',
      '  Descuento = -10.00€'
    ]);
  });

  it('plus de fin de semana solo aparece en viernes/sábado/domingo', () => {
    // Viernes garantizado.
    const viernes = (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
      return d;
    })();

    const { precioLines } = construirDetalleComercial(
      { niños: { cantidad: 15, precioApplied: 15 }, extras: { talleres: [] } },
      viernes,
      { extensionMinutos: 0, costoExtension: 0 },
      []
    );

    expect(precioLines).toContain('  Plus Fin de Semana (15 × 1.50€) = 22.50€');
  });
});
