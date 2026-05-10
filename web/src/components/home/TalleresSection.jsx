import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Palette, ArrowRight, Loader2 } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { getTalleres } from '../../services/api';
import TallerPublicCard from '../talleres/TallerPublicCard';

const TalleresSection = () => {
	const { ref, controls, variants } = useScrollReveal();
	const [talleres, setTalleres] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchTalleres = async () => {
			try {
				const res = await getTalleres({ limite: 6 });
				setTalleres(res.data || []);
			} catch (err) {
				console.error('Error fetching talleres:', err);
			} finally {
				setLoading(false);
			}
		};
		fetchTalleres();
	}, []);

	// No renderizar nada si no hay talleres disponibles
	if (!loading && talleres.length === 0) {
		return null;
	}

	return (
		<section id="talleres" className="py-20 bg-cream-bg">
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
							Talleres Especiales
						</span>
					</div>
					<h2 className="text-3xl sm:text-5xl font-display font-black text-neverland-green mb-6">
						Próximos Talleres
					</h2>
					<p className="text-text-muted max-w-2xl mx-auto text-lg font-sans">
						Sesiones temáticas programadas para que los niños disfruten de
						experiencias únicas guiadas por monitores expertos.
					</p>
				</motion.div>

				{/* Skeleton loaders */}
				{loading ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{[...Array(3)].map((_, i) => (
							<div
								key={i}
								className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 animate-pulse"
							>
								<div className="h-48 bg-gray-100" />
								<div className="p-5 space-y-3">
									<div className="h-5 bg-gray-100 rounded-lg w-3/4" />
									<div className="h-3 bg-gray-50 rounded w-1/2" />
									<div className="h-3 bg-gray-50 rounded w-2/3" />
								</div>
							</div>
						))}
					</div>
				) : (
					<>
						{/* Grid de talleres */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{talleres.slice(0, 6).map((taller) => (
								<TallerPublicCard
									key={taller.id || taller._id}
									taller={taller}
								/>
							))}
						</div>

						{/* Link a todos los talleres */}
						{talleres.length > 3 && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
								className="text-center mt-10"
							>
								<Link
									to="/talleres"
									className="inline-flex items-center gap-2 px-6 py-3 bg-white text-neverland-green rounded-full font-display font-black text-[10px] uppercase tracking-wider shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all border border-neverland-green/10 group"
								>
									Ver todos los talleres
									<ArrowRight
										size={14}
										className="group-hover:translate-x-1 transition-transform"
									/>
								</Link>
							</motion.div>
						)}
					</>
				)}
			</div>
		</section>
	);
};

export default TalleresSection;
