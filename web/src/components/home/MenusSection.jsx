import { Pizza, Drumstick, Sandwich, Cookie } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '../../hooks/useScrollReveal';
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
	const { ref, controls, variants } = useScrollReveal();

	const menus = [
		{
			number: 1,
			title: 'Clásico',
			icon: Sandwich,
			items: [
				'Sandwich Mixto/Nocilla',
				'Patatillas',
				'Gusanitos',
				'Refresco/Agua',
			],
		},
		{
			number: 2,
			title: 'Perrito',
			icon: hotDogIcon,
			items: ['Perrito Caliente', 'Patatillas', 'Gusanitos', 'Refresco/Agua'],
		},
		{
			number: 3,
			title: 'Pizza',
			icon: Pizza,
			items: [
				'Pizza Jamón y Queso',
				'Patatillas',
				'Gusanitos',
				'Refresco/Agua',
			],
		},
		{
			number: 4,
			title: 'Nuggets',
			icon: Drumstick,
			items: [
				'Nuggets de Pollo',
				'Patatas Fritas',
				'Gusanitos',
				'Refresco/Agua',
			],
		},
	];

	return (
		<section id="menus" className="py-16 bg-cream-bg">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div
					ref={ref}
					initial="hidden"
					animate={controls}
					variants={variants}
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
