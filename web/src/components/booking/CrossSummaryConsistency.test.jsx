import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Step8Summary from './Step8Summary';
import StepBudgetSummary from './StepBudgetSummary';

describe('Cross-summary activity cost consistency', () => {
  const mockPrices = {
    plusFinDeSemana: 1.5,
    preciosExtras: {
      tallerBase: 25,
      tallerPlus: 30,
      personaje: 40,
      pinata: 15,
      extension30: 30,
      extension60: 50,
    },
    workshops: [
      { name: 'Cocina', priceBase: 20, pricePlus: 25 },
      { name: 'Slime', priceBase: 20, pricePlus: 30 },
    ],
    extrasCatalogo: [
      { id: 'snack', slug: 'snack-bar', nombre: 'Snack Bar', precio: 25, active: true, suspended: false },
    ],
  };

  const mockMenus = [{ id: 'm1', name: 'Menú 1', price: 10 }];

  const formData = {
    fecha: '2026-05-13',
    turno: 'T1',
    cliente: { nombreNiño: 'Leo', edadNiño: '5', nombrePadre: 'Juan', telefono: '123456789', email: 'test@test.com' },
    niños: { cantidad: 12, menuId: 'm1' },
    adultos: { cantidad: 2, comida: [] },
    extras: {
      talleres: ['Cocina', 'Slime'],
      personajes: [],
      pinata: false,
      observaciones: '',
      alergenos: '',
      extension: 0,
      extensionType: 'default',
      catalogoItemIds: ['snack-bar'],
    },
  };

  const total = 185; // menu 12*10 + actividades 40 + catálogo 25

  const baseProps = {
    formData,
    prices: mockPrices,
    calculateTotal: () => total,
    getExtendedTime: () => '17:00 - 19:00',
    childrenMenusWithPrices: mockMenus,
    workshops: mockPrices.workshops,
    extrasCatalogo: mockPrices.extrasCatalogo,
  };

  it('ambos resúmenes muestran el mismo importe de actividades para la misma selección', () => {
    const { container: bookingContainer } = render(<Step8Summary {...baseProps} />);
    const { container: budgetContainer } = render(<StepBudgetSummary {...baseProps} onNext={vi.fn()} />);

    expect(bookingContainer.textContent).toContain('Cocina');
    expect(bookingContainer.textContent).toContain('Slime');
    expect(budgetContainer.textContent).toContain('Cocina');
    expect(budgetContainer.textContent).toContain('Slime');

    // El importe de actividades (40€) aparece en ambos resúmenes
    expect(bookingContainer.textContent).toContain('40€');
    expect(budgetContainer.textContent).toContain('40€');
  });

  it('ningún resumen duplica el coste de actividades en el subtotal de extras', () => {
    const { container: bookingContainer } = render(<Step8Summary {...baseProps} />);
    const { container: budgetContainer } = render(<StepBudgetSummary {...baseProps} onNext={vi.fn()} />);

    // Subtotal extras solo debe incluir el catálogo (25.00€), no sumar actividades
    expect(bookingContainer.textContent).toContain('Subtotal extras');
    expect(bookingContainer.textContent).toContain('25.00€');
    expect(bookingContainer.textContent).not.toContain('65.00€'); // 40 actividades + 25 catálogo

    expect(budgetContainer.textContent).toContain('Subtotal extras');
    expect(budgetContainer.textContent).toContain('25.00€');
    expect(budgetContainer.textContent).not.toContain('65.00€');
  });

  it('el total estimado se renderiza en ambos resúmenes sin desviaciones', () => {
		render(<Step8Summary {...baseProps} />);
		expect(screen.getByText('185.00€')).toBeDefined();

		const { container: budgetContainer } = render(<StepBudgetSummary {...baseProps} onNext={vi.fn()} />);
		expect(budgetContainer.textContent).toContain('185.00€');
  });
});
