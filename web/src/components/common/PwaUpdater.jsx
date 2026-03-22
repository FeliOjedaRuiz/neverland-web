import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import toast from 'react-hot-toast';

export default function PwaUpdater() {
	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegistered(r) {
			console.log('SW Registered: ' + r);
		},
		onRegisterError(error) {
			console.log('SW registration error', error);
		},
	});

	// Aviso de PWA instalada y lista para offline
	useEffect(() => {
		if (offlineReady) {
			toast.success('App instalada: lista para uso sin conexión.', {
				duration: 4000,
			});
			setOfflineReady(false);
		}
	}, [offlineReady, setOfflineReady]);

	// Aviso de actualización disponible
	useEffect(() => {
		if (needRefresh) {
			toast(
				(t) => (
					<div className="flex flex-col gap-3">
						<p className="text-sm font-medium text-text-black">
							¡Hay una nueva versión de Neverland disponible!
						</p>
						<div className="flex gap-2 justify-end">
							<button
								className="text-xs px-3 py-2 rounded-full border border-neverland-green text-neverland-green hover:bg-neverland-green/10 transition-colors font-bold"
								onClick={() => {
									toast.dismiss(t.id);
									setNeedRefresh(false);
								}}
							>
								Ignorar
							</button>
							<button
								className="text-xs px-3 py-2 rounded-full bg-energy-orange text-white font-bold hover:bg-orange-600 transition-colors shadow-sm"
								onClick={() => {
									toast.dismiss(t.id);
									updateServiceWorker(true);
								}}
							>
								Actualizar Ahora
							</button>
						</div>
					</div>
				),
				{
					duration: Infinity,
					style: {
						border: '2px solid #6BBCA3',
						background: '#fff9f0',
						padding: '16px',
					},
					icon: '✨',
				}
			);
		}
	}, [needRefresh, setNeedRefresh, updateServiceWorker]);

	return null;
}
