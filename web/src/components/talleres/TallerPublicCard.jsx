import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ImageIcon } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { safeParseDate } from '../../utils/safeDate';

/**
 * Indicador de plazas restantes.
 * Solo se muestra cuando quedan ≤5 plazas o cuando el aforo está completo.
 * Si hay más de 5 plazas libres, no se renderiza nada — no queremos
 * dar la impresión de que el taller está "vacío".
 */
const AforoIndicator = ({ numInscripciones, aforo }) => {
	const plazasRestantes = (aforo || 0) - (numInscripciones || 0);

	if (plazasRestantes <= 0) {
		return (
			<span className="inline-flex items-center px-2.5 py-1 bg-red-50 text-red-500 rounded-full text-[10px] font-black uppercase tracking-wider border border-red-100">
				Aforo completo
			</span>
		);
	}

	if (plazasRestantes <= 5) {
		return (
			<span className="inline-flex items-center px-2.5 py-1 bg-energy-orange/10 text-energy-orange rounded-full text-[10px] font-black uppercase tracking-wider border border-energy-orange/20">
				¡Últim{plazasRestantes === 1 ? 'o' : 'os'} {plazasRestantes} lugar
				{plazasRestantes !== 1 ? 'es' : ''}!
			</span>
		);
	}

	// Más de 5 plazas → no mostramos nada
	return null;
};

const TallerPublicCard = ({ taller, pasado = false }) => {
	const { ref, controls } = useScrollReveal(0.15);

	const fecha = safeParseDate(taller.fecha);

	// Fecha corta para el badge flotante: "15 MAR", "3 ABR"
	const fechaCorta = fecha
		? fecha
				.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
				.replace('.', '')
				.toUpperCase()
		: '';

	// Hora para el badge
	const horaStr =
		taller.horario?.inicio && taller.horario?.fin
			? `${taller.horario.inicio} – ${taller.horario.fin}`
			: '';

	const precioFormateado = `${taller.precio}€/niño`;
	const numInscripciones =
		taller.numInscripciones || taller.inscripciones?.length || 0;

	const cardInner = (
		<div
			className={`group flex flex-col bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 h-full ${
				pasado
					? 'grayscale cursor-default'
					: 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer'
				}`}
		>
			{/* ── Imagen de portada ── */}
			<div className="relative h-48 sm:h-56 shrink-0 overflow-hidden bg-gray-100">
				{taller.portada ? (
					<img
						src={taller.portada}
						alt={taller.nombre}
						className={`w-full h-full object-cover ${
							pasado ? '' : 'group-hover:scale-110 transition-transform duration-700'
						}`}
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center">
						<ImageIcon size={40} className="text-gray-200" />
					</div>
				)}

				{/* Overlay oscuro al hover (solo si no es pasado) */}
				{!pasado && (
					<div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
				)}

				{/* Badge flotante: FECHA + HORA */}
				<div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg text-center min-w-[72px]">
					<span className="block font-display font-black text-neverland-green text-sm leading-tight">
						{fechaCorta}
					</span>
					{horaStr && (
						<span className="block font-sans text-text-muted text-[10px] leading-tight mt-0.5">
							{horaStr}
						</span>
					)}
				</div>
			</div>

			{/* ── Contenido ── */}
			<div className="p-5 flex flex-col flex-1">
				{/* Fila 1: Nombre + Precio en la misma línea */}
				<div className="flex items-start justify-between gap-2 mb-2 min-w-0">
					<h3 className={`font-display font-black text-lg text-text-black leading-tight truncate flex-1 min-w-0 ${
						pasado ? '' : 'group-hover:text-neverland-green transition-colors'
					}`}>
						{taller.nombre}
					</h3>
					<span className="font-display font-black text-energy-orange text-base shrink-0 mt-0.5">
						{precioFormateado}
					</span>
				</div>

				{/* Descripción (si existe) */}
				{taller.descripcion && (
					<p className="text-text-muted text-sm leading-relaxed line-clamp-2 mb-3">
						{taller.descripcion}
					</p>
				)}

				{/* Aforo — solo si quedan ≤5 plazas o completo (y no es pasado) */}
				{!pasado && (
					<AforoIndicator
						numInscripciones={numInscripciones}
						aforo={taller.aforo}
					/>
				)}

				{/* Espaciador flexible: empuja el botón al fondo de la card */}
				<div className="flex-1 min-h-[4px]" />

				{/* Botón CTA visual */}
				<div
					className={`mt-3 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-2xl font-display font-bold text-sm ${
						pasado
							? 'bg-gray-100 text-gray-400'
							: 'bg-neverland-green/5 text-neverland-green group-hover:bg-neverland-green group-hover:text-white transition-all duration-300'
					}`}
				>
					{pasado ? 'Finalizado' : '¡Inscríbete aquí!'}
					{!pasado && (
						<ArrowRight
							size={15}
							className="group-hover:translate-x-1 transition-transform"
						/>
					)}
				</div>
			</div>
		</div>
	);

	return (
		<motion.div
			ref={ref}
			initial="hidden"
			animate={controls}
			variants={{
				hidden: { opacity: 0, y: 50 },
				visible: {
					opacity: 1,
					y: 0,
					transition: { duration: 0.5 },
				},
			}}
			className="h-full"
		>
			{pasado ? (
				cardInner
			) : (
				<Link
					to={`/talleres/${taller.id || taller._id}`}
					className="block h-full"
				>
					{cardInner}
				</Link>
			)}
		</motion.div>
	);
};

export default TallerPublicCard;
