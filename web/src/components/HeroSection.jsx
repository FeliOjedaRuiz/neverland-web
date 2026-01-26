import React from 'react';
import { CalendarDays } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

// Import local images (vite handles these imports by returning the path)
import img1 from '../assets/images/bolas 1.png';
import img2 from '../assets/images/Slime 1.jpg';
import img3 from '../assets/images/Captura de pantalla 2026-01-24 232919.png';
import img4 from '../assets/images/Captura de pantalla 2026-01-24 232942.png';

import { motion } from 'framer-motion';
import logo from '../assets/logo.svg';

const HeroSection = () => {
	const images = [img1, img2, img3, img4];

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
								<div className="absolute inset-0 bg-black/10"></div>
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

				<p className="mt-4 text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white max-w-xl mx-auto mb-10 drop-shadow-lg">
					Donde los sueños se hacen realidad y la diversión nunca termina.
				</p>

				<div className="flex flex-col sm:flex-row justify-center gap-6 animate-fade-in-up delay-200">
					<a
						href="#como-funciona"
						className="flex items-center justify-center gap-3 bg-energy-orange text-white px-8 py-3 rounded-full text-xl font-bold shadow-xl hover:bg-opacity-90 transition-all hover:scale-110 hover:-translate-y-1"
					>
						<CalendarDays size={28} />
						RESERVAR AHORA
					</a>
					<a
						href="#packs"
						className="px-10 py-3 rounded-full text-xl font-bold text-neverland-green bg-white/80 backdrop-blur-sm border-2 border-neverland-green hover:bg-neverland-green hover:text-white transition-all hover:scale-105 shadow-md"
					>
						Ver Packs
					</a>
				</div>
			</div>
		</section>
	);
};

export default HeroSection;
