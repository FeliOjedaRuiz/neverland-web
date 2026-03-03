import React from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/neverland_logo.svg';

import { motion, AnimatePresence } from 'framer-motion';

const NavLink = ({ hash, label, activeSection, isHome, getLink }) => {
	const id = hash.replace('#', '');
	const isActive = isHome && activeSection === id;

	return (
		<Link
			to={getLink(hash)}
			className={`relative text-text-black hover:text-neverland-green transition-colors font-display font-medium px-1 py-2 ${isActive ? 'text-neverland-green' : ''}`}
		>
			{label}
			{isActive && (
				<motion.div
					layoutId="activeUnderline"
					className="absolute bottom-0 left-0 right-0 h-0.5 bg-neverland-green rounded-full"
					initial={false}
					transition={{ type: 'spring', stiffness: 380, damping: 30 }}
				/>
			)}
		</Link>
	);
};

const Navbar = () => {
	const [isOpen, setIsOpen] = React.useState(false);
	const location = useLocation();
	const isHome = location.pathname === '/';

	const getLink = (hash) => (isHome ? hash : `/${hash}`);

	const menuRef = React.useRef(null);
	const buttonRef = React.useRef(null);
	const [activeSection, setActiveSection] = React.useState('home');
	const [isLoggedIn, setIsLoggedIn] = React.useState(
		!!localStorage.getItem('token'),
	);

	React.useEffect(() => {
		setIsLoggedIn(!!localStorage.getItem('token'));
	}, [location]);

	// Intersection Observer for active section tracking
	React.useEffect(() => {
		if (!isHome) return;

		const sections = [
			'home',
			'servicios',
			'instalaciones',
			'actividades',
			'menus',
			'faq',
		];
		const observerOptions = {
			root: null,
			rootMargin: '-40% 0px -40% 0px',
			threshold: 0,
		};

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					setActiveSection(entry.target.id);
				}
			});
		}, observerOptions);

		sections.forEach((id) => {
			const el = document.getElementById(id);
			if (el) observer.observe(el);
		});

		return () => observer.disconnect();
	}, [isHome]);

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

	// Animaciones simplificadas para mejor rendimiento
	const menuVariants = {
		hidden: { opacity: 0, y: -10 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.2, ease: 'easeOut' },
		},
		exit: {
			opacity: 0,
			y: -10,
			transition: { duration: 0.15, ease: 'easeIn' },
		},
	};

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
					<div className="hidden md:flex space-x-6 items-center">
						<NavLink
							hash="#home"
							label="Inicio"
							activeSection={activeSection}
							isHome={isHome}
							getLink={getLink}
						/>
						<NavLink
							hash="#servicios"
							label="Servicios"
							activeSection={activeSection}
							isHome={isHome}
							getLink={getLink}
						/>
						<NavLink
							hash="#instalaciones"
							label="Instalaciones"
							activeSection={activeSection}
							isHome={isHome}
							getLink={getLink}
						/>
						<NavLink
							hash="#actividades"
							label="Actividades"
							activeSection={activeSection}
							isHome={isHome}
							getLink={getLink}
						/>
						<NavLink
							hash="#menus"
							label="Menús"
							activeSection={activeSection}
							isHome={isHome}
							getLink={getLink}
						/>
						<NavLink
							hash="#faq"
							label="FAQ"
							activeSection={activeSection}
							isHome={isHome}
							getLink={getLink}
						/>

						<Link
							to={isLoggedIn ? '/admin' : '/admin/login'}
							className="text-gray-500 hover:text-neverland-green transition-colors font-sans font-medium text-sm ml-4"
						>
							{isLoggedIn ? 'Panel Control' : 'Acceso Admin'}
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
							<AnimatePresence mode="wait">
								<motion.div
									key={isOpen ? 'close' : 'open'}
									initial={{ rotate: -90, opacity: 0 }}
									animate={{ rotate: 0, opacity: 1 }}
									exit={{ rotate: 90, opacity: 0 }}
									transition={{ duration: 0.2 }}
								>
									{isOpen ? <X size={28} /> : <Menu size={28} />}
								</motion.div>
							</AnimatePresence>
						</button>
					</div>
				</div>
			</div>

			{/* Mobile Menu */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						ref={menuRef}
						variants={menuVariants}
						initial="hidden"
						animate="visible"
						exit="exit"
						className="md:hidden bg-cream-bg border-t border-gray-100 shadow-xl overflow-hidden"
					>
						<div className="px-4 pt-4 pb-8 space-y-1 flex flex-col items-center text-center">
							<Link
								to={getLink('#home')}
								onClick={() => setIsOpen(false)}
								className="w-full py-3 text-text-black hover:text-neverland-green font-display font-bold text-lg"
							>
								Inicio
							</Link>

							<Link
								to={getLink('#servicios')}
								onClick={() => setIsOpen(false)}
								className="w-full py-3 text-text-black hover:text-neverland-green font-display font-bold text-lg"
							>
								Servicios
							</Link>

							<Link
								to={getLink('#instalaciones')}
								onClick={() => setIsOpen(false)}
								className="w-full py-3 text-text-black hover:text-neverland-green font-display font-bold text-lg"
							>
								Instalaciones
							</Link>

							<Link
								to={getLink('#actividades')}
								onClick={() => setIsOpen(false)}
								className="w-full py-3 text-text-black hover:text-neverland-green font-display font-bold text-lg"
							>
								Actividades
							</Link>

							<Link
								to={getLink('#menus')}
								onClick={() => setIsOpen(false)}
								className="w-full py-3 text-text-black hover:text-neverland-green font-display font-bold text-lg"
							>
								Menús
							</Link>

							<Link
								to={getLink('#faq')}
								onClick={() => setIsOpen(false)}
								className="w-full py-3 text-text-black hover:text-neverland-green font-display font-bold text-lg"
							>
								FAQ
							</Link>

							<div className="w-full pt-4 px-4">
								<Link
									to="/booking"
									onClick={() => setIsOpen(false)}
									className="block w-full bg-energy-orange text-white px-5 py-4 rounded-2xl font-display font-black shadow-lg shadow-energy-orange/20"
								>
									Reservar Ahora
								</Link>
							</div>

							<Link
								to={isLoggedIn ? '/admin' : '/admin/login'}
								onClick={() => setIsOpen(false)}
								className="w-full py-4 text-gray-400 hover:text-neverland-green text-sm font-medium"
							>
								{isLoggedIn ? 'Panel Control' : 'Acceso Admin'}
							</Link>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</nav>
	);
};

export default Navbar;
