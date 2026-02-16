import React from 'react';
import { Palette, Sparkles, Beaker } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import facePaintingImg from '../../assets/images/face_painting.png';
import slimeImg from '../../assets/images/slime.png';
import magicImg from '../../assets/images/magic.png';

const WorkshopCard = ({ title, image, icon: Icon, description, delay }) => {
	const { ref, controls, variants } = useScrollReveal(0.2);

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
					transition: { duration: 0.6, delay: delay },
				},
			}}
			className="group relative overflow-hidden rounded-3xl shadow-lg h-72 sm:h-96 cursor-pointer"
		>
			<div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
				<img src={image} alt={title} className="w-full h-full object-cover" />
				<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/80 transition-all duration-300"></div>
			</div>

			<div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
				<div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
					<div className="flex items-center gap-2 mb-2 text-energy-orange">
						<Icon size={20} className="drop-shadow-md" />
						<span className="text-sm font-display font-bold uppercase tracking-wider drop-shadow-md">
							Actividad
						</span>
					</div>
					<h3 className="text-3xl font-display font-bold text-white mb-2 drop-shadow-md">
						{title}
					</h3>
					<p className="text-gray-200 text-sm font-sans opacity-90 transition-opacity duration-300 leading-relaxed">
						{description}
					</p>
				</div>
			</div>
		</motion.div>
	);
};

const WorkshopsSection = () => {
	const { ref, controls, variants } = useScrollReveal();

	return (
		<section id="actividades" className="py-20 bg-cream-bg">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div
					ref={ref}
					initial="hidden"
					animate={controls}
					variants={variants}
					className="text-center mb-16"
				>
					<div className="inline-flex items-center justify-center p-2 bg-white rounded-full mb-4 shadow-md px-4 border border-neverland-green/10">
						<Sparkles className="text-sun-yellow mr-2" size={20} />
						<span className="text-sm font-bold text-text-black uppercase tracking-wider font-sans">
							Actividades Especiales
						</span>
					</div>
					<h2 className="text-3xl sm:text-5xl font-display font-black text-neverland-green mb-6">
						Actividades Creativas
					</h2>
					<p className="text-text-muted max-w-2xl mx-auto text-lg font-sans">
						Añade un toque mágico a tu fiesta con nuestros talleres temáticos
						guiados por monitores expertos.
					</p>
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<WorkshopCard
						title="Pintacaras"
						icon={Palette}
						image={facePaintingImg}
						description="¡Transfórmate en tu personaje favorito! Utilizamos pinturas hipoalergénicas y diseños increíbles."
						delay={0.1}
					/>
					<WorkshopCard
						title="Slime Factory"
						icon={Beaker}
						image={slimeImg}
						description="La actividad más pegajosa y divertida. Crea tu propio slime personalizado para llevar a casa."
						delay={0.2}
					/>
					<WorkshopCard
						title="Escuela de Magia"
						icon={Sparkles}
						image={magicImg}
						description="Aprende trucos sorprendentes y conviértete en un pequeño mago por un día."
						delay={0.3}
					/>
				</div>
			</div>
		</section>
	);
};

export default WorkshopsSection;
