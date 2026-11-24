import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ReservationDetailView from './ReservationDetailView';

vi.mock('react-hot-toast', () => ({
	toast: vi.fn(),
	default: vi.fn(),
}));

const updateReservation = vi.fn();
const getReservationById = vi.fn();
const getPublicReservationById = vi.fn();

vi.mock('../../services/api', () => ({
	getReservationById: (...args) => getReservationById(...args),
	getPublicReservationById: (...args) => getPublicReservationById(...args),
	updateReservation: (...args) => updateReservation(...args),
	deleteReservation: vi.fn(),
	getConfig: vi.fn(() => Promise.resolve({ data: CONFIG })),
	checkAvailability: vi.fn(() => Promise.resolve({ data: { occupied: [] } })),
}));

const RESERVATION = {
	id: '6b05f713f47f95782f50a9d5',
	estado: 'pendiente',
	fecha: '2026-12-31T00:00:00.000Z',
	turno: 'T3',
	precioTotal: 120,
	horario: { inicio: '11:00', fin: '15:00' },
	cliente: { nombreNiño: 'Prueba', nombrePadre: 'Feli', email: 'a@b.c', telefono: '600000000' },
	detalles: {
		ninos: { cantidad: 1 },
		adultos: [],
		extras: {
			personajes: ['Pirata'],
			precioPersonajeApplied: 40,
			talleres: [],
			catalogoItemIds: [],
			costoExtra: 0,
			observaciones: '',
		},
	},
};

const CONFIG = {
	characters: [
		{ id: '1', nombre: 'Pirata', name: 'Pirata' },
		{ id: '2', nombre: 'Maga', name: 'Maga' },
	],
	preciosExtras: { personaje: 40, precioPack3Personajes: 100 },
	extrasCatalogo: [],
	workshops: [],
};

function renderAdmin() {
	return render(
		<MemoryRouter initialEntries={['/admin/evento/6b05f713f47f95782f50a9d5']}>
			<Routes>
				<Route path="/admin/evento/:id" element={<ReservationDetailView />} />
			</Routes>
		</MemoryRouter>,
	);
}

describe('ReservationDetailView — flujo de agregar personaje en reserva solicitada', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.setItem('token', 'fake-token');
		// `isAdmin` se calcula con window.location.pathname, no con el router.
		window.history.pushState({}, '', '/admin/evento/6b05f713f47f95782f50a9d5');
		getReservationById.mockResolvedValue({ data: RESERVATION });
		getPublicReservationById.mockResolvedValue({ data: RESERVATION });
		updateReservation.mockResolvedValue({ data: RESERVATION });
	});

	it('abre el modal de extras, añade un personaje y guarda sin romper la vista', async () => {
		renderAdmin();

		// La vista carga la reserva del admin.
		await waitFor(() => expect(screen.getByText(/Extras y Actividades/i)).toBeInTheDocument());

		// Abrir el modal de extras con el botón "Editar" de esa sección.
		const extrasSection = screen.getByText(/Extras y Actividades/i).closest('section');
		fireEvent.click(
			within(extrasSection).getByRole('button', { name: /editar/i }),
		);

		// El modal de extras se abre.
		await waitFor(() =>
			expect(screen.getByText('Editar Extras y Actividades')).toBeInTheDocument(),
		);

		// Abrir el selector de personajes y añadir "Maga".
		fireEvent.click(
			screen.getByText((_, el) =>
				el?.tagName === 'P' && el.textContent?.includes('Pulsa para cambiar personajes'),
			),
		);
		fireEvent.click(screen.getByText('Maga'));

		// Se muestra el snapshot del precio original (la reserva ya tenía personajes).
		expect(screen.getByText(/Antes:\s*40€/i)).toBeInTheDocument();

		// Guardar: debe llamar a la API de actualización.
		fireEvent.click(screen.getByText(/Guardar Cambios/i));

		await waitFor(() => expect(updateReservation).toHaveBeenCalled());

		const [id, payload] = updateReservation.mock.calls[0];
		expect(id).toBe('6b05f713f47f95782f50a9d5');
		expect(payload.detalles.extras.personajes).toEqual(['Pirata', 'Maga']);

		// La vista sigue montada: no se ha sustituido por la pantalla de error.
		expect(screen.queryByText(/¡Algo se rompió!/i)).not.toBeInTheDocument();
	});
});
