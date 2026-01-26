import React from 'react';
import {
	Calendar,
	MousePointerClick,
	PartyPopper,
	ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '../hooks/useScrollReveal';

const Step = ({ number, title, description, icon: Icon, isLast, delay }) => {
	const { ref, controls, variants } = useScrollReveal(0.2);

	return (
		<motion.div
			ref={ref}
			initial="hidden"
			animate={controls}
			variants={{
				hidden: { opacity: 0, scale: 0.9 },
				visible: {
					opacity: 1,
					scale: 1,
					transition: { duration: 0.5, delay: delay },
				},
			}}
			className="flex flex-col items-center relative z-10"
		>
			<div className="w-20 h-20 rounded-full bg-white border-4 border-energy-orange flex items-center justify-center text-energy-orange mb-6 shadow-md relative z-10">
				<Icon size={36} />
				<div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-neverland-green text-white flex items-center justify-center font-bold border-2 border-white">
					{number}
				</div>
			</div>
			<h3 className="text-xl font-bold text-text-black mb-2 text-center">
				{title}
			</h3>
			<p className="text-gray-600 text-center max-w-xs text-sm">
				{description}
			</p>

			{!isLast && (
				<div className="hidden md:block absolute top-10 left-1/2 w-full h-1 bg-gray-200 -z-10">
					<div className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-300">
						<ArrowRight size={24} />
					</div>
				</div>
			)}
		</motion.div>
	);
};

const WorkflowSection = () => {
	const { ref, controls, variants } = useScrollReveal();

	return (
		<section id="como-funciona" className="py-20 bg-white overflow-hidden">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div
					ref={ref}
					initial="hidden"
					animate={controls}
					variants={variants}
					className="text-center mb-16"
				>
					<h2 className="text-3xl sm:text-4xl font-bold text-neverland-green mb-4">
						¿Cómo funciona?
					</h2>
					<p className="text-gray-600">
						Reserva tu fiesta en 3 sencillos pasos
					</p>
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
					<Step
						number="1"
						title="Elige Fecha"
						description="Consulta nuestro calendario y selecciona el día y turno que prefieras para la celebración."
						icon={Calendar}
						delay={0.1}
					/>
					<Step
						number="2"
						title="Personaliza"
						description="Escoge el pack, el menú y los extras que más te gusten para crear una fiesta única."
						icon={MousePointerClick}
						delay={0.3}
					/>
					<Step
						number="3"
						title="¡A Disfrutar!"
						description="Nosotros nos encargamos de todo. Tú solo preocúpate de pasarlo en grande."
						icon={PartyPopper}
						isLast={true}
						delay={0.5}
					/>
				</div>

				<div className="mt-16 text-center">
					<motion.a
						href="#como-funciona"
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.7 }}
						className="inline-block bg-energy-orange text-white px-8 py-4 rounded-full text-lg font-bold shadow-lg hover:bg-opacity-90 transition-transform hover:scale-105 animate-pulse"
					>
						Comenzar Reserva
					</motion.a>
				</div>
			</div>
		</section>
	);
};

export default WorkflowSection;
