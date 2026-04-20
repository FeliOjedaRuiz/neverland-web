import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Image as ImageIcon, ChevronRight, Clock } from 'lucide-react';
import { getConfig } from '../services/api';
import SEO from '../components/common/SEO';
import { BUDGET_ASSETS } from '../constants/budgetAssets';

// --- Fallback defaults (igual que BudgetPage) ---
const DEFAULT_CONFIG = {
	menusNiños: [],
	plusFinDeSemana: 1.5,
	preciosAdultos: [],
	workshops: [],
	characters: [],
	preciosExtras: {
		tallerBase: 25,
		tallerPlus: 30,
		personaje: 40,
		pinata: 15,
		extension30: 30,
		extension60: 50,
	},
};

// --- Animación de entrada por sección ---
const sectionVariants = {
	hidden: { opacity: 0, y: 24 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

// --- Componente: Modal de imagen ampliada ---
const ImageModal = ({ item, onClose }) => {
	useEffect(() => {
		window.history.pushState({ modalOpen: true }, '');
		const handlePop = () => onClose();
		window.addEventListener('popstate', handlePop);
		return () => window.removeEventListener('popstate', handlePop);
	}, [onClose]);

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
				onClick={onClose}
			>
				<motion.div
					initial={{ scale: 0.9, opacity: 0, y: 20 }}
					animate={{ scale: 1, opacity: 1, y: 0 }}
					exit={{ scale: 0.9, opacity: 0, y: 20 }}
					transition={{ type: 'spring', damping: 25, stiffness: 300 }}
					className="bg-white rounded-[32px] overflow-hidden w-full max-w-md shadow-2xl relative"
					onClick={(e) => e.stopPropagation()}
				>
					<button
						onClick={onClose}
						className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/90 text-gray-900 shadow-xl flex items-center justify-center border border-gray-100 active:scale-90 transition-transform"
					>
						<X size={20} strokeWidth={3} />
					</button>
					<div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
						{item.imageUrl ? (
							<img src={item.imageUrl} alt={item.nombre || item.name} className="w-full h-full object-cover" />
						) : (
							<div className="w-full h-full flex items-center justify-center text-gray-200">
								<ImageIcon size={48} strokeWidth={1} />
							</div>
						)}
						<div className="absolute bottom-4 right-4 bg-energy-orange text-white px-4 py-2 rounded-2xl font-black text-xl shadow-lg shadow-energy-orange/20">
							{item.precio ?? item.price ?? item.priceBase}€
						</div>
					</div>
					<div className="p-6">
						<h3 className="text-xl font-display font-black text-text-black mb-1">{item.nombre || item.name}</h3>
						{item.unidades && (
							<p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{item.unidades}</p>
						)}
						{(item.principal || item.desc) && (
							<p className="mt-3 text-sm text-gray-600 leading-relaxed font-medium">{item.principal || item.desc}</p>
						)}
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
};

// --- Componente: Section Header ---
const SectionHeader = ({ emoji, title, subtitle, accentColor }) => (
	<div className="flex items-center gap-3 mb-5">
		<div className={`w-10 h-10 rounded-2xl ${accentColor} flex items-center justify-center text-xl shrink-0`}>
			{emoji}
		</div>
		<div>
			<h2 className="text-lg font-display font-black text-text-black leading-tight">{title}</h2>
			{subtitle && <p className="text-xs text-gray-400 font-medium mt-0.5">{subtitle}</p>}
		</div>
	</div>
);

// --- Componente: Tarjeta de menú (infantil y adulto) ---
const MenuCard = ({ item, onClick }) => (
	<motion.div
		whileHover={{ y: -2 }}
		whileTap={{ scale: 0.98 }}
		onClick={() => onClick(item)}
		className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all cursor-pointer flex gap-4 p-3"
	>
		{/* Thumbnail */}
		<div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100/50 shadow-sm relative group">
			{item.imageUrl ? (
				<img src={item.imageUrl} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
			) : (
				<div className="w-full h-full flex items-center justify-center text-gray-200">
					<ImageIcon size={22} />
				</div>
			)}
		</div>

		{/* Info */}
		<div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
			<div className="flex justify-between items-start gap-2">
				<h3 className="font-display font-black text-sm text-text-black leading-tight">{item.nombre}</h3>
				<div className="shrink-0 text-right">
					<span className="font-black text-base text-energy-orange">{item.precio ?? item.price}€</span>
					<span className="text-[10px] text-gray-400 font-bold block">/niño</span>
				</div>
			</div>

			{/* items en badges */}
			{item.resto && (
				<div className="flex flex-wrap gap-1 mt-1.5">
					{item.resto.split('\n').filter(i => i.trim()).slice(0, 3).map((it, i) => (
						<span key={i} className="bg-gray-50 text-[9px] px-2 py-0.5 rounded-full text-gray-500 font-bold border border-gray-100 flex items-center gap-1">
							<div className="w-1 h-1 rounded-full bg-energy-orange/40" />
							{it.replace(/^-/, '').trim()}
						</span>
					))}
				</div>
			)}

			{/* unidades (adultos) */}
			{item.unidades && (
				<p className="text-[11px] text-gray-400 font-medium mt-1">{item.unidades}</p>
			)}
		</div>
	</motion.div>
);

// --- Componente: Tarjeta hero (actividades / personajes) ---
const HeroCard = ({ title, subtitle, price, priceLabel, imageSrc, accentClass, pillItems }) => (
	<div className={`bg-white rounded-3xl border ${accentClass} shadow-sm overflow-hidden`}>
		<div className="relative aspect-[16/9] w-full bg-gray-100 overflow-hidden">
			{imageSrc ? (
				<img src={imageSrc} alt={title} className="w-full h-full object-cover" />
			) : (
				<div className="w-full h-full flex items-center justify-center text-gray-200">
					<ImageIcon size={36} strokeWidth={1} />
				</div>
			)}
			<div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
			<div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
				<div>
					<h3 className="text-white font-display font-black text-lg drop-shadow">{title}</h3>
					{subtitle && <p className="text-white/80 text-xs font-medium">{subtitle}</p>}
				</div>
				<div className="bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1.5 rounded-2xl text-right">
					<span className="text-white font-black text-xl drop-shadow">{price}€</span>
				</div>
			</div>
		</div>

		{pillItems && pillItems.length > 0 && (
			<div className="p-4 flex flex-wrap gap-2">
				{pillItems.map((pill, i) => (
					<span key={i} className={`text-xs font-bold px-3 py-1.5 rounded-full ${pill.style}`}>
						{pill.label}
					</span>
				))}
			</div>
		)}
		{priceLabel && !pillItems && (
			<p className="px-4 pb-4 text-xs text-gray-400 font-medium">{priceLabel}</p>
		)}
	</div>
);

// --- Componente: Tarjeta de extra compacta ---
const ExtraCard = ({ icon, title, subtitle, price, accentClass }) => (
	<div className={`bg-white rounded-2xl border ${accentClass} shadow-sm p-4 flex items-center gap-4`}>
		<div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-2xl shrink-0 border border-gray-100">
			{icon}
		</div>
		<div className="flex-1 min-w-0">
			<p className="font-bold text-gray-800 text-sm leading-tight">{title}</p>
			{subtitle && <p className="text-xs text-gray-400 font-medium mt-0.5">{subtitle}</p>}
		</div>
		<div className="text-right shrink-0">
			<span className="font-black text-lg text-gray-800">{price}€</span>
		</div>
	</div>
);

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
const PricingPage = () => {
	const [config, setConfig] = useState(DEFAULT_CONFIG);
	const [status, setStatus] = useState('loading'); // loading | success | error
	const [modalItem, setModalItem] = useState(null);

	useEffect(() => {
		// Garantizar que el usuario siempre empiece arriba, incluso al volver con el botón atrás
		try {
			window.scrollTo({ top: 0, behavior: 'instant' });
		} catch {
			window.scrollTop = 0;
		}
	}, []);

	useEffect(() => {
		getConfig()
			.then((res) => {
				if (res.data) {
					const data = res.data;
					const normalizeList = (list) =>
						(list || []).map((item) => {
							if (typeof item === 'string') return { id: item, nombre: item, name: item, suspended: false, imageUrl: '' };
							return { ...item, id: String(item.id || item._id || '') };
						});
					if (data.menusNiños) data.menusNiños = normalizeList(data.menusNiños);
					if (data.preciosAdultos) data.preciosAdultos = normalizeList(data.preciosAdultos);
					if (data.workshops) data.workshops = normalizeList(data.workshops);
					if (data.characters) data.characters = normalizeList(data.characters);
					setConfig((prev) => ({ ...prev, ...data }));
				}
				setStatus('success');
			})
			.catch(() => setStatus('error'));
	}, []);

	const closeModal = () => {
		setModalItem(null);
		if (window.history.state?.modalOpen) window.history.back();
	};

	const menusNiñosActivos = (config.menusNiños || []).filter((m) => !m.suspended && m.active !== false);
	const adultsActivos = (config.preciosAdultos || []).filter((m) => !m.suspended && m.active !== false);
	const extras = config.preciosExtras || DEFAULT_CONFIG.preciosExtras;

	return (
		<div className="min-h-dvh bg-cream-bg pb-20">
			<SEO
				title="Lista de Precios"
				description="Consulta todos los precios de las fiestas en Neverland Cúllar Vega: menús infantiles, adultos, actividades, personajes y extras."
			/>

			{/* ── HERO ── */}
			<motion.div
				initial={{ opacity: 0, y: -16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="pt-24 sm:pt-28 pb-8 px-4 text-center"
			>
				<span className="inline-block text-4xl mb-3">🎉</span>
				<h1 className="text-3xl sm:text-4xl font-display font-black text-neverland-green leading-tight">
					Nuestros Precios
				</h1>
				<p className="mt-2 text-sm sm:text-base text-gray-500 font-medium max-w-xs mx-auto leading-relaxed">
					Todo lo que incluye tu fiesta en Neverland, sin sorpresas
				</p>
			</motion.div>

			{/* ── CONTENIDO ── */}
			<div className="max-w-2xl mx-auto px-4 space-y-10">

				{status === 'loading' && (
					<div className="flex flex-col items-center justify-center py-20 gap-4">
						<div className="w-12 h-12 border-4 border-neverland-green/20 border-t-neverland-green rounded-full animate-spin" />
						<p className="text-gray-400 font-medium animate-pulse">Cargando precios...</p>
					</div>
				)}

				{status === 'error' && (
					<div className="flex flex-col items-center justify-center py-20 text-center gap-3">
						<span className="text-4xl">😕</span>
						<p className="text-gray-600 font-bold">No se pudieron cargar los precios.</p>
						<p className="text-gray-400 text-sm">Comprueba tu conexión e inténtalo de nuevo.</p>
					</div>
				)}

				{status === 'success' && (
					<>
						{/* ── MENÚS INFANTILES ── */}
						{menusNiñosActivos.length > 0 && (
							<motion.section
								variants={sectionVariants}
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true, margin: '-60px' }}
							>
								<SectionHeader
									emoji="🧸"
									title="Menús Infantiles"
									subtitle="Por niño invitado"
									accentColor="bg-orange-100"
								/>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
									{menusNiñosActivos.map((menu) => (
										<MenuCard key={menu.id} item={menu} onClick={setModalItem} />
									))}
								</div>
								{/* Nota fin de semana */}
								<div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
									<span className="text-lg">⚠️</span>
									<p className="text-xs text-energy-orange font-bold leading-snug">
										<span className="font-black">+{config.plusFinDeSemana ?? 1.5}€/niño</span> los viernes, sábados y domingos
									</p>
								</div>
							</motion.section>
						)}

						{/* ── MENÚS ADULTOS ── */}
						{adultsActivos.length > 0 && (
							<motion.section
								variants={sectionVariants}
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true, margin: '-60px' }}
							>
								<SectionHeader
									emoji="🍽️"
									title="Menús de Adultos"
									subtitle="Opciones de comida para mayores"
									accentColor="bg-orange-100"
								/>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									{adultsActivos.map((item) => (
										<MenuCard key={item.id} item={item} onClick={setModalItem} />
									))}
								</div>
							</motion.section>
						)}

						{/* ── ACTIVIDADES ── */}
						<motion.section
							variants={sectionVariants}
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true, margin: '-60px' }}
						>
							<SectionHeader
								emoji="✨"
								title="Actividades"
								subtitle="Un taller para toda la fiesta"
								accentColor="bg-blue-100"
							/>
							<HeroCard
								title="Taller / Actividad"
								subtitle="Dinámica especial para tus invitados"
								price={extras.tallerBase}
								imageSrc={BUDGET_ASSETS.TALLER_CIENTIFICO}
								accentClass="border-blue-100"
								pillItems={[
									{ label: `Hasta 15 niños: ${extras.tallerBase}€`, style: 'bg-blue-50 text-rec-blue border border-blue-100' },
									{ label: `16 o más niños: ${extras.tallerPlus}€`, style: 'bg-blue-100 text-rec-blue border border-blue-200' },
								]}
							/>
						</motion.section>

						{/* ── PERSONAJES ── */}
						<motion.section
							variants={sectionVariants}
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true, margin: '-60px' }}
						>
							<SectionHeader
								emoji="🌟"
								title="Visita de Personajes"
								subtitle="Actuación y fotos con los niños"
								accentColor="bg-green-100"
							/>
							<HeroCard
								title="Personaje en tu fiesta"
								subtitle="Actuación especial incluida"
								price={extras.personaje}
								imageSrc={BUDGET_ASSETS.PERSONAJE_KPOP}
								accentClass="border-green-100"
								pillItems={[
									{ label: '🎤 Actuación en directo', style: 'bg-green-50 text-neverland-green border border-green-100' },
									{ label: '📸 Fotos con los niños', style: 'bg-green-50 text-neverland-green border border-green-100' },
								]}
							/>
						</motion.section>

						{/* ── DURACIÓN BASE (puente contextual) ── */}
						<motion.div
							variants={sectionVariants}
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true, margin: '-60px' }}
							className="relative"
						>
							{/* Líneas decorativas laterales */}
							<div className="absolute inset-y-0 left-0 right-0 flex items-center">
								<div className="w-full border-t border-dashed border-gray-200" />
							</div>
							<div className="relative flex justify-center">
								<div className="bg-cream-bg px-4">
									<div className="bg-neverland-green/5 border border-neverland-green/15 rounded-2xl px-5 py-4 flex items-center gap-4">
										<div className="w-12 h-12 rounded-full bg-neverland-green/10 flex items-center justify-center shrink-0">
											<Clock size={22} className="text-neverland-green" />
										</div>
										<div>
											<p className="font-display font-black text-sm text-neverland-green leading-tight">
												Cada evento incluye 2 horas de diversión
											</p>
											<p className="text-xs text-gray-400 font-medium mt-0.5">
												¿Necesitas más tiempo? Mira las opciones de extensión
											</p>
										</div>
									</div>
								</div>
							</div>
						</motion.div>

						{/* ── EXTRAS ── */}
						<motion.section
							variants={sectionVariants}
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true, margin: '-60px' }}
						>
							<SectionHeader
								emoji="🎁"
								title="Extras"
								subtitle="Personaliza aún más tu celebración"
								accentColor="bg-yellow-100"
							/>
							<div className="space-y-3">
								<ExtraCard
									icon={<Clock size={22} className="text-purple-500" />}
									title="Extensión +30 min"
									subtitle="Amplía tu fiesta media hora más"
									price={extras.extension30}
									accentClass="border-purple-100 hover:border-purple-200 transition-colors"
								/>
								<ExtraCard
									icon={<Clock size={22} className="text-purple-600" />}
									title="Extensión +60 min"
									subtitle="Amplía tu fiesta una hora más"
									price={extras.extension60}
									accentClass="border-purple-100 hover:border-purple-200 transition-colors"
								/>
								<ExtraCard
									icon="🪅"
									title="Piñata Neverland"
									subtitle="Incluye caramelos y sorpresas"
									price={extras.pinata}
									accentClass="border-yellow-100 hover:border-sun-yellow transition-colors"
								/>
							</div>
						</motion.section>

						{/* ── CTA FINAL ── */}
						<motion.section
							variants={sectionVariants}
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true, margin: '-60px' }}
							className="pt-4"
						>
							<div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center">
								<span className="text-3xl mb-3 block">🚀</span>
								<h2 className="text-xl font-display font-black text-text-black mb-1">
									¿Te gusta lo que ves?
								</h2>
								<p className="text-sm text-gray-400 font-medium mb-6">
									Calcula el precio exacto de tu fiesta o consulta disponibilidad
								</p>
								<div className="flex flex-col sm:flex-row gap-3">
									<Link
										to="/presupuesto"
										className="flex-1 bg-energy-orange text-white px-5 py-4 rounded-2xl font-display font-black shadow-md shadow-energy-orange/20 hover:bg-[#E06D2E] transition-all active:scale-95 flex items-center justify-center gap-2"
									>
										🧮 Calcula tu Presupuesto
										<ChevronRight size={18} />
									</Link>
									<Link
										to="/booking"
										className="flex-1 text-neverland-green px-5 py-4 rounded-2xl font-display font-bold border-2 border-neverland-green/30 hover:border-neverland-green transition-all active:scale-95 flex items-center justify-center gap-2"
									>
										📅 Ver Disponibilidad
										<ChevronRight size={18} />
									</Link>
								</div>
							</div>
						</motion.section>
					</>
				)}
			</div>

			{/* Modal */}
			{modalItem && <ImageModal item={modalItem} onClose={closeModal} />}
		</div>
	);
};

export default PricingPage;
