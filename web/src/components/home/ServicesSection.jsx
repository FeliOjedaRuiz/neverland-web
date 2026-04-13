import React from 'react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '../../hooks/useScrollReveal';

const ServiceCard = ({ image, title, description, color, delay }) => {
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
			className="group flex flex-col items-center text-center cursor-pointer"
		>
			<div className="relative w-full aspect-[4/3] mb-6 overflow-hidden rounded-3xl shadow-soft hover:shadow-lg transition-shadow duration-300">
				{/* Sutil capa de color superpuesta que reacciona al hover */}
				<div className={`absolute inset-0 opacity-0 ${color} mix-blend-multiply group-hover:opacity-20 transition-opacity duration-300 z-10`} />
				
				<img 
					src={image} 
					alt={title} 
					className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
				/>
			</div>
			<div className="px-2">
				<h3 className="text-2xl font-display font-bold text-text-black mb-3">
					{title}
				</h3>
				<p className="text-text-muted text-base font-sans leading-relaxed">
					{description}
				</p>
			</div>
		</motion.div>
	);
};

const ServicesSection = () => {
	const { ref, controls, variants } = useScrollReveal();

	const services = [
		{
			image: 'https://res.cloudinary.com/duoshgr3h/image/upload/q_auto,f_auto/v1776097459/neverland_homepage/cumpleanos.png',
			title: 'Celebración de Cumpleaños',
			description: 'Celebra su día especial con exclusividad, merienda deliciosa, animación y acceso total a todas nuestras instalaciones.',
			color: 'bg-rec-blue',
			delay: 0.1
		},
		{
			image: 'https://res.cloudinary.com/duoshgr3h/image/upload/q_auto,f_auto/v1776097457/neverland_homepage/talleres_slime.jpg',
			title: 'Talleres',
			description: 'Actividades creativas y educativas para que los más pequeños aprendan desarrollando su imaginación y creatividad.',
			color: 'bg-brand-green-light',
			delay: 0.2
		},
		{
			image: 'https://res.cloudinary.com/duoshgr3h/image/upload/q_auto,f_auto/v1776097458/neverland_homepage/parque_infantil.png',
			title: 'Parque Infantil',
			description: 'Estructura de juegos, toboganes, piscina de bolas y obstáculos en un espacio seguro, climatizado y lleno de diversión.',
			color: 'bg-energy-orange',
			delay: 0.3
		},
		{
			image: 'https://res.cloudinary.com/duoshgr3h/image/upload/q_auto,f_auto/v1776097446/neverland_homepage/cafeteria.png',
			title: 'Cafetería',
			description: 'Relájate tomando un café o un refresco mientras observas a tus hijos jugar cómodamente en nuestras instalaciones.',
			color: 'bg-neverland-green',
			delay: 0.4
		}
	];

	return (
		<section id="servicios" className="py-20 bg-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div
					ref={ref}
					initial="hidden"
					animate={controls}
					variants={variants}
					className="text-center mb-16"
				>
					<h2 className="text-4xl sm:text-5xl font-display font-bold text-neverland-green mb-6">
						Todo lo que necesitas
					</h2>
					<p className="text-text-muted max-w-2xl mx-auto font-sans text-xl">
						Más allá de los cumpleaños, Neverland es un espacio pensado para el
						disfrute de toda la familia.
					</p>
				</motion.div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 max-w-7xl mx-auto">
					{services.map((service, index) => (
						<ServiceCard
							key={index}
							image={service.image}
							title={service.title}
							description={service.description}
							color={service.color}
							delay={service.delay}
						/>
					))}
				</div>
			</div>
		</section>
	);
};

export default ServicesSection;
