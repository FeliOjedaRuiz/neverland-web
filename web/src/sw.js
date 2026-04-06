/* eslint-disable no-undef */
/**
 * Service Worker Custom de Neverland
 * Estrategia: injectManifest — Workbox inyecta el precache manifest aquí,
 * y nosotros añadimos los listeners custom de Push y NotificationClick.
 */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

// 1. Precache de assets estáticos (inyectado por Vite PWA en build)
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// 2. Estrategias de caché
// Google Fonts — Cache First (cambian raramente)
registerRoute(
	({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
	new CacheFirst({ cacheName: 'google-fonts', plugins: [] })
);

// API calls — Network First (datos dinámicos, con fallback a caché)
registerRoute(
	({ url }) => url.pathname.startsWith('/api/'),
	new NetworkFirst({ cacheName: 'api-cache' })
);

// Assets de Cloudinary — Stale While Revalidate
registerRoute(
	({ url }) => url.origin === 'https://res.cloudinary.com',
	new StaleWhileRevalidate({ cacheName: 'cloudinary-images' })
);

// 3. Push Notifications — Listener para mostrar la notificación
self.addEventListener('push', (event) => {
	console.log('[SW] Evento Push recibido:', event);
	if (!event.data) {
		console.warn('[SW] Evento Push sin datos.');
		return;
	}

	let data;
	try {
		data = event.data.json();
		console.log('[SW] Datos del Push (JSON):', data);
	} catch (err) {
		const text = event.data.text();
		console.log('[SW] Datos del Push (Texto):', text);
		data = {
			title: 'Neverland',
			body: text,
			icon: '/apple-touch-icon.png',
			badge: '/apple-touch-icon.png',
			data: { url: '/admin' },
		};
	}

	const options = {
		body: data.body,
		icon: data.icon || '/apple-touch-icon.png',
		badge: data.badge || '/apple-touch-icon.png',
		data: data.data || {},
		vibrate: [200, 100, 200],
		requireInteraction: true, // Forzamos para que no se oculte sola en Windows
	};

	console.log('[SW] Intentando mostrar notificación con opciones:', options);

	event.waitUntil(
		self.registration.showNotification(data.title, options)
			.then(() => console.log('[SW] Notificación mostrada con éxito.'))
			.catch(err => console.error('[SW] Error al mostrar notificación:', err))
	);
});

// Listener para mensajes y actualizaciones del SW
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
	
	if (event.data && event.data.type === 'TEST_VISUAL') {
		console.log('[SW] Mensaje de test visual recibido.');
		self.registration.showNotification('¡TEST VISUAL!', {
			body: 'Si lees esto, las notificaciones funcionan en Windows/Chrome.',
			icon: '/apple-touch-icon.png',
			vibrate: [200, 100, 200],
			requireInteraction: true
		});
	}
});

// 4. Notification Click — Navegar al detalle del evento al clicar
self.addEventListener('notificationclick', (event) => {
	event.notification.close();

	const targetUrl = event.notification.data?.url || '/admin';

	event.waitUntil(
		clients
			.matchAll({ type: 'window', includeUncontrolled: true })
			.then((clientList) => {
				// Si ya hay una pestaña abierta con la app, la enfocamos y navegamos
				for (const client of clientList) {
					if ('focus' in client && client.url.includes(self.location.origin)) {
						client.focus();
						return client.navigate(targetUrl);
					}
				}
				// Si no hay ninguna pestaña abierta, abrimos una nueva
				if (clients.openWindow) {
					return clients.openWindow(targetUrl);
				}
			})
	);
});
