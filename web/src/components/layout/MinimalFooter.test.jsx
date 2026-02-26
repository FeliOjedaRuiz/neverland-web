import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MinimalFooter from './MinimalFooter';

describe('MinimalFooter Component', () => {
	it('Debería renderizar el logo y los textos básicos', () => {
		// Renderizamos el componente virtualmente en jsdom
		render(<MinimalFooter />);

		// Comprobamos que el logo exista utilizando el texto alternativo
		const logoImg = screen.getByAltText(/Neverland Logo/i);
		expect(logoImg).toBeInTheDocument();

		// Comprobamos que el año/texto legal de copyright se muestre
		const copyrightText = screen.getByText(/2026 Neverland/i);
		expect(copyrightText).toBeInTheDocument();
	});

	it('Debería contener enlaces a las políticas legales', () => {
		render(<MinimalFooter />);

		// Verificamos existencia de enlaces clave
		expect(screen.getByText('Aviso Legal')).toHaveAttribute('href', '#');
		expect(screen.getByText('Privacidad')).toHaveAttribute('href', '#');
		expect(screen.getByText('Cookies')).toHaveAttribute('href', '#');
	});
});
