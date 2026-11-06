import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import Step5Workshops from './Step5Workshops';

const WORKSHOPS = [
	{ id: '1', name: 'Cocina', priceBase: 20, pricePlus: 25, desc: 'Cocina divertida', imageUrl: '', suspended: false, active: true },
	{ id: '2', name: 'Slime', priceBase: 20, pricePlus: 30, desc: 'Slime mágico', imageUrl: '', suspended: false, active: true },
	{ id: '3', name: 'Tattoos', priceBase: 30, pricePlus: 35, desc: 'Tattoos temporales', imageUrl: '', suspended: false, active: true },
	{ id: '4', name: 'Magia', priceBase: 30, pricePlus: 40, desc: 'Trucos de magia', imageUrl: '', suspended: false, active: true },
];

const baseFormData = {
	fecha: '2026-05-13',
	niños: { cantidad: 10, menuId: 'm1' },
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
	setFormData: vi.fn(),
	WORKSHOPS,
};

describe('Step5Workshops Component', () => {
	it('debería renderizar el título y el botón "Sin actividad"', () => {
		render(<Step5Workshops {...defaultProps} />);
		expect(screen.getByText(/Actividades/i)).toBeDefined();
		expect(screen.getByText(/Sin actividad/i)).toBeDefined();
	});

	it('debería añadir una actividad al pulsar una card', () => {
		const setFormData = vi.fn();
		render(<Step5Workshops {...defaultProps} setFormData={setFormData} />);

		fireEvent.click(screen.getByText('Cocina'));

		expect(setFormData).toHaveBeenCalledTimes(1);
		expect(setFormData).toHaveBeenCalledWith({
			...baseFormData,
			extras: { ...baseFormData.extras, talleres: ['Cocina'] },
		});
	});

	it('debería quitar una actividad seleccionada al pulsar su card', () => {
		const setFormData = vi.fn();
		const formDataWithCocina = {
			...baseFormData,
			extras: { ...baseFormData.extras, talleres: ['Cocina'] },
		};
		render(<Step5Workshops {...defaultProps} formData={formDataWithCocina} setFormData={setFormData} />);

		fireEvent.click(screen.getAllByText('Cocina').find((el) => el.tagName.toLowerCase() === 'h3'));

		expect(setFormData).toHaveBeenCalledTimes(1);
		expect(setFormData).toHaveBeenCalledWith({
			...formDataWithCocina,
			extras: { ...formDataWithCocina.extras, talleres: [] },
		});
	});

	it('debería mostrar "Quitar actividad" cuando solo hay 1 seleccionada', () => {
		const formDataWithOne = {
			...baseFormData,
			extras: { ...baseFormData.extras, talleres: ['Cocina'] },
		};
		render(<Step5Workshops {...defaultProps} formData={formDataWithOne} />);
		expect(screen.getByText(/Quitar actividad/i)).toBeDefined();
	});

	it('debería limpiar todas las actividades al pulsar "Quitar todas"', () => {
		const setFormData = vi.fn();
		const formDataWithTwo = {
			...baseFormData,
			extras: { ...baseFormData.extras, talleres: ['Cocina', 'Slime'] },
		};
		render(<Step5Workshops {...defaultProps} formData={formDataWithTwo} setFormData={setFormData} />);

		fireEvent.click(screen.getByText(/Quitar todas/i));

		expect(setFormData).toHaveBeenCalledTimes(1);
		expect(setFormData).toHaveBeenCalledWith({
			...formDataWithTwo,
			extras: { ...formDataWithTwo.extras, talleres: [] },
		});
	});

	it('debería mostrar chips con las actividades seleccionadas', () => {
		const formDataWithTwo = {
			...baseFormData,
			extras: { ...baseFormData.extras, talleres: ['Cocina', 'Slime'] },
		};
		render(<Step5Workshops {...defaultProps} formData={formDataWithTwo} />);
		const chips = screen.getAllByText('Cocina');
		expect(chips.length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText('Slime').length).toBeGreaterThanOrEqual(1);
	});

	it('debería mostrar el precio dinámico como suma de las actividades seleccionadas', () => {
		const formDataWithTwo = {
			...baseFormData,
			extras: { ...baseFormData.extras, talleres: ['Cocina', 'Slime'] },
		};
		render(<Step5Workshops {...defaultProps} formData={formDataWithTwo} />);
		// 20€ (Cocina base) + 20€ (Slime base) = 40€
		expect(screen.getByText('40€')).toBeDefined();
	});

	it('debería abrir el modal y añadir una actividad desde el botón AÑADIR', () => {
		const setFormData = vi.fn();
		render(<Step5Workshops {...defaultProps} setFormData={setFormData} />);

		// Abrir el modal de Cocina desde el botón de detalle (hermano de la card)
		fireEvent.click(screen.getByRole('button', { name: /Ver detalles de Cocina/i }));

		fireEvent.click(screen.getByText(/AÑADIR/i));

		expect(setFormData).toHaveBeenCalled();
		expect(setFormData).toHaveBeenLastCalledWith({
			...baseFormData,
			extras: { ...baseFormData.extras, talleres: ['Cocina'] },
		});
	});

	it('debería mostrar QUITAR en el modal cuando la actividad ya está seleccionada', () => {
		const formDataWithCocina = {
			...baseFormData,
			extras: { ...baseFormData.extras, talleres: ['Cocina'] },
		};
		render(<Step5Workshops {...defaultProps} formData={formDataWithCocina} />);

		// Abrir el modal de Cocina desde el botón de detalle (hermano de la card)
		fireEvent.click(screen.getByRole('button', { name: /Ver detalles de Cocina/i }));

		expect(screen.getByRole('button', { name: /^Quitar actividad$/i })).toBeDefined();
	});

	it('debería quitar una actividad desde el botón QUITAR del modal', () => {
		const setFormData = vi.fn();
		const formDataWithCocina = {
			...baseFormData,
			extras: { ...baseFormData.extras, talleres: ['Cocina'] },
		};
		render(<Step5Workshops {...defaultProps} formData={formDataWithCocina} setFormData={setFormData} />);

		fireEvent.click(screen.getByRole('button', { name: /Ver detalles de Cocina/i }));

		fireEvent.click(screen.getByRole('button', { name: /^Quitar actividad$/i }));

		expect(setFormData).toHaveBeenCalled();
		expect(setFormData).toHaveBeenLastCalledWith({
			...formDataWithCocina,
			extras: { ...formDataWithCocina.extras, talleres: [] },
		});
	});

	it('no debería escribir precioTallerApplied en extras al seleccionar o limpiar actividades', () => {
		const setFormData = vi.fn();
		render(<Step5Workshops {...defaultProps} setFormData={setFormData} />);

		fireEvent.click(screen.getByText('Cocina'));
		fireEvent.click(screen.getByText('Slime'));

		const calls = setFormData.mock.calls;
		expect(calls.length).toBeGreaterThanOrEqual(1);
		calls.forEach(([nextFormData]) => {
			expect(nextFormData.extras).not.toHaveProperty('precioTallerApplied');
		});
	});

	it('debería bloquear la 4ª actividad y mostrar toast sin mutar el estado', async () => {
		const setFormData = vi.fn();
		const formDataWithThree = {
			...baseFormData,
			extras: { ...baseFormData.extras, talleres: ['Cocina', 'Slime', 'Tattoos'] },
		};
		render(<Step5Workshops {...defaultProps} formData={formDataWithThree} setFormData={setFormData} />);

		fireEvent.click(screen.getByText('Magia'));

		// No debe añadir la 4ª actividad
		expect(setFormData).not.toHaveBeenCalled();

		// El toast aparece con el mensaje correcto
		await waitFor(() => {
			expect(screen.getByText(/El máximo es 3 actividades/i)).toBeDefined();
		});
	});

	it('no debería renderizar actividades suspendidas o inactivas', () => {
		const workshopsWithInactive = [
			...WORKSHOPS,
			{ id: '5', name: 'Inactiva', priceBase: 10, pricePlus: 15, desc: '', imageUrl: '', suspended: false, active: false },
			{ id: '6', name: 'Suspendida', priceBase: 10, pricePlus: 15, desc: '', imageUrl: '', suspended: true, active: true },
		];
		render(<Step5Workshops {...defaultProps} WORKSHOPS={workshopsWithInactive} />);

		expect(screen.queryByText('Inactiva')).toBeNull();
		expect(screen.queryByText('Suspendida')).toBeNull();
	});

	it('debería limpiar todas las actividades al activar la card "Quitar todas"', () => {
		const setFormData = vi.fn();
		const formDataWithTwo = {
			...baseFormData,
			extras: { ...baseFormData.extras, talleres: ['Cocina', 'Slime'] },
		};
		render(<Step5Workshops {...defaultProps} formData={formDataWithTwo} setFormData={setFormData} />);

		const clearCard = screen.getByRole('button', { name: /Quitar todas las actividades/i });
		fireEvent.click(clearCard);

		expect(setFormData).toHaveBeenCalledTimes(1);
		expect(setFormData).toHaveBeenCalledWith({
			...formDataWithTwo,
			extras: { ...formDataWithTwo.extras, talleres: [] },
		});
	});

	it('no debería activar la card padre al hacer clic en el botón de detalle', () => {
		const setFormData = vi.fn();
		render(<Step5Workshops {...defaultProps} setFormData={setFormData} />);

		const detailButton = screen.getByRole('button', { name: /Ver detalles de Cocina/i });
		fireEvent.click(detailButton);

		// No debe llamar a setFormData (la card padre no debe reaccionar)
		expect(setFormData).not.toHaveBeenCalled();
	});

	it('debería abrir el modal al hacer clic en el botón de detalle sin seleccionar la actividad', () => {
		const setFormData = vi.fn();
		render(<Step5Workshops {...defaultProps} setFormData={setFormData} />);

		const detailButton = screen.getByRole('button', { name: /Ver detalles de Cocina/i });
		fireEvent.click(detailButton);

		expect(setFormData).not.toHaveBeenCalled();
		expect(screen.getByText(/Descripción del Taller/i)).toBeDefined();
	});

	it('la tarjeta "Sin actividad" no debe ser interactiva', () => {
		const setFormData = vi.fn();
		render(<Step5Workshops {...defaultProps} setFormData={setFormData} />);

		const emptyCard = screen.getByText(/Sin actividad/i).closest('[aria-disabled="true"]');
		expect(emptyCard).toBeDefined();
		expect(emptyCard.tagName.toLowerCase()).not.toBe('button');
		expect(setFormData).not.toHaveBeenCalled();
	});

	it('debería renderizar el toast con posición fixed, role="alert" y sin aria-live', async () => {
		const setFormData = vi.fn();
		const formDataWithThree = {
			...baseFormData,
			extras: { ...baseFormData.extras, talleres: ['Cocina', 'Slime', 'Tattoos'] },
		};
		const { container } = render(<Step5Workshops {...defaultProps} formData={formDataWithThree} setFormData={setFormData} />);

		fireEvent.click(screen.getByText('Magia'));

		await waitFor(() => {
			const toast = screen.getByRole('alert');
			expect(toast).toBeDefined();
			expect(toast.className).toContain('fixed');
			expect(toast.className).toContain('bottom-24');
			expect(toast).not.toHaveAttribute('aria-live');
		});
	});
});
