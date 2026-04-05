import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

export default function PwaUpdater() {
	const location = useLocation();
	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh],
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

	// Lógica de actualización única y limpia
	useEffect(() => {
		if (!needRefresh) return;

		const isProtectedArea = location.pathname.includes('/booking') || location.pathname.startsWith('/admin');

		// Limpiamos cualquier toast previo para evitar duplicados
		toast.dismiss();

		if (!isProtectedArea) {
			// En Home: Actualización silenciosa/rápida con aviso elegante
			toast('✨ Actualizando Neverland con mejoras mágicas...', {
				duration: 3000,
				style: { borderRadius: '16px', background: '#24635a', color: '#fff' }
			});
			setTimeout(() => updateServiceWorker(true), 2000);
		} else {
			// En Admin/Booking: Botón manual para no interrumpir
			toast((t) => (
				<div className="flex items-center gap-4">
					<span className="text-sm font-medium">🚀 Nueva versión disponible</span>
					<button 
						onClick={() => {
							toast.dismiss(t.id);
							updateServiceWorker(true);
						}}
						className="bg-neverland-green text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md"
					>
						ACTUALIZAR
					</button>
				</div>
			), { duration: Infinity, position: 'bottom-center' });
		}
	}, [needRefresh, location.pathname, updateServiceWorker]);

	return null;
}
