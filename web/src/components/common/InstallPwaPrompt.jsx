import React, { useState, useEffect } from 'react';
import { Download, MonitorSmartphone } from 'lucide-react';

export default function InstallPwaPrompt({ className = '', variant = 'button' }) {
	const [deferredPrompt, setDeferredPrompt] = useState(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const handleBeforeInstallPrompt = (e) => {
			e.preventDefault();
			setDeferredPrompt(e);
			setIsVisible(true);
		};

		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

		window.addEventListener('appinstalled', () => {
			setIsVisible(false);
			setDeferredPrompt(null);
		});

		return () => {
			window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
		};
	}, []);

	const handleInstallClick = async () => {
		if (!deferredPrompt) return;
		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === 'accepted') {
			setIsVisible(false);
		}
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
			className={`flex items-center gap-2 bg-energy-orange text-white px-4 py-2 rounded-full font-bold hover:bg-orange-600 transition-colors shadow-sm ${className}`}
		>
			<Download size={18} />
			<span>Instalar App</span>
		</button>
	);
}
