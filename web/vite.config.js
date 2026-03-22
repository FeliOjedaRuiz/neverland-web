
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: 'prompt',
			includeAssets: ['neverland_logo.svg'],
			manifest: {
				name: 'Neverland - Parque Infantil',
				short_name: 'Neverland',
				description: 'Donde los sueños se hacen realidad y la diversión nunca termina.',
				theme_color: '#24635a',
				background_color: '#fdebd0',
				display: 'standalone',
				icons: [
					{
						src: 'neverland_logo.svg',
						sizes: '192x192',
						type: 'image/svg+xml',
					},
					{
						src: 'neverland_logo.svg',
						sizes: '512x512',
						type: 'image/svg+xml',
					},
					{
						src: 'neverland_logo.svg',
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
