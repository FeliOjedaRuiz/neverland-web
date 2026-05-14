import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { safeParseDate } from '../../utils/safeDate';
import { getPublicTalleres } from '../../services/api';
import TallerPublicCard from '../talleres/TallerPublicCard';

const TalleresSection = () => {
	const { ref: headerRef, controls, variants } = useScrollReveal();
	const [talleres, setTalleres] = useState([]);
	const [loading, setLoading] = useState(true);
	const sectionRef = useRef(null);
	const swiperRef = useRef(null);

	// Estados para sincronizar el IntersectionObserver con la inicialización de Swiper.
	// Sin esto hay una race condition: el observer se monta antes de que Swiper
	// termine de inicializarse, y cuando dispara swiperRef.current sigue siendo null.
	const [swiperReady, setSwiperReady] = useState(false);
	const [isSectionVisible, setIsSectionVisible] = useState(false);

	useEffect(() => {
		const fetchTalleres = async () => {
			try {
				const res = await getPublicTalleres({ incluirPasados: true });
				const all = res.data || [];

				const hoy = new Date();
				hoy.setHours(23, 59, 59, 999);

				const isFuture = (t) => {
					const f = safeParseDate(t.fecha);
					return f ? f >= hoy : false;
				};

				const proximos = all
					.filter(isFuture)
					.sort((a, b) => {
						const da = safeParseDate(a.fecha)?.getTime() || 0;
						const db = safeParseDate(b.fecha)?.getTime() || 0;
						return da - db;
					});

				const pasados = all
					.filter((t) => !isFuture(t))
					.sort((a, b) => {
						const da = safeParseDate(a.fecha)?.getTime() || 0;
						const db = safeParseDate(b.fecha)?.getTime() || 0;
						return db - da; // más recientes primero
					});

				// Combinar: hasta 4 próximos, completar con pasados si faltan
				const combinados = [
					...proximos.slice(0, 4),
					...pasados.slice(0, Math.max(0, 4 - proximos.length)),
				].map((t) => ({
					...t,
					_esPasado: !isFuture(t),
				}));

				setTalleres(combinados);
			} catch (err) {
				console.error('Error fetching talleres:', err);
			} finally {
				setLoading(false);
			}
		};
		fetchTalleres();
	}, []);

	// 1) Solo observa si la sección está visible — no toca el Swiper
	useEffect(() => {
		const el = sectionRef.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			([entry]) => setIsSectionVisible(entry.isIntersecting),
			{ threshold: 0.3 },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	// 2) Cuando Swiper ya está listo Y la visibilidad cambia, arranca/para el autoplay
	useEffect(() => {
		if (!swiperReady) return;
		const autoplay = swiperRef.current?.autoplay;
		if (!autoplay) return;

		if (isSectionVisible) {
			autoplay.start();
		} else {
			autoplay.stop();
		}
	}, [isSectionVisible, swiperReady]);

	// No renderizar nada si no hay talleres disponibles
	if (!loading && talleres.length === 0) {
		return null;
	}

	// Si hay 1 solo taller, no tiene sentido el carrusel — mostramos un grid simple
	const singleView = talleres.length <= 1;

	return (
		<section
			id="talleres"
			ref={sectionRef}
			className="relative py-20 sm:py-28 bg-cream-bg overflow-hidden"
		>
			{/* Decoración sutil de fondo: gradiente radial para dar profundidad sin distraer */}
			<div className="absolute inset-0 pointer-events-none" aria-hidden="true">
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neverland-green/[0.02] rounded-full blur-3xl" />
			</div>

			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Cabecera de la sección */}
				<motion.div
					ref={headerRef}
					initial="hidden"
					animate={controls}
					variants={variants}
					className="text-center mb-12 sm:mb-16"
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

				{/* Skeleton loaders mientras carga */}
				{loading ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						{[...Array(4)].map((_, i) => (
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
				) : singleView ? (
					/* Fallback: un solo taller → grid centrado sin carrusel */
					<div className="max-w-sm mx-auto">
						<TallerPublicCard taller={talleres[0]} pasado={talleres[0]._esPasado} />
					</div>
				) : talleres.length < 4 ? (
					/* Grid centrado cuando hay 2-3 talleres */
					<div className="flex flex-wrap justify-center gap-6">
						{talleres.map((taller) => (
							<div key={taller.id || taller._id} className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-sm">
								<TallerPublicCard taller={taller} pasado={taller._esPasado} />
							</div>
						))}
					</div>
				) : (
					<>
						{/* Carrusel Swiper */}
						<Swiper
							modules={[Autoplay, Pagination]}
							onSwiper={(swiper) => {
								swiperRef.current = swiper;
								// Iniciamos pausado; el useEffect de sincronización lo arranca
								swiper.autoplay.stop();
								setSwiperReady(true);
							}}
							autoplay={{
								delay: 4000,
								disableOnInteraction: false,
								pauseOnMouseEnter: true,
							}}
							pagination={{
								clickable: true,
								dynamicBullets: true,
							}}
							loop={talleres.length > 2}
							spaceBetween={20}
							breakpoints={{
								0: { slidesPerView: 1, spaceBetween: 16 },
								640: { slidesPerView: 2, spaceBetween: 20 },
								1024: { slidesPerView: 4, spaceBetween: 24 },
							}}
							className="talleres-carousel !pb-14"
						>
							{talleres.map((taller) => (
								<SwiperSlide key={taller.id || taller._id} className="h-auto">
									<TallerPublicCard taller={taller} pasado={taller._esPasado} />
								</SwiperSlide>
							))}
						</Swiper>

						{/* CTA: Ver todos los talleres */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4, duration: 0.5 }}
							className="text-center mt-10"
						>
							<Link
								to="/talleres"
								className="inline-flex items-center gap-2 px-6 py-3 bg-white text-neverland-green rounded-full font-display font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all border border-neverland-green/10 group"
							>
								Ver todos los talleres
								<ArrowRight
									size={16}
									className="group-hover:translate-x-1 transition-transform"
								/>
							</Link>
						</motion.div>
					</>
				)}
			</div>
		</section>
	);
};

export default TalleresSection;
