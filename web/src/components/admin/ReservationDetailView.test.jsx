import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Estado compartido con los mocks. `vi.hoisted` es necesario porque las
// factories de `vi.mock` se evalúan antes que el cuerpo del módulo.
const estado = vi.hoisted(() => ({
	outlet: { config: null, setConfig: vi.fn() },
}));

vi.mock('react-router-dom', () => ({
	useNavigate: () => vi.fn(),
	useParams: () => ({ id: 'reserva-1' }),
	// Outlet estable (mismo objeto en cada render) para no provocar bucles en
	// los useEffect que dependen de `contextConfig`.
	useOutletContext: () => estado.outlet,
}));

vi.mock('../../services/api', () => ({
	getReservationById: vi.fn(),
	getPublicReservationById: vi.fn(),
	updateReservation: vi.fn(),
	deleteReservation: vi.fn(),
	getConfig: vi.fn().mockResolvedValue({ data: {} }),
	checkAvailability: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../common/GoogleCalendarButton', () => ({
	default: () => null,
}));

import ReservationDetailView from './ReservationDetailView';
import { updateReservation } from '../../services/api';
import { toast } from 'react-hot-toast';

const configConDatos = {
	menusNiños: [{ id: 1, nombre: 'Menú 1', precio: 9 }],
	preciosAdultos: [],
	workshops: [],
	characters: [],
	extrasCatalogo: [],
	datosBancarios: {
		iban: 'ES9121000418450200051332',
		titular: 'Neverland Cúllar Vega',
	},
};

const configSinDatos = {
	...configConDatos,
	datosBancarios: { iban: '', titular: '' },
};

const reservaBase = {
	id: 'reserva-1',
	publicId: 'NAV123',
	invitationId: null,
	tipo: 'reserva',
	estado: 'pendiente',
	fecha: '2027-06-15T00:00:00.000Z',
	turno: 'T1',
	precioTotal: 180,
	pagoReserva: false,
	pagoReservaFecha: null,
	googleEventId: null,
	notasAdmin: '',
	horario: {
		inicio: '17:00',
		fin: '19:00',
		extensionMinutos: 0,
		costoExtension: 0,
	},
	cliente: {
		nombreNiño: 'Leo',
		edadNiño: 7,
		nombrePadre: 'Ana',
		email: 'ana@example.com',
		telefono: '612345678',
		privacyPolicyConsent: true,
	},
	detalles: {
		niños: {
			cantidad: 12,
			menuId: 'menu-1',
			menuNombre: 'Menú 1',
			precioApplied: 9,
		},
		adultos: { cantidad: 1, comida: [] },
		extras: {
			talleres: [],
			personajes: [],
			pinata: false,
			catalogoItemIds: [],
			observaciones: '',
			alergenos: '',
			costoExtra: 0,
			precioCatalogoApplied: 0,
		},
	},
};

// `isAdmin` se calcula con useMemo([]): depende del pathname y del token en
// el momento del MONTAJE, así que hay que fijar el entorno ANTES de render.
const renderAdmin = (reserva = reservaBase) => {
	window.history.pushState({}, '', '/admin/evento/reserva-1');
	localStorage.setItem('token', 'test-token');
	return render(<ReservationDetailView reservation={reserva} />);
};

const renderVisitante = (reserva = reservaBase) => {
	window.history.pushState({}, '', '/mi-reserva/reserva-1');
	localStorage.removeItem('token');
	return render(<ReservationDetailView reservation={reserva} />);
};

let openSpy;

beforeEach(() => {
	vi.clearAllMocks();
	estado.outlet = { config: configConDatos, setConfig: vi.fn() };
	updateReservation.mockImplementation(async (id, body) => ({
		data: { ...reservaBase, ...body },
	}));
	openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
});

afterEach(() => {
	openSpy.mockRestore();
	localStorage.clear();
	window.history.replaceState({}, '', '/');
});

