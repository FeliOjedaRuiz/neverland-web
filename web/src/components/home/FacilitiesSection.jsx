import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import {
	Camera,
	X,
	ChevronLeft,
	ChevronRight,
	Maximize2,
	Plus,
} from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

const CLD_BASE = 'https://res.cloudinary.com/dhdd7a5pr/image/upload';

const getUrl = (id, width = 800) => {
	const duplicatedIds = [
		'entrada-hall-mural-neverland',
		'sala-juegos-parque-infantil-mesas',
		'cafeteria-mesas-rojas-barra',
		'piscina-bolas-tobogan-amarillo',
		'zona-princess-castillo-rosa',
		'cafeteria-panoramica-barra-sillas-rojas',
		'sala-juegos-mesas-juegos-mesa',
		'salon-fiestas-mesa-larga-lamparas',
		'escaleras-ascensor-spiderman',
		'salon-principal-mesas-sillas-lamparas',
	];

	const path = duplicatedIds.includes(id)
		? `neverland/instalaciones/neverland/instalaciones/${id}`
		: `neverland/instalaciones/${id}`;

	return `${CLD_BASE}/f_auto,q_auto,w_${width}/${path}.jpg`;
};

const allImages = [
	{ id: 'sala-juegos-completa-panoramica', title: 'Sala de Juegos Completa' },
	{ id: 'arbol-magico-toboganes-colores', title: 'Árbol Mágico de Juegos' },
	{ id: 'piscina-bolas-tobogan-amarillo', title: 'Piscina de Bolas' },
	{ id: 'zona-princess-castillo-rosa', title: 'Zona Princess' },
	{ id: 'cafeteria-panoramica-barra-sillas-rojas', title: 'Zona de Cafetería' },
	{ id: 'salon-fiestas-planta-superior', title: 'Salón de Fiestas' },
	{ id: 'sala-juegos-bola-discoteca-mesas', title: 'Mini Discoteca' },
	{ id: 'toboganes-tubo-colores-piso-superior', title: 'Toboganes de Tubo' },
	{ id: 'piscina-bolas-vista-ventana', title: 'Vista de Juegos' },
	{ id: 'salon-principal-mesas-sillas-lamparas', title: 'Salón de Eventos' },
	{ id: 'escaleras-peter-pan-silueta', title: 'Decoración Mágica' },
	{ id: 'zona-futbolin-cesped-parque', title: 'Zona de Diversión' },
	{ id: 'frase-motivacional-pared-roja', title: 'Frases Inspiradoras' },
	{ id: 'entrada-hall-mural-neverland', title: 'Bienvenida' },
	{ id: 'cafeteria-vitrina-figuras-lamparas', title: 'Exhibición' },
	{ id: 'mural-neverland-peter-pan-detalle', title: 'Arte en Pared' },
	{ id: 'cafeteria-mesas-rojas-barra', title: 'Zona de Padres' },
	{ id: 'escaleras-ascensor-spiderman', title: 'Acceso Spiderman' },
	{ id: 'sala-juegos-parque-infantil-mesas', title: 'Área Infantil' },
	{ id: 'vista-cafeteria-zona-juegos-cristal', title: 'Panorámica' },
	{ id: 'entrada-maquinas-mural-vertical', title: 'Máquinas de Juego' },
	{ id: 'sala-juegos-mesas-juegos-mesa', title: 'Entretenimiento' },
	{ id: 'piscina-bolas-tobogan-interior', title: 'Castillo de Bolas' },
	{ id: 'cafeteria-sillas-rojas-barra-panoramica', title: 'Espacios Amplios' },
	{ id: 'zona-princess-castillo-vista-amplia', title: 'Mundo Princess' },
	{ id: 'entrada-maquinas-panoramica', title: 'Diversión Garantizada' },
	{ id: 'salon-fiestas-mesa-larga-lamparas', title: 'Celebraciones' },
];

