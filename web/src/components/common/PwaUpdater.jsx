import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

export default function PwaUpdater() {
	const location = useLocation();
	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegistered(r) {
			console.log('SW Registered');
			// Verificar actualizaciones cada 30 minutos
			if (r) {
				setInterval(() => {
					r.update();
				}, 30 * 60 * 1000);
			}
		},
		onRegisterError(error) {
			console.log('SW registration error', error);
		},
	});

	// Aviso de PWA instalable/offline
	useEffect(() => {
		if (offlineReady) {
			toast.success('App lista para usar sin conexión.', {
				duration: 4000,
				position: 'bottom-center'
			});
			setOfflineReady(false);
		}
	}, [offlineReady, setOfflineReady]);

	// Lógica de actualización inteligente
	useEffect(() => {
		if (needRefresh) {
			const isBooking = location.pathname.includes('/booking');
			const isAdmin = location.pathname.startsWith('/admin');

			if (!isBooking) {
				// En Home o Admin: Actualizamos al instante
				toast('Actualizando Neverland con mejoras mágicas...', {
					icon: '✨',
					duration: 2500,
					style: {
						borderRadius: '16px',
						background: '#24635a',
						color: '#fff',
						fontWeight: 'bold'
					}
				});

				// Pequeño retraso para que lean el mensaje y luego refrescamos
				setTimeout(() => {
					updateServiceWorker(true);
				}, 2000);
			} else {
				// En reserva: No refrescamos para no borrar sus datos
				// Pero avisamos de forma sutil
				toast('Hay una nueva versión disponible. Se aplicará al terminar tu reserva.', {
					icon: '🚀',
					duration: 6000,
					position: 'bottom-center'
				});
			}
		}
	}, [needRefresh, location.pathname, updateServiceWorker]);

	return null;
}
