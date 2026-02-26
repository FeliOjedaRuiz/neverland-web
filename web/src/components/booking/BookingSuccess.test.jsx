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
});
