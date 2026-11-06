import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import StepBudgetSummary from './StepBudgetSummary';

describe('StepBudgetSummary Component', () => {
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
		workshops: [{ name: 'Cocina', priceBase: 20, pricePlus: 25 }],
		extrasCatalogo: [
			{ id: 'pinata', slug: 'pinata', nombre: 'Piñata Neverland', precio: 15, active: true, suspended: false },
			{ id: 'snack', slug: 'snack-bar', nombre: 'Snack Bar', precio: 25, active: true, suspended: false },
		],
	};

	const mockMenus = [{ id: 'm1', name: 'Menú 1', price: 10 }];

	const baseFormData = {
		fecha: '',
		turno: '',
		niños: { cantidad: 12, menuId: 'm1' },
		adultos: { cantidad: 2, comida: [] },
		extras: {
			talleres: [],
			personajes: [],
			pinata: false,
			observaciones: '',
			alergenos: '',
			extension: 0,
			extensionType: 'default',
			catalogoItemIds: [],
		},
	};

	const defaultProps = {
		formData: baseFormData,
		prices: mockPrices,
		calculateTotal: () => 120,
		childrenMenusWithPrices: mockMenus,
		workshops: mockPrices.workshops,
		extrasCatalogo: mockPrices.extrasCatalogo,
		onNext: vi.fn(),
	};

	it('debería renderizar el título del presupuesto', () => {
		render(<StepBudgetSummary {...defaultProps} />);
		expect(screen.getByText(/Tu Presupuesto/i)).toBeDefined();
	});

	it('debería mostrar el bloque de actividades cuando hay talleres seleccionados', () => {
		const formDataWithTaller = {
			...baseFormData,
			extras: { ...baseFormData.extras, talleres: ['Cocina'] },
		};
		render(<StepBudgetSummary {...defaultProps} formData={formDataWithTaller} />);
		expect(screen.getByText(/Actividades/i)).toBeDefined();
		expect(screen.getByText('20€')).toBeDefined();
	});

	it('no debería duplicar el importe de actividades en el subtotal de extras', () => {
		const formDataWithTallerAndCatalog = {
			...baseFormData,
			extras: {
				...baseFormData.extras,
				talleres: ['Cocina'],
				catalogoItemIds: ['snack-bar'],
			},
		};

		const { container } = render(<StepBudgetSummary {...defaultProps} formData={formDataWithTallerAndCatalog} />);

		expect(container.textContent).toContain('Subtotal extras');
		expect(container.textContent).toContain('25.00€');
		expect(container.textContent).not.toContain('45.00€');
	});
});
