import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ServerError from './ServerError';

describe('ServerError Component', () => {
	it('debería renderizar el mensaje de error temático del Galeón', () => {
		render(
			<MemoryRouter>
				<ServerError />
			</MemoryRouter>,
		);

		expect(screen.getByText(/¡Algo se rompió!/i)).toBeDefined();
		expect(screen.getByText(/piratas mecánicos/i)).toBeDefined();
	});

	it('debería mostrar los botones de navegación y reintento', () => {
		render(
			<MemoryRouter>
				<ServerError />
			</MemoryRouter>,
		);

		expect(
			screen.getByRole('button', { name: /Intentar de Nuevo/i }),
		).toBeDefined();
		expect(screen.getByText(/Inicio/i)).toBeDefined();
	});
});
