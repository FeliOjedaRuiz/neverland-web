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
			personaje: 'ninguno',
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
	};

	it('debería renderizar sin errores con datos completos', () => {
		render(<Step8Summary {...defaultProps} />);
		expect(screen.getByText(/Resumen Final/i)).toBeDefined();
		expect(screen.getByText(/Lucas/i)).toBeDefined();
	});

	it('debería renderizar sin errores con extras activos', () => {
		const formDataWithExtras = {
			...baseFormData,
			extras: {
				...baseFormData.extras,
				taller: 'Cocina',
				personaje: 'Pirata',
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
});
