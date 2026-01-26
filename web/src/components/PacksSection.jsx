import React from 'react';
import { Check, Star, Crown, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '../hooks/useScrollReveal';

const PackCard = ({
	title,
	icon: Icon,
	color,
	price,
	items,
	recommended,
	delay,
}) => {
	const { ref, controls, variants } = useScrollReveal(0.1);

	return (
		<motion.div
			ref={ref}
			initial="hidden"
			animate={controls}
			variants={{
				hidden: { opacity: 0, y: 50 },
				visible: {
					opacity: 1,
					y: 0,
					transition: { duration: 0.5, delay: delay },
				},
			}}
			className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:scale-105 ${recommended ? 'border-4 border-energy-orange scale-105 z-10' : 'border border-gray-100'}`}
		>
			{recommended && (
				<div className="absolute top-0 w-full bg-energy-orange text-white text-center py-1 font-bold text-sm tracking-wider">
					MÁS POPULAR
				</div>
			)}

			<div className={`p-6 ${recommended ? 'pt-10' : ''}`}>
				<div
					className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${color}`}
				>
					<Icon className="text-white" size={32} />
				</div>

				<h3 className="text-2xl font-bold text-center text-text-black mb-2">
					{title}
				</h3>
				<p className="text-center text-gray-400 text-sm mb-6">
					Lo esencial para una gran fiesta
				</p>

				<div className="text-center mb-8">
					<span className="text-4xl font-extrabold text-text-black">
						{price}
					</span>
					<span className="text-gray-500"> / niño</span>
				</div>

				<ul className="space-y-3 mb-8">
					{items.map((item, idx) => (
						<li key={idx} className="flex items-start">
							<Check
								className="text-neverland-green mr-2 flex-shrink-0"
								size={18}
							/>
							<span className="text-sm text-gray-600 font-medium text-left">
								{item}
							</span>
						</li>
					))}
				</ul>

				<button className="w-full py-3 rounded-xl bg-gray-50 text-text-black font-bold hover:bg-neverland-green hover:text-white transition-colors border border-gray-200">
					Elegir {title}
				</button>
			</div>
		</motion.div>
	);
};

const PacksSection = () => {
	const { ref, controls, variants } = useScrollReveal();

	const packs = [
		{
			title: 'Básico',
			price: '13€',
			icon: Star,
			color: 'bg-rec-blue',
			items: [
				'2 horas de juego en parque',
				'Merienda (Menú 1 o 2)',
				'Invitaciones digitales',
				'Calcetines antideslizantes',
			],
		},
		{
			title: 'Premium',
			price: '16€',
			recommended: true,
			icon: Crown,
			color: 'bg-energy-orange',
			items: [
				'2.5 horas de juego en parque',
				'Merienda completa',
				'Tarta de cumpleaños',
				'Bolsa de chuches',
				'Regalo para el anfitrión',
			],
		},
		{
			title: 'VIP',
			price: '19€',
			icon: PartyPopper,
			color: 'bg-sun-yellow',
			items: [
				'Tiempo ilimitado de juego',
				'Merienda Premium a elegir',
				'Taller incluido (Pintacaras...)',
				'Animador exclusivo',
				'Reportaje fotográfico',
			],
		},
	];

	return (
		<section id="packs" className="py-16 bg-cream-bg">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div
					ref={ref}
					initial="hidden"
					animate={controls}
					variants={variants}
					className="text-center mb-16"
				>
					<h2 className="text-3xl sm:text-4xl font-bold text-neverland-green mb-4">
						Nuestros Packs de Cumpleaños
					</h2>
					<p className="text-gray-600 max-w-2xl mx-auto">
						Elige la opción perfecta para tu celebración. Todos nuestros packs
						incluyen acceso a todas las zonas de juego y supervisión de
						monitores.
					</p>
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
					{packs.map((pack, idx) => (
						<PackCard key={idx} {...pack} delay={idx * 0.2} />
					))}
				</div>
			</div>
		</section>
	);
};

export default PacksSection;
