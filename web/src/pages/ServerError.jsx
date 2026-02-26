import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RotateCcw, Home, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

const ServerError = () => {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-cream-bg relative overflow-hidden flex items-center justify-center px-6">
			{/* Grid de Fondo */}
			<div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
			<div className="absolute -top-32 -right-32 w-96 h-96 bg-red-400/10 rounded-full blur-[100px] pointer-events-none" />
			<div className="absolute -bottom-32 -left-32 w-96 h-96 bg-energy-orange/10 rounded-full blur-[100px] pointer-events-none" />

			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ type: 'spring', stiffness: 100, damping: 20 }}
				className="relative z-10 bg-white/70 backdrop-blur-xl border border-white p-12 md:p-16 rounded-[40px] shadow-2xl shadow-energy-orange/5 max-w-2xl w-full text-center"
			>
				<div className="flex justify-center mb-8">
					<div className="relative">
						<motion.div
							animate={{ rotate: 360 }}
							transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
							className="absolute -inset-4 border-[6px] border-dashed border-energy-orange/30 rounded-full"
						/>
						<div className="w-24 h-24 bg-gradient-to-tr from-energy-orange to-red-400 rounded-full flex items-center justify-center text-white shadow-xl shadow-red-500/20">
							<Wrench className="w-10 h-10" strokeWidth={2.5} />
						</div>
					</div>
				</div>

				<h1 className="text-5xl font-display font-black text-text-black mb-4 tracking-tight">
					¡Algo se rompió!
				</h1>

				<p className="text-xl text-text-muted mb-8 max-w-md mx-auto leading-relaxed">
					Nuestros piratas mecánicos ya están en la sala de máquinas trabajando
					para repararlo.
				</p>

				<div className="space-y-4">
					<button
						onClick={() => window.location.reload()}
						className="w-full py-4 rounded-full font-bold font-display text-lg flex items-center justify-center gap-3 bg-energy-orange text-white shadow-xl shadow-energy-orange/20 hover:scale-105 active:scale-95 transition-all"
					>
						<RotateCcw className="w-5 h-5" />
						Intentar de Nuevo
					</button>

					<div className="flex gap-4">
						<button
							onClick={() => navigate(-1)}
							className="flex-1 py-4 rounded-full font-bold font-display text-text-muted bg-gray-50 hover:bg-gray-100 transition-colors"
						>
							Volver
						</button>
						<Link
							to="/"
							className="flex-1 py-4 rounded-full font-bold font-display text-text-muted flex justify-center items-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors"
						>
							<Home className="w-4 h-4" /> Inicio
						</Link>
					</div>
				</div>
			</motion.div>
		</div>
	);
};

export default ServerError;
