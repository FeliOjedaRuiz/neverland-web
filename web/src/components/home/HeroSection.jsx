import React from 'react';
import { CalendarDays, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

import { motion } from 'framer-motion';
import logo from '../../assets/neverland_logo.svg';

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
								<div className="absolute inset-0 bg-black/20"></div>
							</div>
						</SwiperSlide>
					))}
				</Swiper>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center ">
				<motion.img
					src={logo}
					alt="Neverland Logo"
					className="h-32 sm:h-48 lg:h-64 w-auto mb-6 drop-shadow-2xl"
					initial={{ opacity: 0, y: -20, scale: 0.8 }}
					animate={{
						opacity: 1,
						y: [0, -15, 0],
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

				<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white max-w-3xl mx-auto drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)] mb-2 tracking-tight">
					Parque Infantil en Cúllar Vega
				</h1>
				<p className="mt-2 text-xl sm:text-2xl md:text-3xl font-display font-semibold text-white max-w-2xl mx-auto mb-10 drop-shadow-md tracking-wide">
					Donde los sueños se hacen realidad y la diversión nunca termina.
				</p>

				<div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up delay-200">
					<Link
						to="/presupuesto"
						className="flex items-center justify-center gap-3 bg-energy-orange text-white px-8 py-4 rounded-full text-xl font-display font-bold shadow-xl hover:bg-[#c95b22] transition-all hover:scale-110 hover:-translate-y-1 active:scale-95"
					>
						<Calculator size={28} />
						Calcula tu precio
					</Link>
					<Link
						to="/booking"
						className="flex items-center justify-center gap-2 px-8 py-4 rounded-full text-lg font-display font-bold text-white bg-neverland-green backdrop-blur-sm hover:bg-green-700 transition-all hover:scale-105 shadow-lg active:scale-95"
					>
						<CalendarDays size={22} />
						Ver disponibilidad
					</Link>
				</div>
			</div>
		</section>
	);
};

export default HeroSection;
