const { tallerText } = require('../config/mailer.config');

describe('tallerText', () => {
  it('devuelve "Sin actividad" cuando no hay actividades', () => {
    const result = tallerText({});
    expect(result.label).toBe('Sin actividad');
    expect(result.total).toBe(0);
    expect(result.nombres).toEqual([]);
  });

  it('devuelve "Sin actividad" para talleres vacíos explícitos', () => {
    const result = tallerText({ talleres: [], precioTallerApplied: 0 });
    expect(result.label).toBe('Sin actividad');
    expect(result.total).toBe(0);
  });

  it('lista una actividad y conserva el total del snapshot', () => {
    const result = tallerText({ talleres: ['Slime'], precioTallerApplied: 25 });
    expect(result.label).toBe('Taller de Slime');
    expect(result.total).toBe(25);
    expect(result.nombres).toEqual(['Slime']);
  });

  it('lista varias actividades con el total de la selección', () => {
    const result = tallerText({ talleres: ['Slime', 'Cocina'], precioTallerApplied: 55 });
    expect(result.label).toBe('Taller de Slime, Taller de Cocina');
    expect(result.total).toBe(55);
    expect(result.nombres).toEqual(['Slime', 'Cocina']);
  });

  it('no añade prefijo a nombres que ya empiezan por taller/show/visita', () => {
    const result = tallerText({ talleres: ['Taller de Magia', 'Show de payasos', 'Visita de personaje'], precioTallerApplied: 90 });
    expect(result.label).toBe('Taller de Magia, Show de payasos, Visita de personaje');
  });

  it('lee el campo legacy `taller` cuando no existe `talleres`', () => {
    const result = tallerText({ taller: 'Pintura' });
    expect(result.label).toBe('Taller de Pintura');
    expect(result.nombres).toEqual(['Pintura']);
  });

  it('ignora el valor legacy "ninguno"', () => {
    const result = tallerText({ taller: 'ninguno' });
    expect(result.label).toBe('Sin actividad');
    expect(result.nombres).toEqual([]);
  });
});
