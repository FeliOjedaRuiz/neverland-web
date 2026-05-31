import React from 'react';
import { Cake, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

import { motion } from 'framer-motion';
import logo from '../../assets/neverland_logo.svg';

const HeroCard = ({ to, icon: Icon, accent, iconBg, iconColor, title, description, ctaText, cardBg }) => (
<Link
		to={to}
		className={`group relative flex-1 max-w-[360px] flex items-center ${cardBg} rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl active:scale-[0.97] max-sm:max-w-full max-sm:w-full`}
	>
		<div className="py-4 px-4 sm:px-4 flex flex-row items-center gap-2 sm:gap-3 w-full">
			<div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0`}>
				<Icon size={20} className={iconColor} />
			</div>

			<div className="flex-1 min-w-0">
				<h3 className="font-display font-bold text-[1rem] sm:text-[1.05rem] text-text-black leading-tight">
					{title}
				</h3>
			</div>

			<span className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full font-display font-semibold text-xs sm:text-sm transition-all duration-250 bg-gradient-to-r ${accent} text-white shadow-md group-hover:shadow-lg shrink-0`}>
				{ctaText}
				<ArrowRight size={14} className="transition-transform duration-250 group-hover:translate-x-1" />
			</span>
		</div>

		<div className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${accent}`} />
	</Link>
);

const HeroSection = () => {
	const CLOUDINARY_BASE =
		'https://res.cloudinary.com/dhdd7a5pr/image/upload/f_auto,q_auto,w_1920/neverland/home/portada';
	const images = [
		`${CLOUDINARY_BASE}/portada_1.jpg`,
		`${CLOUDINARY_BASE}/portada_2.jpg`,
		`${CLOUDINARY_BASE}/portada_3.jpg`,
		`${CLOUDINARY_BASE}/portada_4.jpg`,
		`${CLOUDINARY_BASE}/portada_5.jpg`,
		`${CLOUDINARY_BASE}/portada_6.jpg`,
	];

	return (
		<section
			id="home"
			className="relative mt-16 md:mt-20 h-[calc(100dvh-4rem)] md:h-[calc(100dvh-5rem)] min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden"
		>
			{/* Background Carousel */}
			<div className="absolute inset-0 z-0">
				<Swiper
					modules={[Autoplay, EffectFade, Pagination]}
					effect="fade"
					spaceBetween={0}
					slidesPerView={1}
					autoplay={{ delay: 4000, disableOnInteraction: false }}
					pagination={{ clickable: true }}
					loop={true}
					className="h-full w-full"
				>
					{images.map((img, index) => (
						<SwiperSlide key={index}>
							<div className="relative w-full h-full">
								<img
									src={img}
									alt={`Neverland Slide ${index + 1}`}
									className="w-full h-full object-cover object-center"
								/>
								<div className="absolute inset-0 bg-black/30"></div>
							</div>
						</SwiperSlide>
					))}
				</Swiper>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center w-full">
				<motion.img
					src={logo}
					alt="Neverland Logo"
					className="h-28 sm:h-40 lg:h-52 w-auto mb-4 sm:mb-6 drop-shadow-2xl"
					initial={{ opacity: 0, y: -20, scale: 0.8 }}
					animate={{
						opacity: 1,
						y: [0, -8, 0],
						scale: [1, 1.05, 1],
					}}
					transition={{
						opacity: { duration: 0.8 },
						y: {
							duration: 3,
							repeat: Infinity,
							ease: 'easeInOut',
						},
						scale: {
							duration: 4,
							repeat: Infinity,
							ease: 'easeInOut',
						},
					}}
				/>

				<h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white max-w-3xl mx-auto drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)] mb-1 sm:mb-2 tracking-tight">
					Parque Infantil en Cúllar Vega
				</h1>
				<p className="mt-1 sm:mt-2 text-base sm:text-xl md:text-2xl lg:text-3xl font-display font-semibold text-white max-w-2xl mx-auto mb-6 sm:mb-8 drop-shadow-md tracking-wide opacity-95">
					Donde los sueños se hacen realidad y la diversión nunca termina.
				</p>

				{/* Two Worlds Cards */}
				<motion.div
					className="flex flex-col sm:flex-row items-stretch justify-center gap-3 sm:gap-4 w-full max-w-[720px]"
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
				>
					<HeroCard
						to="/presupuesto"
						icon={Cake}
						accent="from-orange-400 to-energy-orange"
						iconBg="bg-orange-50"
						iconColor="text-energy-orange"
						title="Cumpleaños mágicos"
						description="Calcula tu presupuesto y reserva la fiesta perfecta en minutos."
						ctaText="Calcular precio"
						cardBg="bg-white/80 backdrop-blur-sm"
					/>
					<HeroCard
						to="/talleres"
						icon={Sparkles}
						accent="from-emerald-400 to-neverland-green"
						iconBg="bg-green-50"
						iconColor="text-neverland-green"
						title="Talleres creativos"
						description="Descubre las próximas sesiones temáticas e inscribe a los peques."
						ctaText="Ver talleres"
						cardBg="bg-white/80 backdrop-blur-sm"
					/>
				</motion.div>
			</div>
		</section>
	);
};

export default HeroSection;
