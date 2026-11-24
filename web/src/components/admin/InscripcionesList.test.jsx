import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('../../services/api', () => ({
	editarInscripcion: vi.fn(),
	eliminarInscripcion: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

import InscripcionesList from './InscripcionesList';
import { editarInscripcion } from '../../services/api';
import { toast } from 'react-hot-toast';

const inscBase = {
	_id: 'insc-1',
	nombreNiño: 'Dina',
	edadNiño: 6,
	nombreResponsable: 'Rosa',
	telefonoResponsable: '123456789',
	emailResponsable: 'rosa@example.com',
	pagoTaller: false,
};

const renderLista = (inscripciones = [inscBase], refresh) =>
	render(
		<InscripcionesList
			inscripciones={inscripciones}
			aforo={8}
			tallerId="taller-1"
			onRefresh={refresh || onRefresh}
		/>
	);

let onRefresh;

beforeEach(() => {
	vi.clearAllMocks();
	onRefresh = vi.fn();
	editarInscripcion.mockResolvedValue({ data: {} });
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('InscripcionesList — switch diminuto de pago del taller', () => {
	it('renderiza un role="switch" con aria-checked=false cuando no está pagada', () => {
		renderLista();

		const sw = screen.getByRole('switch');
		expect(sw).toBeDefined();
		expect(sw.getAttribute('aria-checked')).toBe('false');
		// Diminuto: más pequeño que el de reservas (h-5 w-9)
		const clases = sw.getAttribute('class');
		expect(clases).toContain('h-3.5');
		expect(clases).toContain('w-7');
		// Rojo = sin pagar
		expect(clases).toContain('bg-red-500');
	});

	it('refleja aria-checked=true cuando la inscripción viene marcada como pagada', () => {
		renderLista([{ ...inscBase, pagoTaller: true }]);

		const sw = screen.getByRole('switch');
		expect(sw.getAttribute('aria-checked')).toBe('true');
		expect(sw.getAttribute('class')).toContain('bg-neverland-green');
	});

	it('al pulsar, llama a la API con pagoTaller=true y cambia el estado (optimista)', async () => {
		renderLista();

		const sw = screen.getByRole('switch');
		fireEvent.click(sw);

		// Llama a la API con el toggle
		expect(editarInscripcion).toHaveBeenCalledWith('taller-1', 'insc-1', { pagoTaller: true });

		// Estado optimista: el aria-checked cambia de inmediato
		expect(sw.getAttribute('aria-checked')).toBe('true');

		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith('Inscripción marcada como pagada');
		});
		expect(onRefresh).toHaveBeenCalled();
	});

	it('al pulsar sobre una pagada, envía pagoTaller=false', async () => {
		renderLista([{ ...inscBase, pagoTaller: true }]);

		fireEvent.click(screen.getByRole('switch'));

		expect(editarInscripcion).toHaveBeenCalledWith('taller-1', 'insc-1', { pagoTaller: false });
		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith('Pago del taller marcado como pendiente');
		});
	});

	it('si la API falla, revierte el estado optimista y muestra toast de error', async () => {
		editarInscripcion.mockRejectedValue(new Error('500'));
		renderLista();

		const sw = screen.getByRole('switch');
		fireEvent.click(sw);

		// Optimista: primero cambia…
		expect(sw.getAttribute('aria-checked')).toBe('true');

		// …y al fallar vuelve al valor del servidor
		await waitFor(() => {
			expect(sw.getAttribute('aria-checked')).toBe('false');
		});
		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('Error al actualizar el estado de pago');
		});
		expect(onRefresh).not.toHaveBeenCalled();
	});

	it('las inscripciones legacy sin el campo pagoTaller se tratan como no pagadas', () => {
		const { _id, pagoTaller, ...legacy } = inscBase;
		renderLista([legacy]);

		const sw = screen.getByRole('switch');
		expect(sw.getAttribute('aria-checked')).toBe('false');
		expect(sw.getAttribute('class')).toContain('bg-red-500');
	});

	it('mantiene el enlace de WhatsApp del teléfono junto al switch', () => {
		renderLista();

		const enlace = screen.getByRole('link');
		expect(enlace.getAttribute('href')).toBe('https://wa.me/123456789');
		// El switch está en la MISMA fila que el teléfono
		expect(enlace.parentElement).toContain(swEl());
	});

	function swEl() {
		return screen.getByRole('switch');
	}
});
