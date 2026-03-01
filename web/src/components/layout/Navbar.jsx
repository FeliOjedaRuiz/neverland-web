import React from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/neverland_logo.svg';

const Navbar = () => {
	const [isOpen, setIsOpen] = React.useState(false);
	const location = useLocation();
	const isHome = location.pathname === '/';

	const getLink = (hash) => (isHome ? hash : `/${hash}`);

	const menuRef = React.useRef(null);
	const buttonRef = React.useRef(null);

	React.useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				isOpen &&
				menuRef.current &&
				!menuRef.current.contains(event.target) &&
				buttonRef.current &&
				!buttonRef.current.contains(event.target)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	return (
		<nav className="bg-cream-bg fixed w-full z-50 shadow-sm border-b border-neverland-green/10">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16 md:h-20 items-center">
					{/* Logo */}
					<div className="shrink-0 flex items-center">
						<Link to="/">
							<img
								src={logo}
								alt="Neverland Logo"
								className="h-10 md:h-14 w-auto drop-shadow-sm hover:scale-105 transition-transform"
							/>
						</Link>
					</div>

					{/* Desktop Menu */}
					<div className="hidden md:flex space-x-8 items-center">
						<Link
							to={getLink('#home')}
							className="text-text-black hover:text-neverland-green transition-colors font-display font-medium"
						>
							Inicio
						</Link>

						<Link
							to={getLink('#menus')}
							className="text-text-black hover:text-neverland-green transition-colors font-display font-medium"
						>
							Menús
						</Link>
						<Link
							to={getLink('#actividades')}
							className="text-text-black hover:text-neverland-green transition-colors font-display font-medium"
						>
							Actividades
						</Link>
						<Link
							to={getLink('#faq')}
							className="text-text-black hover:text-neverland-green transition-colors font-display font-medium"
						>
							FAQ
						</Link>
						<Link
							to="/admin/login"
							className="text-gray-500 hover:text-neverland-green transition-colors font-sans font-medium text-sm"
						>
							Acceso Admin
						</Link>
						<Link
							to="/booking"
							className="bg-energy-orange text-white px-5 py-2 rounded-full font-display font-bold hover:bg-[#E06D2E] transition-all hover:scale-105 shadow-md ml-4 active:scale-95"
						>
							Reservar
						</Link>
					</div>

					{/* Mobile menu button */}
					<div className="md:hidden">
						<button
							ref={buttonRef}
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
				<div
					ref={menuRef}
					className="md:hidden bg-cream-bg border-t border-gray-100 shadow-xl"
				>
					<div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col items-center">
						<Link
							to={getLink('#home')}
							onClick={() => setIsOpen(false)}
							className="block px-3 py-2 text-text-black hover:text-neverland-green font-medium"
						>
							Inicio
						</Link>

						<Link
							to={getLink('#menus')}
							onClick={() => setIsOpen(false)}
							className="block px-3 py-2 text-text-black hover:text-neverland-green font-medium"
						>
							Menús
						</Link>
						<Link
							to={getLink('#actividades')}
							onClick={() => setIsOpen(false)}
							className="block px-3 py-2 text-text-black hover:text-neverland-green font-medium"
						>
							Actividades
						</Link>
						<Link
							to={getLink('#faq')}
							onClick={() => setIsOpen(false)}
							className="block px-3 py-2 text-text-black hover:text-neverland-green font-medium"
						>
							FAQ
						</Link>
						<Link
							to="/booking"
							onClick={() => setIsOpen(false)}
							className="mt-4 block w-full text-center bg-energy-orange text-white px-5 py-3 rounded-full font-bold shadow-md"
						>
							Reservar
						</Link>
						<Link
							to="/admin/login"
							onClick={() => setIsOpen(false)}
							className="mt-2 block w-full text-center text-gray-400 hover:text-neverland-green py-2 text-sm font-medium"
						>
							Acceso Admin
						</Link>
					</div>
				</div>
			)}
		</nav>
	);
};

export default Navbar;
