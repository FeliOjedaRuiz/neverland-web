import React, { useState, useEffect } from 'react';
import { Download, MonitorSmartphone, Share } from 'lucide-react';
import toast from 'react-hot-toast';

let globalDeferredPrompt = null;
let globalIsVisible = false;
const listeners = new Set();

if (typeof window !== 'undefined') {
	window.addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault();
		globalDeferredPrompt = e;
		globalIsVisible = true;
		listeners.forEach((listener) => listener(true, e));
	});

	window.addEventListener('appinstalled', () => {
		globalDeferredPrompt = null;
		globalIsVisible = false;
		listeners.forEach((listener) => listener(false, null));
	});
}

export default function InstallPwaPrompt({ className = '', variant = 'button' }) {
	const isIosDevice = typeof window !== 'undefined' && /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
	const isStandalone = typeof window !== 'undefined' && (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches);
	const showIosPrompt = isIosDevice && !isStandalone;

	const [deferredPrompt, setDeferredPrompt] = useState(globalDeferredPrompt);
	const [isVisible, setIsVisible] = useState(showIosPrompt || globalIsVisible);
	const [isIos] = useState(showIosPrompt);

	useEffect(() => {
		const handleStateChange = (visible, prompt) => {
			setIsVisible(visible || showIosPrompt);
			setDeferredPrompt(prompt);
		};

		listeners.add(handleStateChange);
		// Sincronizar inmediatamente por si cambió justo antes del mount
		handleStateChange(globalIsVisible, globalDeferredPrompt);

		return () => {
			listeners.delete(handleStateChange);
		};
	}, [showIosPrompt]);

	const handleInstallClick = async () => {
		if (isIos) {
			toast((t) => (
				<div className="flex flex-col gap-2 p-1">
					<p className="text-sm font-medium mb-1">Para instalar en iOS:</p>
					<div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
						<span>1. Toca en el botón Compartir</span>
						<Share size={16} className="text-blue-500" />
					</div>
					<div className="flex items-center gap-2 text-sm text-gray-600">
						<span>2. Selecciona "Añadir a la pantalla de inicio"</span>
					</div>
					<button 
						onClick={() => toast.dismiss(t.id)} 
						className="mt-3 bg-neverland-green text-white py-1 rounded w-full text-xs font-bold"
					>
						Entendido
					</button>
				</div>
			), { duration: Infinity, position: 'bottom-center' });
			return;
		}

		if (!deferredPrompt) return;
		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === 'accepted') {
			globalIsVisible = false;
			setIsVisible(false);
		}
		globalDeferredPrompt = null;
		setDeferredPrompt(null);
	};

	if (!isVisible) return null;

	if (variant === 'icon') {
		return (
			<button
				onClick={handleInstallClick}
				className={`text-neverland-green hover:text-energy-orange transition-colors flex items-center justify-center ${className}`}
				aria-label="Instalar Aplicación"
				title="Instalar App de Neverland"
			>
				<MonitorSmartphone size={24} />
			</button>
		);
	}

	return (
		<button
			onClick={handleInstallClick}
			className={`flex items-center justify-center gap-2 bg-energy-orange text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm font-display ${className}`}
		>
			<Download size={18} />
			<span>{isIos ? 'Cómo Instalar (iOS)' : 'Instalar App'}</span>
		</button>
	);
}
