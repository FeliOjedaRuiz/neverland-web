import React from 'react';
import { Smile, Coffee, Baby } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '../../hooks/useScrollReveal';

const ServiceCard = ({ icon: Icon, title, description, color, delay }) => {
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
			className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
		>
			<div
				className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 text-white ${color} shadow-lg`}
			>
				<Icon size={32} />
			</div>
			<h3 className="text-xl font-display font-bold text-text-black mb-2">
				{title}
			</h3>
			<p className="text-text-muted text-sm font-sans leading-relaxed">
				{description}
			</p>
		</motion.div>
	);
};

const ServicesSection = () => {
	const { ref, controls, variants } = useScrollReveal();

	return (
		<section id="servicios" className="py-16 bg-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div
					ref={ref}
					initial="hidden"
					animate={controls}
					variants={variants}
					className="text-center mb-12"
				>
					<h2 className="text-3xl sm:text-4xl font-display font-bold text-neverland-green mb-4">
						Todo lo que necesitas
					</h2>
					<p className="text-text-muted max-w-2xl mx-auto font-sans text-lg">
						Más allá de los cumpleaños, Neverland es un espacio pensado para el
						disfrute de toda la familia.
					</p>
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
					<ServiceCard
						icon={Smile}
						title="Parque de Bolas"
						description="Estructura de juegos de 3 niveles con toboganes, piscina de bolas y obstáculos para niños de 3 a 10 años."
						color="bg-energy-orange"
						delay={0.1}
					/>
					<ServiceCard
						icon={Coffee}
						title="Cafetería para Padres"
						description="Relájate tomando un café o un refresco mientras observas a tus hijos jugar cómodamente."
						color="bg-neverland-green"
						delay={0.3}
					/>
				</div>
			</div>
		</section>
	);
};

export default ServicesSection;
