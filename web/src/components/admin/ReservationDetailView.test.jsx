import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExtrasEdit } from './ReservationDetailView';

// Mock de react-hot-toast: el componente lo usa para avisar del límite de 3 personajes.
vi.mock('react-hot-toast', () => ({
	toast: vi.fn(),
	default: vi.fn(),
}));

const CONFIG = {
	characters: [
		{ id: '1', nombre: 'Pirata', name: 'Pirata' },
		{ id: '2', nombre: 'Maga', name: 'Maga' },
		{ id: '3', nombre: 'Princesa', name: 'Princesa' },
	],
	preciosExtras: { personaje: 40, precioPack3Personajes: 100 },
	extrasCatalogo: [],
	workshops: [],
};

describe('ExtrasEdit — gestión de personajes', () => {
	it('renderiza el modal de personajes sin lanzar ReferenceError', () => {
		expect(() =>
			render(
				<ExtrasEdit
					current={{ personajes: ['Pirata'], precioPersonajeApplied: 40 }}
					ninosCantidad={1}
					config={CONFIG}
					onCancel={() => {}}
					onSave={() => {}}
				/>,
			),
		).not.toThrow();
	});

	it('muestra el precio anterior cuando se añade un personaje a una reserva ya solicitada', () => {
		render(
			<ExtrasEdit
				current={{ personajes: ['Pirata'], precioPersonajeApplied: 40 }}
				ninosCantidad={1}
				config={CONFIG}
				onCancel={() => {}}
				onSave={() => {}}
			/>,
		);

		// Abrir el selector de personajes y añadir un segundo personaje.
		fireEvent.click(screen.getByText(/Pulsa para cambiar personajes/i));
		fireEvent.click(screen.getByText('Maga'));

		// El snapshot original (40€) debe seguir visible: la reserva ya tenía
		// personajes y el precio cobrado se muestra como referencia.
		expect(screen.getByText(/Antes:/i)).toBeInTheDocument();
		expect(screen.getByText(/Antes:\s*40€/i)).toBeInTheDocument();
	});

	it('permite quitar un personaje y recalcula el precio dinámico', () => {
		render(
			<ExtrasEdit
				current={{ personajes: ['Pirata', 'Maga'], precioPersonajeApplied: 80 }}
				ninosCantidad={1}
				config={CONFIG}
				onCancel={() => {}}
				onSave={() => {}}
			/>,
		);

		// Quitar "Maga" del chip seleccionado: el botón X es hermano del <span>Maga</span>.
		const magaChip = screen.getByText('Maga').closest('div');
		fireEvent.click(magaChip.querySelector('button'));

		// Tras quitar un personaje el precio dinámico pasa a 1 x 40€.
		expect(
			screen.getByText((_, el) => el?.textContent?.replace(/\s+/g, '') === '1×40€=40€'),
		).toBeInTheDocument();
	});
});
