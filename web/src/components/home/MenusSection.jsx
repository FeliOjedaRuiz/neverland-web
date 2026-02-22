import React from 'react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { getConfig } from '../../services/api';

const MenuCard = ({ name, mainCourse, items, delay }) => {
	const { ref, controls } = useScrollReveal(0.1);

	return (
		<motion.div
			ref={ref}
			initial="hidden"
			animate={controls}
			variants={{
				hidden: { opacity: 0, y: 20 },
				visible: {
					opacity: 1,
					y: 0,
					transition: { duration: 0.5, delay: delay },
				},
			}}
			className="bg-white p-8 rounded-[40px] shadow-sm hover:shadow-2xl hover:shadow-neverland-green/10 transition-all duration-500 border border-gray-100 flex flex-col group relative h-full overflow-hidden"
		>
			{/* Subtle accent background */}
			<div className="absolute top-0 right-0 w-32 h-32 bg-energy-orange/5 rounded-full -mr-16 -mt-16 group-hover:bg-energy-orange/10 transition-colors duration-500" />

			<div className="relative mb-8">
				<h3 className="text-3xl font-display font-black text-text-black mb-2 group-hover:text-neverland-green transition-colors">
					{name}
				</h3>
				<div className="inline-block px-3 py-1 bg-neverland-green/10 rounded-lg">
					<span className="text-[10px] font-black text-neverland-green uppercase tracking-[0.2em]">
						{mainCourse}
					</span>
				</div>
			</div>

			<div className="flex-1">
				<ul className="space-y-4">
					{items.map((item, idx) => (
						<li
							key={idx}
							className="flex items-center gap-3 text-text-muted text-sm font-semibold"
						>
							<div className="w-1.5 h-1.5 rounded-full bg-neverland-green/30 group-hover:scale-125 transition-transform" />
							{item}
						</li>
					))}
				</ul>
			</div>

			{/* Bottom Decorative Element */}
			<div className="mt-8 flex justify-end">
				<div className="w-8 h-1 bg-gray-100 rounded-full group-hover:w-16 group-hover:bg-neverland-green/30 transition-all duration-500" />
			</div>
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
				if (res.data?.menusNiños) {
					const formattedMenus = res.data.menusNiños.map((m) => ({
						name: m.nombre, // "Menú 1", "Menú 2", etc.
						mainCourse: m.principal, // "Sándwiches", "Perrito caliente", etc.
						items: m.resto ? m.resto.split('\n').filter((i) => i.trim()) : [],
					}));
					setMenus(formattedMenus);
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
			<div className="py-24 text-center bg-cream-bg">
				<div className="inline-block w-8 h-8 border-4 border-neverland-green/20 border-t-neverland-green rounded-full animate-spin"></div>
			</div>
		);

	if (error) return null; // Gracefully hide section on error
	if (menus.length === 0) return null;

	return (
		<section id="menus" className="py-24 bg-cream-bg overflow-hidden">
			<div className="max-w-7xl mx-auto px-6 sm:px-8">
				<motion.div
					ref={ref}
					initial="hidden"
					animate={controls}
					className="text-center mb-20"
				>
					<h2 className="text-4xl sm:text-6xl font-display font-bold text-neverland-green mb-6 leading-tight">
						Nuestras Meriendas
					</h2>
					<p className="text-text-muted text-xl font-medium max-w-2xl mx-auto leading-relaxed">
						Opciones pensadas para que cada niño disfrute al máximo de su día
						especial.
					</p>
				</motion.div>

				<div
					className={`grid grid-cols-1 sm:grid-cols-2 ${menus.length > 3 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-10`}
				>
					{menus.map((menu, idx) => (
						<MenuCard key={idx} {...menu} delay={idx * 0.1} />
					))}
				</div>
			</div>
		</section>
	);
};

export default MenusSection;
