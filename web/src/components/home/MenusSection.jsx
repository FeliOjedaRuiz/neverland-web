import React from 'react';
import { Pizza, Drumstick, Sandwich } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { getConfig } from '../../services/api';
import hotDogIcon from '../../assets/hot-dog.svg';

const MenuCard = ({ number, title, items, icon: Icon, delay }) => {
	const { ref, controls, variants } = useScrollReveal(0.1);
	const isCustomIcon = typeof Icon === 'string';

	return (
		<motion.div
			ref={ref}
			initial="hidden"
			animate={controls}
			variants={{
				hidden: { opacity: 0, scale: 0.95 },
				visible: {
					opacity: 1,
					scale: 1,
					transition: { duration: 0.4, delay: delay },
				},
			}}
			className="bg-white p-6 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col items-center text-center group transform hover:-translate-y-1"
		>
			<div className="w-14 h-14 rounded-full bg-cream-bg flex items-center justify-center mb-4 group-hover:bg-neverland-green group-hover:text-white transition-colors shadow-sm">
				{isCustomIcon ? (
					<img
						src={Icon}
						alt={title}
						className="w-7 h-7 object-contain group-hover:brightness-0 group-hover:invert transition-all"
					/>
				) : (
					<Icon size={28} />
				)}
			</div>
			<h3 className="text-xl font-display font-bold text-text-black mb-1">
				Menú {number}
			</h3>
			<h4 className="text-sm font-display font-semibold text-energy-orange mb-4 uppercase tracking-wide">
				{title}
			</h4>
			<ul className="text-text-muted space-y-2 text-sm font-sans">
				{items.map((item, idx) => (
					<li
						key={idx}
						className="border-b border-gray-50 last:border-0 pb-1 last:pb-0"
					>
						{item}
					</li>
				))}
			</ul>
		</motion.div>
	);
};

const MenusSection = () => {
	const { ref, controls } = useScrollReveal();
	const [menus, setMenus] = React.useState([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState(null);

	React.useEffect(() => {
		getConfig()
			.then((res) => {
				console.log('MenusSection: Config received', res.data);
				if (res.data?.menusNiños) {
					const icons = {
						1: Sandwich,
						2: hotDogIcon,
						3: Pizza,
						4: Drumstick,
					};
					const formattedMenus = res.data.menusNiños.map((m, idx) => {
						const menuNum = m.id && typeof m.id === 'number' ? m.id : idx + 1;
						return {
							number: menuNum,
							title: m.principal,
							icon: icons[menuNum] || Sandwich,
							items: m.resto ? m.resto.split('\n').filter((i) => i.trim()) : [],
						};
					});
					setMenus(formattedMenus);
				} else {
					console.warn('MenusSection: No menusNiños in config');
				}
			})
			.catch((err) => {
				console.error('MenusSection: Error fetching config', err);
				setError(err);
			})
			.finally(() => setLoading(false));
	}, []);

	if (loading)
		return (
			<div className="py-20 text-center bg-cream-bg">
				<div className="inline-block w-8 h-8 border-4 border-neverland-green/20 border-t-neverland-green rounded-full animate-spin"></div>
			</div>
		);

	if (error)
		return (
			<div className="py-20 text-center bg-cream-bg text-red-500">
				<p>Error al cargar los menús. Por favor, intenta recargar la página.</p>
			</div>
		);

	if (menus.length === 0)
		return (
			<div className="py-20 text-center bg-cream-bg text-gray-400 font-display italic">
				<p>Configurando menús infantiles...</p>
			</div>
		);

	return (
		<section id="menus" className="py-16 bg-cream-bg">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div
					ref={ref}
					initial="hidden"
					animate={controls}
					className="text-center mb-12"
				>
					<h2 className="text-3xl sm:text-4xl font-display font-bold text-neverland-green mb-4">
						¡Hora de Merendar!
					</h2>
					<p className="text-text-muted max-w-2xl mx-auto font-sans text-lg">
						Tenemos opciones deliciosas para todos los gustos. Adaptamos
						cualquier menú para alergias e intolerancias.
					</p>
				</motion.div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					{menus.map((menu, idx) => (
						<MenuCard key={idx} {...menu} delay={idx * 0.1} />
					))}
				</div>
			</div>
		</section>
	);
};

export default MenusSection;