// Individual Card Component to fix loading jumps
const GalleryCard = ({ img, spanClass = '', onClick, isLast = false }) => {
	const [loaded, setLoaded] = useState(false);

	return (
		<motion.div
			whileHover={{ y: -8 }}
			onClick={onClick}
			className={`${spanClass} relative rounded-4xl overflow-hidden group cursor-pointer shadow-md bg-gray-100 transition-all duration-300`}
		>
			<img
				src={getUrl(img.id, spanClass.includes('col-span-2') ? 1000 : 500)}
				alt={img.title}
				onLoad={() => setLoaded(true)}
				className={`w-full h-full object-cover transition-all duration-700 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'} group-hover:scale-110`}
				loading="lazy"
			/>

			{/* Overlay content - only visible when loaded to avoid jumps */}
			<div
				className={`absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
			>
				<div
					className={`absolute bottom-0 left-0 p-6 ${isLast ? 'w-full h-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]' : ''}`}
				>
					{isLast ? (
						<>
							<div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-3">
								<Plus size={32} className="text-white" />
							</div>
							<p className="text-white font-display font-black text-xl uppercase tracking-tighter">
								Ver más
							</p>
						</>
					) : (
						<p className="text-white font-display font-bold text-sm lg:text-base drop-shadow-sm">
							{img.title}
						</p>
					)}
				</div>
			</div>

			<div className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300">
				<Maximize2 size={20} />
			</div>

			{/* Loading Spinner */}
			{!loaded && (
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="w-8 h-8 border-4 border-neverland-green/20 border-t-neverland-green rounded-full animate-spin"></div>
				</div>
			)}
		</motion.div>
	);
};

const Lightbox = ({ images, index, onClose, onPrev, onNext }) => {
	useEffect(() => {
		const handleEsc = (e) => e.key === 'Escape' && onClose();
		window.addEventListener('keydown', handleEsc);
		return () => window.removeEventListener('keydown', handleEsc);
	}, [onClose]);

	const [imgLoaded, setImgLoaded] = useState(false);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-100 bg-black/95 flex items-center justify-center p-4 backdrop-blur-lg"
			onClick={onClose}
		>
			<button
				onClick={onClose}
				className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-110"
			>
				<X size={32} />
			</button>

			<button
				onClick={(e) => {
					e.stopPropagation();
					onPrev();
					setImgLoaded(false);
				}}
				className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-2 z-110"
			>
				<ChevronLeft size={48} />
			</button>

			<motion.div
				key={index}
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				className="relative max-w-full max-h-full flex flex-col items-center"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="relative">
					{!imgLoaded && (
						<div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-lg animate-pulse">
							<div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
						</div>
					)}
					<img
						src={getUrl(images[index].id, 1600)}
						alt={images[index].title}
						onLoad={() => setImgLoaded(true)}
						className="max-w-[95vw] max-h-[80vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300"
					/>
				</div>
				<p className="text-white mt-6 font-display text-xl sm:text-2xl font-bold tracking-wide italic">
					{images[index].title}
				</p>
				<span className="text-white/30 mt-2 text-sm font-sans tracking-[0.2em] font-medium">
					{index + 1} / {images.length}
				</span>
			</motion.div>

			<button
				onClick={(e) => {
					e.stopPropagation();
					onNext();
					setImgLoaded(false);
				}}
				className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-2 z-110"
			>
				<ChevronRight size={48} />
			</button>
		</motion.div>
	);
};

const FacilitiesSection = () => {
	const { ref, controls, variants } = useScrollReveal();
	const [activeIdx, setActiveIdx] = useState(null);

	// Updated homeImages to 9 to fill a 4-col grid nicely (1 big=4 slots + 8 small = 12 total slots)
	const homeImages = allImages.slice(0, 9);

	const next = useCallback(
		() => setActiveIdx((p) => (p === allImages.length - 1 ? 0 : p + 1)),
		[],
	);
	const prev = useCallback(
		() => setActiveIdx((p) => (p === 0 ? allImages.length - 1 : p - 1)),
		[],
	);

	return (
		<section id="instalaciones" className="py-24 bg-cream-bg overflow-hidden">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<motion.div
					ref={ref}
					initial="hidden"
					animate={controls}
					variants={variants}
					className="text-center mb-16"
				>
					<div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-white rounded-full shadow-sm border border-neverland-green/5">
						<Camera size={18} className="text-energy-orange" />
						<span className="text-xs font-bold uppercase tracking-[0.2em] text-text-black">
							Galería Mágica
						</span>
					</div>
					<h2 className="text-4xl sm:text-6xl font-display font-black text-neverland-green mb-6">
						Nuestras Instalaciones
					</h2>
					<p className="text-text-muted max-w-2xl mx-auto text-lg leading-relaxed italic">
						Un espacio diseñado para que cada rincón cuente una historia de
						aventura.
					</p>
				</motion.div>

				{/* MOBILE VIEW */}
				<div className="block lg:hidden">
					<Swiper
						modules={[Pagination, Autoplay]}
						spaceBetween={15}
						slidesPerView={1.2}
						centeredSlides={true}
						loop={true}
						autoplay={{ delay: 3500, disableOnInteraction: false }}
						pagination={{ clickable: true }}
						className="facilities-swiper pb-14!"
					>
						{allImages.slice(0, 10).map((img, idx) => (
							<SwiperSlide key={img.id}>
								<div
									className="relative aspect-4/5 rounded-4xl overflow-hidden shadow-xl bg-gray-100"
									onClick={() => setActiveIdx(idx)}
								>
									<img
										src={getUrl(img.id, 600)}
										alt={img.title}
										className="w-full h-full object-cover"
									/>
									<div className="absolute inset-x-0 bottom-0 p-8 bg-linear-to-t from-black/80 via-black/20 to-transparent">
										<p className="text-white font-display font-bold text-xl">
											{img.title}
										</p>
									</div>
								</div>
							</SwiperSlide>
						))}
					</Swiper>
					<div className="mt-2 text-center">
						<button
							onClick={() => setActiveIdx(0)}
							className="bg-neverland-green text-white px-8 py-3 rounded-full font-display font-bold text-sm tracking-widest uppercase shadow-lg shadow-neverland-green/20"
						>
							Explorar Todas
						</button>
					</div>
				</div>

				{/* DESKTOP VIEW */}
				<div className="hidden lg:grid grid-cols-4 gap-6 auto-rows-[250px]">
					{/* First Big Card */}
					<GalleryCard
						img={allImages[0]}
						spanClass="col-span-2 row-span-2"
						onClick={() => setActiveIdx(0)}
					/>

					{/* Small Items 2-8 */}
					{homeImages.slice(1, 8).map((img, i) => (
						<GalleryCard
							key={img.id}
							img={img}
							onClick={() => setActiveIdx(i + 1)}
						/>
					))}

					{/* Last Item with "View More" Overlay */}
					<GalleryCard
						img={allImages[8]}
						onClick={() => setActiveIdx(8)}
						isLast={true}
					/>
				</div>
			</div>

			{/* LIGHTBOX */}
			<AnimatePresence>
				{activeIdx !== null && (
					<Lightbox
						images={allImages}
						index={activeIdx}
						onClose={() => setActiveIdx(null)}
						onNext={next}
						onPrev={prev}
					/>
				)}
			</AnimatePresence>

			<style
				dangerouslySetInnerHTML={{
					__html: `
				.facilities-swiper .swiper-pagination-bullet { background: #E5E7EB; opacity: 1; }
				.facilities-swiper .swiper-pagination-bullet-active { background: #24635A !important; width: 24px; border-radius: 4px; transition: all 0.3s ease; }
			`,
				}}
			/>
		</section>
	);
};

export default FacilitiesSection;
