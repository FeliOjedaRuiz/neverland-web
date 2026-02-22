import React from 'react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { getConfig } from '../../services/api';

const MenuCard = ({ index, title, items, delay }) => {
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
			className="bg-white p-8 rounded-[32px] shadow-sm hover:shadow-xl hover:shadow-neverland-green/5 transition-all duration-500 border border-gray-100 flex flex-col group relative overflow-hidden h-full"
		>
			{/* Decorative background element */}
			<div className="absolute top-0 right-0 w-24 h-24 bg-neverland-green/5 rounded-full -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-150 group-hover:bg-neverland-green/10" />

			<div className="relative mb-6">
				<div className="w-10 h-10 rounded-xl bg-neverland-green/10 flex items-center justify-center mb-4 group-hover:bg-neverland-green group-hover:text-white transition-all duration-500 font-display font-black text-neverland-green">
					{index + 1}
				</div>
				<h3 className="text-sm font-display font-black text-energy-orange mb-1 uppercase tracking-[0.2em]">
					{title}
				</h3>
				<h4 className="text-2xl font-display font-bold text-text-black group-hover:text-neverland-green transition-colors">
					Merienda {index + 1}
				</h4>
			</div>

			<div className="flex-1">
				<ul className="space-y-3">
					{items.map((item, idx) => (
						<li
							key={idx}
							className="flex items-start gap-2 text-text-muted text-sm font-medium leading-relaxed"
						>
							<div className="w-1.5 h-1.5 rounded-full bg-energy-orange/30 mt-1.5 shrink-0 group-hover:bg-neverland-green/40 transition-colors" />
							{item}
						</li>
					))}
				</ul>
			</div>

			<div className="mt-8 pt-6 border-t border-gray-50 flex items-center text-[10px] font-black text-gray-300 uppercase tracking-widest">
				Menú Infantil
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
						title: m.principal,
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

	if (error)
		return (
			<div className="py-24 text-center bg-cream-bg text-red-500">
				<div className="max-w-md mx-auto p-8 rounded-3xl bg-white border border-red-50">
					<p className="font-display font-bold mb-4 text-xl">
						Oops, algo ha pasado
					</p>
					<p className="text-sm text-gray-500 mb-6">
						No hemos podido cargar los menús. Por favor, recarga la página.
					</p>
					<button
						onClick={() => window.location.reload()}
						className="px-6 py-2 bg-neverland-green text-white rounded-xl font-bold text-sm shadow-lg shadow-neverland-green/20"
					>
						Reintentar
					</button>
				</div>
			</div>
		);

	if (menus.length === 0) return null;

	return (
		<section id="menus" className="py-24 bg-cream-bg overflow-hidden">
			<div className="max-w-7xl mx-auto px-6 sm:px-8">
				<motion.div
					ref={ref}
					initial="hidden"
					animate={controls}
					className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16"
				>
					<div className="max-w-2xl">
						<h2 className="text-4xl sm:text-5xl font-display font-bold text-neverland-green mb-6 leading-tight">
							¡Hora de la Merienda!
						</h2>
						<p className="text-text-muted text-lg font-medium leading-relaxed">
							Tenemos opciones deliciosas para todos los gustos. Adaptamos
							cualquier menú para alergias e intolerancias. ¡Pregúntanos!
						</p>
					</div>
					<div className="hidden lg:block">
						<div className="w-16 h-16 rounded-3xl bg-white shadow-xl shadow-neverland-green/5 flex items-center justify-center rotate-12">
							<div className="w-8 h-8 rounded-full bg-energy-orange animate-pulse" />
						</div>
					</div>
				</motion.div>

				<div
					className={`grid grid-cols-1 sm:grid-cols-2 ${menus.length > 3 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-8`}
				>
					{menus.map((menu, idx) => (
						<MenuCard key={idx} index={idx} {...menu} delay={idx * 0.15} />
					))}
				</div>
			</div>
		</section>
	);
};

export default MenusSection;
