import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
	Loader2,
	Calendar,
	Clock,
	ArrowLeft,
	AlertCircle,
	ZoomIn,
	ImageIcon,
	ChevronLeft,
	X,
	Sparkles,
} from 'lucide-react';
import { getTallerById } from '../services/api';
import { safeParseDate } from '../utils/safeDate';
import SEO from '../components/common/SEO';
import InscripcionForm from '../components/talleres/InscripcionForm';
import ImageLightbox from '../components/common/ImageLightbox';

const TallerDetailPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [taller, setTaller] = useState(null);
	const [loading, setLoading] = useState(true);
	const [lightboxSrc, setLightboxSrc] = useState(null);
	const [showFormModal, setShowFormModal] = useState(false);

	const fetchTaller = useCallback(async () => {
		setLoading(true);
		try {
			const res = await getTallerById(id);
			setTaller(res.data);
		} catch (err) {
			console.error('Error fetching taller:', err);
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		fetchTaller();
	}, [fetchTaller]);

	// Bloquear scroll cuando el modal está abierto
	useEffect(() => {
		if (showFormModal) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => { document.body.style.overflow = ''; };
	}, [showFormModal]);

	const handleInscripcionSuccess = ({ inscripcionData, taller: tallerData }) => {
		setShowFormModal(false);
		navigate(`/talleres/${id}/confirmacion`, {
			state: { inscripcionData, taller: tallerData },
		});
	};

	const openLightbox = (src) => setLightboxSrc(src);
	const closeLightbox = () => setLightboxSrc(null);

	const isPasado = () => {
		if (!taller?.fecha) return false;
		const fecha = safeParseDate(taller.fecha);
		if (!fecha) return false;
		const hoy = new Date();
		hoy.setHours(23, 59, 59, 999);
		return fecha < hoy;
	};

	if (loading) {
		return (
			<div className="min-h-dvh flex items-center justify-center bg-cream-bg">
				<div className="flex flex-col items-center gap-4 text-gray-300">
					<Loader2 className="animate-spin text-neverland-green/40" size={48} />
					<p className="font-display font-black uppercase tracking-widest text-[10px]">
						Cargando taller...
					</p>
				</div>
			</div>
		);
	}

	if (!taller) {
		return (
			<div className="min-h-dvh flex items-center justify-center bg-cream-bg">
				<div className="text-center px-4">
					<div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
						<ImageIcon size={28} className="text-gray-300" />
					</div>
					<p className="font-display font-black text-lg text-gray-400 mb-4">
						Taller no encontrado
					</p>
					<Link
						to="/talleres"
						className="inline-flex items-center gap-1.5 text-neverland-green font-bold text-sm hover:underline"
					>
						<ChevronLeft size={14} />
						Ver todos los talleres
					</Link>
				</div>
			</div>
		);
	}

	/* ── Fecha con formato del admin ── */
	const date = safeParseDate(taller.fecha);
	const fechaFormateada = date
		? `${date.toLocaleDateString('es-ES', { weekday: 'long' }).replace(/^\w/, (c) => c.toUpperCase())}, ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`
		: '';

	const numInscripciones = taller.numInscripciones || taller.inscripciones?.length || 0;
	const restantes = taller.aforo - numInscripciones;
	const pasado = isPasado();
	const aforoCompleto = numInscripciones >= taller.aforo;
	const bloqueado = pasado || aforoCompleto;

	return (
		<>
			<SEO title={taller.nombre} description={taller.descripcion || `Taller ${taller.nombre} en Neverland.`} />

			{/* Lightbox de imagen */}
			{lightboxSrc && (
				<ImageLightbox src={lightboxSrc} alt={taller.nombre} onClose={closeLightbox} />
			)}

			{/* ═══════════════════════════════════════════
			    MODAL DEL FORMULARIO
			    ═══════════════════════════════════════════ */}
			{showFormModal && (
				<div
					className="fixed inset-0 z-50 flex items-start justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm"
					onClick={() => setShowFormModal(false)}
				>
					<div
						className="w-full max-w-lg bg-white rounded-3xl shadow-2xl max-h-[90dvh] overflow-y-auto"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header del modal */}
						<div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between z-10">
							<div>
								<h3 className="font-display font-black text-lg text-text-black">
									Inscribir niño
								</h3>
								<p className="text-[10px] text-gray-400 font-medium">
									{taller.nombre}
								</p>
							</div>
							<button
								onClick={() => setShowFormModal(false)}
								className="p-2 rounded-full hover:bg-gray-100 transition-colors"
								aria-label="Cerrar"
							>
								<X size={20} className="text-gray-400" />
							</button>
						</div>

						{/* Form */}
						<div className="p-6">
							<InscripcionForm
								taller={taller}
								onSuccess={handleInscripcionSuccess}
								plain
							/>
						</div>
					</div>
				</div>
			)}

			{/* ═══════════════════════════════════════════
			    PÁGINA
			    ═══════════════════════════════════════════ */}
			<div className="min-h-dvh bg-cream-bg">

				{/* ── HERO: poster recortado a horizontal ── */}
				<div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-gray-200 overflow-hidden">
					{taller.portada ? (
						<>
							{/* Contenedor clickeable: div en vez de button para evitar stacking issues */}
							<div
								onClick={() => openLightbox(taller.portada)}
								className="group absolute inset-0 cursor-zoom-in"
								aria-label="Ampliar imagen de portada"
								role="button"
								tabIndex={0}
								onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openLightbox(taller.portada); }}
							>
								<img
									src={taller.portada}
									alt={taller.nombre}
									className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
								/>
								{/* Gradiente sutil abajo */}
								<div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

								{/* Indicador desktop: bottom-right, hover */}
								<div className="absolute bottom-4 right-4 hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
									<ZoomIn size={12} />
									Ver completa
								</div>
							</div>

							{/* Indicador móvil: mismo estilo glass que el desktop */}
							<button
								onClick={(e) => {
									e.stopPropagation();
									openLightbox(taller.portada);
								}}
								className="absolute top-[4.25rem] md:top-[5.25rem] right-3 md:hidden z-10 flex items-center justify-center w-10 h-10 bg-black/40 backdrop-blur-md rounded-full border border-white/20 shadow-lg"
								aria-label="Ampliar imagen de portada"
							>
								<ZoomIn size={18} className="text-white drop-shadow-md" />
							</button>
						</>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200">
							<ImageIcon size={48} className="text-gray-300" />
						</div>
					)}

					{/* Breadcrumb flotante */}
					<div className="absolute top-4 left-4 z-10">
						<Link
							to="/talleres"
							className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-black/40 transition-all border border-white/20"
						>
							<ArrowLeft size={12} />
							Talleres
						</Link>
					</div>
				</div>

				{/* ── CONTENIDO ── */}
				<div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-6 relative z-10 pb-16 space-y-5">

					{/* Título + Meta + Descripción (unida en una sola card) */}
					<div className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-100 shadow-soft">
						{/* Header */}
						<h1 className="text-3xl sm:text-4xl font-display font-black text-text-black leading-tight mb-4">
							{taller.nombre}
						</h1>

						<div className="flex flex-wrap items-center gap-2">
							{fechaFormateada && (
								<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neverland-green/5 rounded-xl text-[11px] font-bold text-neverland-green border border-neverland-green/10">
									<Calendar size={12} />
									{fechaFormateada}
								</span>
							)}
							{taller.horario?.inicio && (
								<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xl text-[11px] font-bold text-gray-600">
									<Clock size={12} className="text-gray-400" />
									{taller.horario.inicio} – {taller.horario.fin}
								</span>
							)}
							<span className="inline-flex items-center gap-1 px-3 py-1.5 bg-energy-orange/10 rounded-xl text-[11px] font-black text-energy-orange">
								{taller.precio}€ /niño
							</span>
						</div>

						{/* Descripción (solo si existe) */}
						{taller.descripcion && (
							<div className="mt-5 pt-5 border-t border-gray-100">
								<h2 className="flex items-center gap-2 text-sm font-display font-black text-neverland-green mb-3">
									<Sparkles size={16} className="text-sun-yellow" />
									Sobre el taller
								</h2>
								<p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
									{taller.descripcion}
								</p>
							</div>
						)}
					</div>

					{/* Galería */}
					{taller.galeria?.length > 0 && (
						<div className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-100 shadow-soft">
							<h2 className="text-sm font-display font-black text-gray-400 mb-4">
								Galería
							</h2>
							<div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
								{taller.galeria.map((url, idx) => (
									<button
										key={idx}
										onClick={() => openLightbox(url)}
										className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-neverland-green/30"
										aria-label={`Ampliar imagen ${idx + 1} de la galería`}
									>
										<img
											src={url}
											alt={`${taller.nombre} — ${idx + 1}`}
											className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
											loading="lazy"
										/>
										<div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300 flex items-center justify-center">
											<ZoomIn
												size={16}
												className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg"
											/>
										</div>
									</button>
								))}
							</div>
						</div>
					)}

					{/* ── CTA / Estado ── */}
					<div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-soft text-center space-y-4">
						{pasado ? (
							<div className="flex items-center justify-center gap-2 text-gray-400">
								<AlertCircle size={18} />
								<span className="text-sm font-bold">Este taller ya ha finalizado</span>
							</div>
						) : aforoCompleto ? (
							<div className="flex items-center justify-center gap-2 text-red-500">
								<AlertCircle size={18} />
								<span className="text-sm font-bold">Aforo completo</span>
							</div>
						) : (
							<>
								{restantes <= 5 && (
									<div className="inline-flex items-center gap-2 px-4 py-2 bg-energy-orange/10 rounded-2xl border border-energy-orange/20">
										<AlertCircle size={16} className="text-energy-orange" />
										<span className="font-display font-black text-sm text-energy-orange">
											¡Últim{restantes === 1 ? 'a' : 'as'} {restantes} plaza{restantes !== 1 ? 's' : ''}!
										</span>
									</div>
								)}

								<button
									onClick={() => setShowFormModal(true)}
									className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-neverland-green text-white rounded-2xl font-display font-black text-base uppercase tracking-wider shadow-lg shadow-neverland-green/20 hover:shadow-xl hover:shadow-neverland-green/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-200"
								>
									<Sparkles size={18} className="text-sun-yellow" />
									Inscribir niño
								</button>

								<p className="text-[10px] text-gray-400 font-medium">
									Rápido y sin compromiso
								</p>
							</>
						)}
					</div>

					{/* Volver */}
					<div className="text-center pt-2 pb-6">
						<Link
							to="/talleres"
							className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-neverland-green transition-colors"
						>
							<ArrowLeft size={12} />
							Volver a talleres
						</Link>
					</div>

				</div>
			</div>
		</>
	);
};

export default TallerDetailPage;
