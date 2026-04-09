
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: 'prompt',
			strategies: 'injectManifest',
			srcDir: 'src',
			filename: 'sw.js',
			injectManifest: {
				injectionPoint: 'self.__WB_MANIFEST',
			},
			devOptions: {
				enabled: false,
				type: 'module',
			},
			includeAssets: ['neverland_logo.svg', 'pwa-icon.svg', 'apple-touch-icon.png', 'images/Portada-PWA.png'],
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
						icons: [{ src: 'images/Portada-PWA.png', sizes: '192x192', type: 'image/png' }],
					},
				],
				icons: [
					{
						src: 'pwa-icon.svg',
						sizes: 'any',
						type: 'image/svg+xml',
					},
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
				screenshots: [
					{
						src: 'images/Portada-PWA.png',
						sizes: '1080x1080',
						type: 'image/png',
						form_factor: 'wide',
						label: 'Neverland - Donde los sueños se hacen realidad'
					},
					{
						src: 'images/Portada-PWA.png',
						sizes: '1080x1080',
						type: 'image/png',
						form_factor: 'narrow',
						label: 'Neverland - Parque Infantil'
					}
				],
			},
		}),
	],
	server: {
		host: true,
		proxy: {
			'/api/v1': {
				target: 'http://localhost:8080',
				changeOrigin: true,
			},
		},
	},
	test: {
		environment: 'jsdom',
		setupFiles: './src/setupTests.js',
		globals: true,
		deps: {
			inline: ['whatwg-fetch'],
		},
	},
});
