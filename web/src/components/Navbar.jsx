import React from 'react';
import { Menu, X } from 'lucide-react';
import logo from '../assets/logo.svg';

const Navbar = () => {
	const [isOpen, setIsOpen] = React.useState(false);

	return (
		<nav className="bg-cream-bg/95 backdrop-blur-sm fixed w-full z-50 shadow-sm border-b border-neverland-green/10">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16 md:h-20 items-center">
					{/* Logo */}
					<div className="flex-shrink-0 flex items-center">
						<a href="#home">
							<img
								src={logo}
								alt="Neverland Logo"
								className="h-10 md:h-14 w-auto drop-shadow-sm hover:scale-105 transition-transform"
							/>
						</a>
					</div>

					{/* Desktop Menu */}
					<div className="hidden md:flex space-x-8 items-center">
						<a
							href="#home"
							className="text-text-black hover:text-neverland-green transition-colors font-medium"
						>
							Inicio
						</a>
						<a
							href="#packs"
							className="text-text-black hover:text-neverland-green transition-colors font-medium"
						>
							Packs
						</a>
						<a
							href="#menus"
							className="text-text-black hover:text-neverland-green transition-colors font-medium"
						>
							Menús
						</a>
						<a
							href="#talleres"
							className="text-text-black hover:text-neverland-green transition-colors font-medium"
						>
							Talleres
						</a>
						<a
							href="#faq"
							className="text-text-black hover:text-neverland-green transition-colors font-medium"
						>
							FAQ
						</a>
						<a
							href="#como-funciona"
							className="bg-energy-orange text-white px-5 py-2 rounded-full font-bold hover:bg-opacity-90 transition-transform hover:scale-105 shadow-md"
						>
							Reservar
						</a>
					</div>

					{/* Mobile menu button */}
					<div className="md:hidden">
						<button
							onClick={() => setIsOpen(!isOpen)}
							className="text-text-black hover:text-neverland-green focus:outline-none"
						>
							{isOpen ? <X size={28} /> : <Menu size={28} />}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile Menu */}
			{isOpen && (
				<div className="md:hidden bg-cream-bg border-t border-gray-100">
					<div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col items-center">
						<a
							href="#home"
							onClick={() => setIsOpen(false)}
							className="block px-3 py-2 text-text-black hover:text-neverland-green font-medium"
						>
							Inicio
						</a>
						<a
							href="#packs"
							onClick={() => setIsOpen(false)}
							className="block px-3 py-2 text-text-black hover:text-neverland-green font-medium"
						>
							Packs
						</a>
						<a
							href="#menus"
							onClick={() => setIsOpen(false)}
							className="block px-3 py-2 text-text-black hover:text-neverland-green font-medium"
						>
							Menús
						</a>
						<a
							href="#talleres"
							onClick={() => setIsOpen(false)}
							className="block px-3 py-2 text-text-black hover:text-neverland-green font-medium"
						>
							Talleres
						</a>
						<a
							href="#faq"
							onClick={() => setIsOpen(false)}
							className="block px-3 py-2 text-text-black hover:text-neverland-green font-medium"
						>
							FAQ
						</a>
						<a
							href="#como-funciona"
							onClick={() => setIsOpen(false)}
							className="mt-4 block w-full text-center bg-energy-orange text-white px-5 py-3 rounded-full font-bold shadow-md"
						>
							Reservar
						</a>
					</div>
				</div>
			)}
		</nav>
	);
};

export default Navbar;
