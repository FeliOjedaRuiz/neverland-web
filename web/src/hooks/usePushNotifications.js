import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

/**
 * Convierte una VAPID public key en formato base64url a Uint8Array.
 * Necesario para la API de PushManager.
 * @param {string} base64String
 * @returns {Uint8Array}
 */
const urlBase64ToUint8Array = (base64String) => {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
};

/**
 * Hook para gestionar las suscripciones push del administrador.
 * 
 * @returns {{ isSupported, isSubscribed, isLoading, subscribe, unsubscribe }}
 */
const usePushNotifications = () => {
	const [isSupported, setIsSupported] = useState(false);
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// Verificar soporte y estado actual al montar
	useEffect(() => {
		const checkSupport = async () => {
			const supported =
				'serviceWorker' in navigator &&
				'PushManager' in window &&
				'Notification' in window;

			setIsSupported(supported);

			if (!supported) return;

			try {
				const registration = await navigator.serviceWorker.ready;
				const existing = await registration.pushManager.getSubscription();
				setIsSubscribed(!!existing);
			} catch (err) {
				console.warn('[Push] No se pudo verificar la suscripción:', err.message);
			}
		};

		checkSupport();
	}, []);

	/**
	 * Pide permiso al usuario y suscribe el dispositivo a las notificaciones push.
	 */
	const subscribe = useCallback(async () => {
		setIsLoading(true);
		try {
			// 1. Pedir permiso
			const permission = await Notification.requestPermission();
			if (permission !== 'granted') {
				toast.error('Permiso para notificaciones denegado.');
				console.warn('[Push] Permiso denegado por el usuario.');
				setIsLoading(false);
				return;
			}

			// 2. Obtener VAPID public key del backend
			let data;
			try {
				const response = await api.get('/push/public-key');
				data = response.data;
			} catch (error) {
				console.error('[Push] Fetch public key error:', error);
				// Check for 404 specifically since it happens if the backend isn't updated
				if (error.response?.status === 404) {
					throw new Error('El backend de notificaciones no está disponible (ruta no encontrada). Por favor, asegúrate de haber desplegado el servidor.');
				}
				throw new Error('Error de conexión al obtener la clave pública.');
			}
			
			const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

			// 3. Suscribirse vía Service Worker
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey,
			});

			// 4. Enviar la suscripción al backend para guardarla
			await api.post('/push/subscribe', subscription.toJSON());
			setIsSubscribed(true);
			toast.success('Notificaciones activadas con éxito.');
			console.log('[Push] Suscripción guardada correctamente.');
		} catch (err) {
			console.error('[Push] Error al suscribirse:', err.message);
			toast.error(`Error al activar notificaciones: ${err.message}`);
		} finally {
			setIsLoading(false);
		}
	}, []);

	/**
	 * Cancela la suscripción del dispositivo actual.
	 */
	const unsubscribe = useCallback(async () => {
		setIsLoading(true);
		try {
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.getSubscription();

			if (subscription) {
				// Notificar al backend primero
				await api.delete('/push/unsubscribe', {
					data: { endpoint: subscription.endpoint },
				});
				// Luego cancelar en el navegador
				await subscription.unsubscribe();
				setIsSubscribed(false);
				toast.success('Notificaciones desactivadas.');
				console.log('[Push] Suscripción cancelada.');
			}
		} catch (err) {
			console.error('[Push] Error al cancelar suscripción:', err.message);
			toast.error('Error al desactivar notificaciones.');
		} finally {
			setIsLoading(false);
		}
	}, []);

	return { isSupported, isSubscribed, isLoading, subscribe, unsubscribe };
};

export default usePushNotifications;
