import React from 'react';
import logo from '../../assets/neverland_logo.svg';

const MinimalFooter = () => {
	return (
		<footer className="bg-white border-t border-gray-100 py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
				<div className="flex items-center gap-4">
					<img
						src={logo}
						alt="Neverland Logo"
						className="h-8 w-auto opacity-50"
					/>
					<span className="text-gray-400 text-xs font-sans">
						© 2026 Neverland Cullar Vega.
					</span>
				</div>
				<div className="flex gap-6 text-gray-400 text-xs font-display font-medium">
					<a href="#" className="hover:text-neverland-green transition-colors">
						Aviso Legal
					</a>
					<a href="#" className="hover:text-neverland-green transition-colors">
						Privacidad
					</a>
					<a href="#" className="hover:text-neverland-green transition-colors">
						Cookies
					</a>
				</div>
			</div>
		</footer>
	);
};

export default MinimalFooter;
