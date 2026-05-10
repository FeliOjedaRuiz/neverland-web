import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Calendar, Palette } from 'lucide-react';
import { getTalleres } from '../services/api';
import TallerPublicCard from '../components/talleres/TallerPublicCard';
import SEO from '../components/common/SEO';

const TalleresListPage = () => {
	const [talleres, setTalleres] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchTalleres = async () => {
			try {
				const res = await getTalleres();
				setTalleres(res.data || []);
			} catch (err) {
				console.error('Error fetching talleres:', err);
			} finally {
				setLoading(false);
			}
		};
		fetchTalleres();
	}, []);

	return (
		<>
			<SEO
				title="Talleres"
				description="Descubre los próximos talleres infantiles en Neverland. Sesiones temáticas programadas con monitores expertos."
			/>

			<div className="min-h-dvh bg-cream-bg">
				{/* Hero */}
				<div className="relative py-20 sm:py-28 bg-linear-to-br from-neverland-green/5 via-cream-bg to-energy-orange/5 overflow-hidden">
					<div className="absolute inset-0 opacity-5">
						<div className="absolute top-10 left-10 w-72 h-72 bg-neverland-green rounded-full blur-3xl" />
						<div className="absolute bottom-10 right-10 w-96 h-96 bg-energy-orange rounded-full blur-3xl" />
					</div>

					<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
						>
							<div className="inline-flex items-center justify-center p-2 bg-white rounded-full mb-6 shadow-md px-4 border border-neverland-green/10">
								<Sparkles className="text-sun-yellow mr-2" size={20} />
								<span className="text-sm font-bold text-text-black uppercase tracking-wider font-sans">
									Talleres Infantiles
								</span>
							</div>
							<h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-neverland-green mb-4">
								Próximos Talleres
							</h1>
							<p className="text-text-muted max-w-xl mx-auto text-lg font-sans">
								Sesiones temáticas únicas para que los niños aprendan, creen y se
								diviertan en un entorno seguro y supervisado.
							</p>
						</motion.div>
					</div>
				</div>

				{/* Listado de talleres */}
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-6 relative z-10">
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
					) : talleres.length === 0 ? (
						<div className="text-center py-20 bg-white/50 rounded-[40px] border border-dashed border-gray-200">
							<div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
								<Palette size={28} className="text-gray-300" />
							</div>
							<p className="font-display font-bold text-gray-400 text-lg mb-1">
								No hay talleres disponibles
							</p>
							<p className="text-sm text-gray-300 font-medium">
								Vuelve pronto — estamos preparando nuevos talleres
							</p>
						</div>
					) : (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
						>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{talleres.map((taller) => (
									<TallerPublicCard
										key={taller.id || taller._id}
										taller={taller}
									/>
								))}
							</div>
						</motion.div>
					)}
				</div>
			</div>
		</>
	);
};

export default TalleresListPage;
