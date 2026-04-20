import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { ChevronRight, Clock, Utensils, Sparkles, Star } from 'lucide-react';

// ─── Stats destacados ───────────────────────────────────────────────────────
const STATS = [
	{
		icon: Utensils,
		color: 'text-energy-orange',
		bg: 'bg-orange-50',
		border: 'border-orange-100',
		value: '3',
		label: 'Menús infantiles',
	},
	{
		icon: Clock,
		color: 'text-neverland-green',
		bg: 'bg-green-50',
		border: 'border-green-100',
		value: '2h',
		label: 'De diversión incluidas',
	},
	{
		icon: Sparkles,
		color: 'text-rec-blue',
		bg: 'bg-blue-50',
		border: 'border-blue-100',
		value: '+10',
		label: 'Actividades disponibles',
	},
	{
		icon: Star,
		color: 'text-sun-yellow',
		bg: 'bg-yellow-50',
		border: 'border-yellow-100',
		value: '0€',
		label: 'Sorpresas ocultas',
	},
];

// ─── Categorías de la "carta rápida" ────────────────────────────────────────
const CATEGORIES = [
	{
		emoji: '🧸',
		title: 'Menús Infantiles',
		desc: 'Menú completo con bebida, postre y sorpresa para cada niño.',
		accent: 'from-orange-400 to-energy-orange',
		tag: 'desde 9€/niño',
	},
	{
		emoji: '✨',
		title: 'Actividades',
		desc: 'Talleres temáticos guiados por monitores expertos.',
		accent: 'from-blue-400 to-rec-blue',
		tag: 'desde 25€',
	},
	{
		emoji: '🌟',
		title: 'Personajes',
		desc: 'Actuación especial y fotos con tus personajes favoritos.',
		accent: 'from-emerald-400 to-neverland-green',
		tag: '40€',
	},
];

// ─── Componente principal ────────────────────────────────────────────────────
const MenusSection = () => {
	const { ref, controls, variants } = useScrollReveal();

	return (
		// id="menus" se mantiene para compatibilidad con links enviados por WhatsApp
		<section id="menus" className="py-20 bg-cream-bg overflow-hidden">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

				{/* ── Header ── */}
				<motion.div
					ref={ref}
					initial="hidden"
					animate={controls}
					variants={variants}
					className="text-center mb-14"
				>
					<div className="inline-flex items-center justify-center gap-2 bg-white px-4 py-2 rounded-full mb-5 shadow-sm border border-gray-100">
						<Star size={16} className="text-sun-yellow fill-sun-yellow" />
						<span className="text-sm font-bold text-text-black uppercase tracking-wider font-sans">
							Sin letra pequeña
						</span>
					</div>
					<h2 className="text-4xl sm:text-5xl font-display font-black text-neverland-green mb-4 leading-tight">
						Precios claros,<br />fiestas felices
					</h2>
					<p className="text-text-muted max-w-xl mx-auto font-sans text-lg leading-relaxed">
						Todo lo que incluye tu celebración, sin sorpresas al final.
						Consulta nuestra carta completa de servicios.
					</p>
				</motion.div>

				{/* ── Stats ── */}
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
					{STATS.map((stat, i) => {
						const Icon = stat.icon;
						return (
							<motion.div
								key={i}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.4, delay: i * 0.08 }}
								className={`bg-white rounded-2xl border ${stat.border} p-5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow`}
							>
								<div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
									<Icon size={22} className={stat.color} />
								</div>
								<span className={`text-3xl font-display font-black ${stat.color} leading-none mb-1`}>
									{stat.value}
								</span>
								<span className="text-xs text-gray-400 font-medium leading-snug">{stat.label}</span>
							</motion.div>
						);
					})}
				</div>

				{/* ── Categorías ── */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
					{CATEGORIES.map((cat, i) => (
						<motion.div
							key={i}
							initial={{ opacity: 0, scale: 0.97 }}
							whileInView={{ opacity: 1, scale: 1 }}
							viewport={{ once: true }}
							transition={{ duration: 0.4, delay: i * 0.1 }}
							whileHover={{ y: -3 }}
							className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-lg transition-all"
						>
							{/* Barra de gradiente superior */}
							<div className={`h-1.5 w-full bg-gradient-to-r ${cat.accent}`} />

							<div className="p-6">
								<div className="flex items-start justify-between mb-3">
									<span className="text-3xl">{cat.emoji}</span>
									<span className={`text-xs font-black px-3 py-1 rounded-full bg-gradient-to-r ${cat.accent} text-white shadow-sm`}>
										{cat.tag}
									</span>
								</div>
								<h3 className="font-display font-black text-lg text-text-black mb-1 group-hover:text-neverland-green transition-colors">
									{cat.title}
								</h3>
								<p className="text-sm text-gray-400 font-medium leading-relaxed">{cat.desc}</p>
							</div>
						</motion.div>
					))}
				</div>

				{/* ── CTA ── */}
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.45, delay: 0.2 }}
					className="flex flex-col sm:flex-row items-center justify-center gap-4"
				>
					<Link
						to="/precios"
						className="inline-flex items-center gap-2 bg-energy-orange text-white px-6 py-3 rounded-full font-display font-bold text-base shadow-md shadow-energy-orange/25 hover:bg-[#E06D2E] hover:scale-105 transition-all active:scale-95"
					>
						Ver carta de precios completa
						<ChevronRight size={18} />
					</Link>
				</motion.div>

			</div>
		</section>
	);
};

export default MenusSection;
