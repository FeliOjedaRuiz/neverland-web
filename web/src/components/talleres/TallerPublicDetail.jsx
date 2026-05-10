import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
	Loader2,
	Calendar,
	Clock,
	Euro,
	Users,
	ImageIcon,
	ArrowLeft,
	ChevronRight,
	AlertCircle,
	MapPin,
} from 'lucide-react';
import { getTallerById } from '../../services/api';
import { safeParseDate, formatLongSafeDate } from '../../utils/safeDate';
import SEO from '../common/SEO';
import InscripcionForm from './InscripcionForm';

const AforoBadge = ({ numInscripciones, aforo }) => {
	const plazasRestantes = aforo - numInscripciones;

	if (numInscripciones >= aforo) {
		return (
			<div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 rounded-2xl border border-red-100">
				<AlertCircle size={18} className="text-red-500 shrink-0" />
				<div>
					<p className="font-display font-black text-sm text-red-600">
						Aforo completo
					</p>
					<p className="text-[10px] text-red-400 font-medium">
						Este taller ya no admite más inscripciones
					</p>
				</div>
			</div>
		);
	}

	if (plazasRestantes <= 5 && plazasRestantes > 0) {
		return (
			<div className="flex items-center gap-2 px-4 py-2.5 bg-energy-orange/10 rounded-2xl border border-energy-orange/20">
				<Users size={18} className="text-energy-orange shrink-0" />
				<div>
					<p className="font-display font-black text-sm text-energy-orange">
						Últim{plazasRestantes === 1 ? 'o' : 'os'} {plazasRestantes} lugar{plazasRestantes !== 1 ? 'es' : ''}
					</p>
					<p className="text-[10px] text-energy-orange/70 font-medium">
						{numInscripciones} de {aforo} inscritos
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2 px-4 py-2.5 bg-neverland-green/10 rounded-2xl border border-neverland-green/20">
			<Users size={18} className="text-neverland-green shrink-0" />
			<div>
				<p className="font-display font-black text-sm text-neverland-green">
					{plazasRestantes} plaza{plazasRestantes !== 1 ? 's' : ''} disponible{plazasRestantes !== 1 ? 's' : ''}
				</p>
				<p className="text-[10px] text-neverland-green/70 font-medium">
					{numInscripciones} de {aforo} inscritos
				</p>
			</div>
		</div>
	);
};

const TallerPublicDetail = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [taller, setTaller] = useState(null);
	const [loading, setLoading] = useState(true);
	const [inscribed, setInscribed] = useState(false);

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

	const handleInscripcionSuccess = ({ inscripcionData, taller: tallerData }) => {
		setInscribed(true);
		navigate(`/talleres/${id}/confirmacion`, {
			state: { inscripcionData, taller: tallerData },
		});
	};

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
				<div className="text-center">
					<p className="font-display font-black text-lg text-gray-400 mb-4">
						Taller no encontrado
					</p>
					<Link
						to="/talleres"
						className="text-neverland-green underline font-bold text-sm"
					>
						Ver todos los talleres
					</Link>
				</div>
			</div>
		);
	}

	const fechaFormateada = taller.fecha ? formatLongSafeDate(taller.fecha) : '';
	const numInscripciones = taller.numInscripciones || taller.inscripciones?.length || 0;
	const pasado = isPasado();
	const aforoCompleto = numInscripciones >= taller.aforo;

	return (
		<>
			<SEO
				title={taller.nombre}
				description={
					taller.descripcion ||
					`Taller ${taller.nombre} en Neverland. ${fechaFormateada}. Precio: ${taller.precio}€/niño.`
				}
			/>

			<div className="min-h-dvh bg-cream-bg">
				{/* Hero / Portada */}
				<div className="relative h-56 sm:h-72 lg:h-96 bg-gray-200 overflow-hidden">
					{taller.portada ? (
						<img
							src={taller.portada}
							alt={taller.nombre}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center">
							<ImageIcon size={64} className="text-gray-300" />
						</div>
					)}
					<div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

					{/* Breadcrumb */}
					<div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
						<Link
							to="/talleres"
							className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-white/30 transition-all border border-white/20"
						>
							<ArrowLeft size={12} />
							Talleres
						</Link>
					</div>

					{/* Título en hero */}
					<div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 right-4 z-10">
						<h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white drop-shadow-lg leading-tight">
							{taller.nombre}
						</h1>
						<div className="flex flex-wrap items-center gap-2 mt-2">
							<span className="flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-[9px] font-black uppercase tracking-wider">
								<Calendar size={10} />
								{fechaFormateada}
							</span>
							{taller.horario?.inicio && (
								<span className="flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-[9px] font-black uppercase tracking-wider">
									<Clock size={10} />
									{taller.horario.inicio} - {taller.horario.fin}
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Contenido */}
				<div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-20 pb-16">
					<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
						{/* Columna izquierda — Info */}
						<div className="lg:col-span-3 space-y-6">
							{/* Descripción */}
							{taller.descripcion && (
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm"
								>
									<h2 className="font-display font-black text-base text-text-black mb-3">
										Sobre el taller
									</h2>
									<p className="text-sm text-gray-600 leading-relaxed">
										{taller.descripcion}
									</p>
								</motion.div>
							)}

							{/* Galería */}
							{taller.galeria && taller.galeria.length > 0 && (
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.05 }}
									className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm"
								>
									<h2 className="font-display font-black text-base text-text-black mb-4">
										Galería de imágenes
									</h2>
									<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
										{taller.galeria.map((url, idx) => (
											<div
												key={idx}
												className="aspect-square rounded-2xl overflow-hidden bg-gray-100"
											>
												<img
													src={url}
													alt={`${taller.nombre} - Imagen ${idx + 1}`}
													className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
												/>
											</div>
										))}
									</div>
								</motion.div>
							)}
						</div>

						{/* Columna derecha — Sidebar */}
						<div className="lg:col-span-2 space-y-4">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.1 }}
								className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-4 sticky top-24"
							>
								{/* Precio */}
								<div className="flex items-center justify-between">
									<span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
										Precio
									</span>
									<span className="font-display font-black text-2xl text-energy-orange">
										{taller.precio}€
										<span className="text-sm text-gray-400 font-medium">
											/niño
										</span>
									</span>
								</div>

								{/* Turnos */}
								{taller.turnos && taller.turnos.length > 0 && (
									<div>
										<span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
											Turnos
										</span>
										<div className="flex gap-1.5">
											{taller.turnos.map((t) => (
												<span
													key={t}
													className="px-3 py-1.5 bg-gray-50 rounded-xl text-[9px] font-black uppercase tracking-wider text-gray-500 border border-gray-100"
												>
													{t}
												</span>
											))}
										</div>
									</div>
								)}

								{/* Separador */}
								<div className="border-t border-gray-50" />

								{/* Indicador de aforo */}
								<AforoBadge
									numInscripciones={numInscripciones}
									aforo={taller.aforo}
								/>

								{/* Formulario de inscripción o mensaje de bloqueo */}
								{pasado ? (
									<div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
										<AlertCircle size={16} className="text-gray-400 shrink-0" />
										<p className="text-sm font-medium text-gray-500">
											Este taller ya ha finalizado
										</p>
									</div>
								) : aforoCompleto ? null : (
									<div className="pt-2">
										<InscripcionForm
											taller={taller}
											onSuccess={handleInscripcionSuccess}
										/>
									</div>
								)}
							</motion.div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default TallerPublicDetail;