describe('ReservationDetailView — estado de pago de la señal (pagoReserva)', () => {
	describe('Indicador en el header', () => {
		it('admin: el switch clásico refleja aria-checked=false cuando no está pagada', () => {
			renderAdmin({ ...reservaBase, pagoReserva: false });

			const sw = screen.getByRole('switch');
			expect(sw.getAttribute('aria-checked')).toBe('false');
			expect(sw.tagName).toBe('BUTTON');
		});

		it('admin: el switch clásico refleja aria-checked=true cuando está pagada', () => {
			renderAdmin({ ...reservaBase, pagoReserva: true });

			expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
				'true',
			);
		});

		it('admin: el switch está a la izquierda del badge de estado', () => {
			renderAdmin({ ...reservaBase, pagoReserva: false });

			const sw = screen.getByRole('switch');
			const badge = screen.getByRole('img', { name: 'Señal de reserva no pagada' });

			// El badge va DESPUÉS del switch en el orden del DOM.
			expect(
				sw.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING,
			).toBeTruthy();
		});

		it('admin: el badge muestra el texto Pagada/Sin pagar con su icono', () => {
			renderAdmin({ ...reservaBase, pagoReserva: true });

			const badge = screen.getByRole('img', { name: 'Señal de reserva pagada' });
			expect(badge.textContent).toMatch(/Pagada/);
		});

		it('visitante: NO ve el switch; solo el badge informativo (sin botón de datos bancarios)', () => {
			renderVisitante({ ...reservaBase, pagoReserva: false });

			expect(screen.queryByRole('switch')).toBeNull();
			expect(
				screen.getByRole('img', { name: 'Señal de reserva no pagada' }),
			).toBeDefined();
			expect(screen.queryByTitle(/datos bancarios/i)).toBeNull();
		});

		it('visitante: el badge indica "pagada" cuando la reserva está pagada', () => {
			renderVisitante({ ...reservaBase, pagoReserva: true });

			expect(
				screen.getByRole('img', { name: 'Señal de reserva pagada' }),
			).toBeDefined();
		});
	});

	describe('Modal de confirmación y PATCH', () => {
		it('admin: pulsar el switch abre el modal y NO hace PATCH hasta confirmar', async () => {
			renderAdmin({ ...reservaBase, pagoReserva: false });

			fireEvent.click(screen.getByRole('switch'));

			expect(screen.getByText('¿Marcar como pagado?')).toBeDefined();
			expect(updateReservation).not.toHaveBeenCalled();

			fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

			await waitFor(() =>
				expect(updateReservation).toHaveBeenCalledWith('reserva-1', {
					pagoReserva: true,
				}),
			);
			await waitFor(() =>
				expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
					'true',
				),
			);
			expect(toast.success).toHaveBeenCalled();
		});

		it('admin: desmarcar el pago pide confirmación ("¿Marcar como no pagado?")', async () => {
			renderAdmin({ ...reservaBase, pagoReserva: true });

			fireEvent.click(screen.getByRole('switch'));

			expect(screen.getByText('¿Marcar como no pagado?')).toBeDefined();
			expect(updateReservation).not.toHaveBeenCalled();

			fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

			await waitFor(() =>
				expect(updateReservation).toHaveBeenCalledWith('reserva-1', {
					pagoReserva: false,
				}),
			);
		});

		it('admin: cancelar el modal NO hace ningún PATCH', () => {
			renderAdmin({ ...reservaBase, pagoReserva: false });

			fireEvent.click(screen.getByRole('switch'));
			fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

			expect(updateReservation).not.toHaveBeenCalled();
			expect(screen.queryByText('¿Marcar como pagado?')).toBeNull();
		});
	});

	describe('Botón de WhatsApp con datos bancarios', () => {
		it('abre wa.me con importe, concepto (nombre + fecha) e IBAN', () => {
			renderAdmin({ ...reservaBase, pagoReserva: false });

			fireEvent.click(
				screen.getByTitle(/Enviar al cliente los datos bancarios/i),
			);

			expect(openSpy).toHaveBeenCalledTimes(1);
			const url = openSpy.mock.calls[0][0];
			expect(url).toContain('https://wa.me/612345678');
			const mensaje = decodeURIComponent(url.split('?text=')[1]);
			expect(mensaje).toContain('Importe: 50€');
			// El concepto se construye con el nombre del niño y la fecha de la
			// reserva (DD/MM/YY, formato de safeDate): "Leo 15/06/27".
			expect(mensaje).toContain('Concepto de la transferencia: "Leo 15/06/27"');
			expect(mensaje).toContain('ES9121000418450200051332');
			expect(mensaje).toContain('Neverland Cúllar Vega');
		});

		it('el concepto usa el nombre del niño y la fecha REAL de la reserva', () => {
			renderAdmin({
				...reservaBase,
				cliente: { ...reservaBase.cliente, nombreNiño: 'Dino' },
				fecha: '2027-09-15T00:00:00.000Z',
				pagoReserva: false,
			});

			fireEvent.click(
				screen.getByTitle(/Enviar al cliente los datos bancarios/i),
			);

			const mensaje = decodeURIComponent(openSpy.mock.calls[0][0].split('?text=')[1]);
			expect(mensaje).toContain('"Dino 15/09/27"');
		});

		it('el concepto NO usa el publicId ni un prefijo configurable', () => {
			renderAdmin({ ...reservaBase, pagoReserva: false });

			fireEvent.click(
				screen.getByTitle(/Enviar al cliente los datos bancarios/i),
			);

			const mensaje = decodeURIComponent(openSpy.mock.calls[0][0].split('?text=')[1]);
			expect(mensaje).not.toContain('NAV123');
			expect(mensaje).not.toContain('NEVERLAND ');
		});

		it('usa el precioTotal si es menor que 50€', () => {
			renderAdmin({ ...reservaBase, precioTotal: 30 });

			fireEvent.click(
				screen.getByTitle(/Enviar al cliente los datos bancarios/i),
			);

			const mensaje = decodeURIComponent(openSpy.mock.calls[0][0].split('?text=')[1]);
			expect(mensaje).toContain('Importe: 30€');
		});

		it('sin datos bancarios en Config: toast explicativo y NO abre WhatsApp', () => {
			estado.outlet = { config: configSinDatos, setConfig: vi.fn() };
			renderAdmin({ ...reservaBase, pagoReserva: false });

			fireEvent.click(
				screen.getByTitle(/Enviar al cliente los datos bancarios/i),
			);

			expect(openSpy).not.toHaveBeenCalled();
			expect(toast.error).toHaveBeenCalledWith(
				expect.stringMatching(/datos bancarios/i),
			);
		});

		it('reserva sin importe (precioTotal 0): NO envía nada', () => {
			renderAdmin({ ...reservaBase, precioTotal: 0 });

			fireEvent.click(
				screen.getByTitle(/Enviar al cliente los datos bancarios/i),
			);

			expect(openSpy).not.toHaveBeenCalled();
			expect(toast.error).toHaveBeenCalledWith(
				expect.stringMatching(/importe/i),
			);
		});
	});
});
