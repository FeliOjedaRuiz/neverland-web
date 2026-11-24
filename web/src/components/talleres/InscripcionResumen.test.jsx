import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Estado compartido con los mocks. `vi.hoisted` es necesario porque las
// factories de `vi.mock` se evalúan antes que el cuerpo del módulo.
const estado = vi.hoisted(() => ({
	location: { state: null },
}));

vi.mock('react-router-dom', () => ({
	useLocation: () => estado.location,
	Link: ({ to, children, ...rest }) => (
		<a href={to} {...rest}>{children}</a>
	),
	Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
}));

vi.mock('../../services/api', () => ({
	getConfig: vi.fn(),
}));

// SEO usa react-helmet-async (HelmetProvider solo existe en main.jsx):
// se sustituye por un marcador para aislar el test del modal.
vi.mock('../common/SEO', () => ({
	default: ({ title }) => <div data-testid="seo" data-title={title} />,
}));

import InscripcionResumen from './InscripcionResumen';
import { getConfig } from '../../services/api';

const tallerBase = {
	id: 'taller-1',
	nombre: 'Pintacaras',
	descripcion: 'Pintacaras divertidas',
	precio: 30,
	aforo: 10,
	fecha: '2027-06-15T00:00:00.000Z',
	turnos: ['T1'],
	horario: { inicio: '10:00', fin: '12:00' },
};

const inscripcionBase = {
	nombreNiño: 'Dina',
	edadNiño: 6,
	nombreResponsable: 'Rosa',
	telefonoResponsable: '123456789',
	emailResponsable: 'rosa@example.com',
	privacyPolicyConsent: true,
};

const configConIban = {
	datosBancarios: {
		iban: 'ES9121000418450200051332',
		titular: 'Neverland Cúllar Vega',
	},
};

const configSinIban = {
	datosBancarios: { iban: '', titular: '' },
};

// El componente se renderiza SIEMPRE con location.state (como en la app real
// tras una inscripción exitosa); sin state hace Navigate a /talleres.
const renderConState = () => {
	estado.location = {
		state: { inscripcionData: inscripcionBase, taller: tallerBase },
	};
	return render(<InscripcionResumen />);
};

let openSpy;

beforeEach(() => {
	vi.clearAllMocks();
	// window.open no existe en jsdom de forma fiable: se espía por si acaso.
	openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
});

afterEach(() => {
	openSpy.mockRestore();
	estado.location = { state: null };
});

describe('InscripcionResumen — modal de aviso de pago del taller', () => {
	it('se abre automáticamente al renderizar tras la inscripción', async () => {
		getConfig.mockResolvedValue({ data: configConIban });
		renderConState();

		const dialog = screen.getByRole('dialog');
		expect(dialog).toBeDefined();
		expect(dialog.getAttribute('aria-modal')).toBe('true');
		expect(screen.getByText(/Confirma tu plaza/i)).toBeDefined();
	});

	it('muestra el importe total del taller', async () => {
		getConfig.mockResolvedValue({ data: configConIban });
		renderConState();

		// Aparece en la pantalla ("Precio 30€") y en el modal ("30€")
		expect(screen.getAllByText(/30€/).length).toBeGreaterThanOrEqual(1);
		expect(screen.getByText(/importe total del taller/i)).toBeDefined();
	});

	it('muestra el IBAN leído de Config', async () => {
		getConfig.mockResolvedValue({ data: configConIban });
		renderConState();

		await waitFor(() => {
			expect(screen.getByText('ES9121000418450200051332')).toBeDefined();
		});
		expect(getConfig).toHaveBeenCalledTimes(1);
	});

	it('muestra el concepto "<nombre del taller> <nombre del niño>"', async () => {
		getConfig.mockResolvedValue({ data: configConIban });
		renderConState();

		expect(screen.getByText(/"Pintacaras Dina"/)).toBeDefined();
	});

	it('el botón de WhatsApp apunta a wa.me/34651707985 con el mensaje pre-rellenado', async () => {
		getConfig.mockResolvedValue({ data: configConIban });
		renderConState();

		const enlace = screen.getByRole('link', { name: /Enviar comprobante por WhatsApp/i });
		const href = enlace.getAttribute('href');
		expect(href).toContain('https://wa.me/34651707985');
		expect(href).toContain('text=');
		// El mensaje pide el comprobante e incluye niño y taller
		const texto = decodeURIComponent(href);
		expect(texto).toContain('Dina');
		expect(texto).toContain('Pintacaras');
		expect(texto.toLowerCase()).toContain('comprobante');
	});

	describe('sin IBAN configurado en Config', () => {
		it('muestra el aviso de datos bancarios no disponibles y NO un IBAN vacío', async () => {
			getConfig.mockResolvedValue({ data: configSinIban });
			renderConState();

			await waitFor(() => {
				expect(
					screen.getByText(/Los datos bancarios no están disponibles en este momento/i)
				).toBeDefined();
			});
			// Sin IBAN vacío: no hay etiqueta "IBAN" ni valor en blanco
			expect(screen.queryByText(/^IBAN$/i)).toBeNull();
			expect(screen.queryByText('ES9121000418450200051332')).toBeNull();
		});

		it('aunque no haya IBAN, el enlace a WhatsApp sigue disponible', async () => {
			getConfig.mockResolvedValue({ data: configSinIban });
			renderConState();

			const enlace = await screen.findByRole('link', { name: /Enviar comprobante por WhatsApp/i });
			expect(enlace.getAttribute('href')).toContain('https://wa.me/34651707985');
		});

		it('si Config falla, también muestra el aviso (nunca un IBAN vacío)', async () => {
			getConfig.mockRejectedValue(new Error('red caída'));
			renderConState();

			await waitFor(() => {
				expect(
					screen.getByText(/Los datos bancarios no están disponibles en este momento/i)
				).toBeDefined();
			});
			expect(screen.queryByText(/^IBAN$/i)).toBeNull();
		});
	});

	describe('cierre del modal', () => {
		it('cierra con el botón "Entendido" y deja ver la pantalla de confirmación', async () => {
			getConfig.mockResolvedValue({ data: configConIban });
			renderConState();

			expect(screen.getByRole('dialog')).toBeDefined();
			fireEvent.click(screen.getByRole('button', { name: /Entendido/i }));

			expect(screen.queryByRole('dialog')).toBeNull();
			// El contenido de debajo NO se pierde: sigue visible
			expect(screen.getByText(/¡Inscripción confirmada!/i)).toBeDefined();
		});

		it('cierra con Escape (accesibilidad)', async () => {
			getConfig.mockResolvedValue({ data: configConIban });
			renderConState();

			expect(screen.getByRole('dialog')).toBeDefined();
			fireEvent.keyDown(document, { key: 'Escape' });

			expect(screen.queryByRole('dialog')).toBeNull();
			expect(screen.getByText(/¡Inscripción confirmada!/i)).toBeDefined();
		});

		it('el clic en el fondo cierra el modal (overlay)', async () => {
			getConfig.mockResolvedValue({ data: configConIban });
			renderConState();

			const dialog = screen.getByRole('dialog');
			// El overlay es el padre role="presentation"
			fireEvent.click(dialog.parentElement);

			expect(screen.queryByRole('dialog')).toBeNull();
		});
	});

	it('sin location.state navega a /talleres (comportamiento preexistente)', () => {
		estado.location = { state: null };
		render(<InscripcionResumen />);

		const nav = screen.getByTestId('navigate');
		expect(nav.getAttribute('data-to')).toBe('/talleres');
		// Y NO se abre el modal en el camino de la redirección
		expect(screen.queryByRole('dialog')).toBeNull();
	});
});
