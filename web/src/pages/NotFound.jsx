import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFound = () => {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-cream-bg relative overflow-hidden flex items-center justify-center px-6">
			{/* Decoración de fondo */}
			<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neverland-green/10 rounded-full blur-3xl mix-blend-multiply animate-pulse" />
			<div
				className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-energy-orange/10 rounded-full blur-3xl mix-blend-multiply animate-pulse"
				style={{ animationDelay: '2s' }}
			/>

			<motion.div
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, ease: 'easeOut' }}
				className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center"
			>
				{/* 404 Float */}
				<motion.div
					animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
					transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
					className="relative mb-12"
				>
					<h1 className="text-[12rem] leading-none font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-neverland-green to-energy-orange opacity-90 filter drop-shadow-xl select-none">
						404
					</h1>
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur p-6 rounded-full shadow-2xl border-4 border-cream-bg">
						<Compass
							className="w-16 h-16 text-neverland-green"
							strokeWidth={1.5}
						/>
					</div>
				</motion.div>

				<h2 className="text-4xl md:text-5xl font-display font-black text-text-black mb-6">
					¡Te has perdido en Neverland!
				</h2>

				<p className="text-xl text-text-muted mb-12 max-w-lg leading-relaxed font-medium">
					Parece que esta página ha volado junto a Peter Pan hacia la Segunda
					Estrella a la Derecha.
				</p>

				<div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
					<button
						onClick={() => navigate(-1)}
						className="px-8 py-4 rounded-2xl font-bold font-display text-lg flex items-center justify-center gap-3 bg-white text-text-black border-2 border-gray-100 hover:border-neverland-green/30 hover:bg-neverland-green/5 transition-all outline-none"
					>
						<ArrowLeft className="w-5 h-5" />
						Volver Atrás
					</button>
					<Link
						to="/"
						className="px-8 py-4 rounded-2xl font-bold font-display text-lg flex items-center justify-center gap-3 bg-neverland-green text-white shadow-xl shadow-neverland-green/20 hover:scale-105 active:scale-95 transition-all"
					>
						<Home className="w-5 h-5" />
						Ir al Inicio
					</Link>
				</div>
			</motion.div>
		</div>
	);
};

export default NotFound;
