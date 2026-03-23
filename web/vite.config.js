
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['neverland_logo.svg', 'pwa-icon.svg'],
			manifest: {
				name: 'Neverland - Parque Infantil',
				short_name: 'Neverland',
				description: 'Donde los sueños se hacen realidad y la diversión nunca termina.',
				theme_color: '#24635a',
				background_color: '#fdebd0',
				display: 'standalone',
				start_url: '/?pwa=1',
				shortcuts: [
					{
						name: 'Reservar un Evento',
						short_name: 'Reservar',
						description: 'Hacer una reserva directamente',
						url: '/booking',
						icons: [{ src: 'pwa-icon.svg', sizes: '192x192' }],
					},
				],
				icons: [
					{
						src: 'pwa-icon.svg',
						sizes: '192x192',
						type: 'image/svg+xml',
					},
					{
						src: 'pwa-icon.svg',
						sizes: '512x512',
						type: 'image/svg+xml',
					},
					{
						src: 'pwa-icon.svg',
						sizes: '512x512',
						type: 'image/svg+xml',
						purpose: 'any maskable',
					},
				],
			},
		}),
	],
	test: {
		environment: 'jsdom',
		setupFiles: './src/setupTests.js',
		globals: true,
		deps: {
			inline: ['whatwg-fetch'],
		},
	},
});
