import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import BookingSuccess from './BookingSuccess';

describe('BookingSuccess Component', () => {
	const mockFormData = {
		fecha: '2026-05-15',
		cliente: {
			nombrePadre: 'Feli',
		},
		niños: { cantidad: 10 },
	};

	it('debería renderizar el nombre del cliente y la fecha formateada', () => {
		render(
			<BookingSuccess
				formData={mockFormData}
				createdId="NAV-12345"
				getExtendedTime={() => '17:00 - 19:30'}
			/>,
		);

		expect(screen.getByText(/¡Solicitud Enviada!/i)).toBeDefined();
		expect(screen.getByText(/Feli/i)).toBeDefined();
		expect(screen.getByText(/15\/05\/26/i)).toBeDefined(); // Formato safeDate
		expect(screen.getByText(/NAV-12345/i)).toBeDefined();
	});

	it('debería generar un enlace de WhatsApp con los parámetros correctos', () => {
		render(
			<BookingSuccess
				formData={mockFormData}
				createdId="NAV-12345"
				getExtendedTime={() => '17:00 - 19:30'}
			/>,
		);

		const whatsappLink = screen.getByRole('link', {
			name: /Avisar por WhatsApp/i,
		});
		const href = whatsappLink.getAttribute('href');

		expect(href).toContain('wa.me');
		expect(href).toContain('NAV-12345');
		expect(href).toContain('15%2F05%2F26'); // '/' encoded
	});

	it('debería manejar casos donde los datos de entrada son parciales', () => {
		// Probamos con un objeto vacío para asegurar que no hay crash (iOS crash prevention)
		render(<BookingSuccess formData={{}} createdId={null} />);

		expect(screen.getByText(/¡Solicitud Enviada!/i)).toBeDefined();
		expect(screen.getByText(/Cliente/i)).toBeDefined(); // Fallback name
	});

	// === TESTS DE COMPATIBILIDAD SAFARI ===

	it('(Safari) debería renderizar sin crash cuando getExtendedTime lanza error', () => {
		// En Safari, si getExtendedTime tiene un error interno, no debe crashear
		render(
			<BookingSuccess
				formData={mockFormData}
				createdId="NAV-99999"
				getExtendedTime={() => {
					throw new Error('Safari date error');
				}}
			/>,
		);

		expect(screen.getByText(/¡Solicitud Enviada!/i)).toBeDefined();
		expect(screen.getByText(/NAV-99999/i)).toBeDefined();
	});

	it('(Safari) debería renderizar sin crash cuando getExtendedTime no es una función', () => {
		render(
			<BookingSuccess
				formData={mockFormData}
				createdId="NAV-88888"
				getExtendedTime={null}
			/>,
		);

		expect(screen.getByText(/¡Solicitud Enviada!/i)).toBeDefined();
	});

	it('(Safari) debería renderizar sin crash con fecha en formato ISO con guiones', () => {
		const safariFormData = {
			fecha: '2026-02-27', // Formato que Safari no parsea bien con new Date()
			cliente: { nombrePadre: 'Safari User' },
		};

		render(
			<BookingSuccess
				formData={safariFormData}
				createdId="NAV-SAFARI"
				getExtendedTime={() => '18:00 - 20:00'}
			/>,
		);

		expect(screen.getByText(/¡Solicitud Enviada!/i)).toBeDefined();
		expect(screen.getByText(/Safari User/i)).toBeDefined();
		// La fecha debe formatearse correctamente
		expect(screen.getByText(/27\/02\/26/i)).toBeDefined();
	});

	it('debería usar CSS animation en vez de framer-motion', () => {
		const { container } = render(
			<BookingSuccess
				formData={mockFormData}
				createdId="NAV-12345"
				getExtendedTime={() => '17:00 - 19:30'}
			/>,
		);

		// Verificar que existe el keyframe de CSS
		const styleTag = container.querySelector('style');
		expect(styleTag).toBeDefined();
		expect(styleTag.textContent).toContain('successBounce');
	});
});
