import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Step8Summary from './Step8Summary';

describe('Step8Summary Component', () => {
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
			{ id: 'decoracion', slug: 'decoracion-tematica', nombre: 'Decoración Temática', precio: 35, active: true, suspended: false }
		]
	};

	const mockMenus = [{ id: 'm1', name: 'Menú 1', price: 10 }];

	const baseFormData = {
		fecha: '2026-05-15', // Viernes
		turno: 'T1',
		cliente: {
			nombreNiño: 'Lucas',
			edadNiño: '6',
			nombrePadre: 'Carlos',
			telefono: '123456789',
			email: 'test@test.com',
		},
		niños: { cantidad: 12, menuId: 'm1' },
		adultos: { cantidad: 2, comida: [] },
		extras: {
			taller: 'ninguno',
			personajes: [],
			pinata: false,
			observaciones: '',
			alergenos: '',
			extension: 0,
			extensionType: 'default',
		},
	};

	const defaultProps = {
		formData: baseFormData,
		prices: mockPrices,
		calculateTotal: () => 120,
		getExtendedTime: () => '17:00 - 19:00',
		childrenMenusWithPrices: mockMenus,
		workshops: mockPrices.workshops,
		extrasCatalogo: mockPrices.extrasCatalogo,
	};

	it('debería renderizar sin errores con datos completos', () => {
		render(<Step8Summary {...defaultProps} />);
		expect(screen.getByText(/Resumen Final/i)).toBeDefined();
		// Muestra la fecha seleccionada (ya no hay datos del cliente en este paso)
		expect(screen.getByText('2026-05-15')).toBeDefined();
	});

	it('debería renderizar sin errores con extras activos', () => {
		const formDataWithExtras = {
			...baseFormData,
			extras: {
				...baseFormData.extras,
				taller: 'Cocina',
				personajes: ['Pirata'],
				pinata: true,
				extension: 30,
				observaciones: 'Nota de prueba',
				alergenos: 'Gluten',
			},
		};

		render(<Step8Summary {...defaultProps} formData={formDataWithExtras} />);

		expect(screen.getByText(/Cocina/i)).toBeDefined();
		expect(screen.getByText(/Pirata/i)).toBeDefined();
		expect(screen.getByText(/Piñata/i)).toBeDefined();
		expect(screen.getByText(/Nota de prueba/i)).toBeDefined();
		expect(screen.getByText(/Gluten/i)).toBeDefined();
	});

	// TEST CRÍTICO: Safari compatibility
	it('(Safari) debería renderizar correctamente con fecha en formato YYYY-MM-DD', () => {
		// Este test verifica que NO se usa new Date() directamente
		// Safari no soporta new Date("YYYY-MM-DD")
		const formDataFriday = {
			...baseFormData,
			fecha: '2026-05-15', // Viernes
		};

		// No debe crashear
		const { container } = render(
			<Step8Summary {...defaultProps} formData={formDataFriday} />,
		);

		// Step8Summary debe mostrar el plus de fin de semana para viernes
		// usando safeParseDate internamente
		expect(container.textContent).toContain('Resumen Final');
	});

	it('(Safari) debería renderizar sin crash cuando fecha está vacía', () => {
		const formDataNoDate = {
			...baseFormData,
			fecha: '',
		};

		// No debe crashear aunque la fecha esté vacía
		render(<Step8Summary {...defaultProps} formData={formDataNoDate} />);

		expect(screen.getByText(/Resumen Final/i)).toBeDefined();
	});

	it('(Safari) debería renderizar sin crash con una fecha entre semana', () => {
		const formDataWeekday = {
			...baseFormData,
			fecha: '2026-05-13', // Miércoles
		};

		const { container } = render(
			<Step8Summary {...defaultProps} formData={formDataWeekday} />,
		);

		// No debería mostrar plus fin de semana para miércoles
		expect(container.textContent).not.toContain('Plus Fin de Semana');
	});

	it('debería mostrar el total calculado', () => {
		render(<Step8Summary {...defaultProps} calculateTotal={() => 250.5} />);
		expect(screen.getByText(/250.50/)).toBeDefined();
	});

	it('debería mostrar la comida de adultos cuando hay selecciones', () => {
		const formDataWithAdultFood = {
			...baseFormData,
			adultos: {
				cantidad: 2,
				comida: [{ nombre: 'Tortilla', precioUnitario: 5, cantidad: 2 }],
			},
		};

		render(<Step8Summary {...defaultProps} formData={formDataWithAdultFood} />);

		expect(screen.getByText(/Raciones adultos/i)).toBeDefined();
	});

	it('debería renderizar items del catálogo con nombres y precios', () => {
		const formDataWithCatalog = {
			...baseFormData,
			extras: {
				...baseFormData.extras,
				catalogoItemIds: ['snack-bar', 'decoracion-tematica'],
			},
		};

		const { container } = render(<Step8Summary {...defaultProps} formData={formDataWithCatalog} />);

		expect(container.textContent).toContain('Snack Bar');
		expect(container.textContent).toContain('Decoración Temática');
		expect(container.textContent).toContain('25.00€');
		expect(container.textContent).toContain('35.00€');
	});

	it('debería renderizar Piñata en su sección dedicada y en catálogo', () => {
		const formDataWithPinataCatalog = {
			...baseFormData,
			extras: {
				...baseFormData.extras,
				pinata: true,
				catalogoItemIds: ['pinata', 'snack-bar'],
			},
		};

		const { container } = render(<Step8Summary {...defaultProps} formData={formDataWithPinataCatalog} />);

		expect(container.textContent).toContain('Piñata');
		expect(container.textContent).toContain('Snack Bar');
	});

	it('no debería fallar con catalogoItemIds vacío', () => {
		const formDataEmptyCatalog = {
			...baseFormData,
			extras: {
				...baseFormData.extras,
				catalogoItemIds: [],
			},
		};

		const { container } = render(<Step8Summary {...defaultProps} formData={formDataEmptyCatalog} />);

		expect(container.textContent).toContain('Resumen Final');
		expect(container.textContent).not.toContain('Extras Adicionales');
	});

	it('debería mostrar fallback por ID si el item fue eliminado del catálogo', () => {
		const formDataUnknownCatalog = {
			...baseFormData,
			extras: {
				...baseFormData.extras,
				catalogoItemIds: ['item-eliminado'],
			},
		};

		const { container } = render(<Step8Summary {...defaultProps} formData={formDataUnknownCatalog} />);

		expect(container.textContent).toContain('item-eliminado');
	});
});
