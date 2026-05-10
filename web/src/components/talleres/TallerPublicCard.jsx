import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Euro, Users, ImageIcon } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { safeParseDate, formatLongSafeDate } from '../../utils/safeDate';

const AforoIndicator = ({ numInscripciones, aforo }) => {
	const plazasRestantes = aforo - numInscripciones;

	if (numInscripciones >= aforo) {
		return (
			<span className="px-2.5 py-1 bg-red-50 text-red-500 rounded-full text-[9px] font-black uppercase tracking-wider border border-red-100">
				Aforo completo
			</span>
		);
	}

	if (plazasRestantes <= 5 && plazasRestantes > 0) {
		return (
			<span className="px-2.5 py-1 bg-energy-orange/10 text-energy-orange rounded-full text-[9px] font-black uppercase tracking-wider border border-energy-orange/20">
				Últim{plazasRestantes === 1 ? 'o' : 'os'} {plazasRestantes} lugar{plazasRestantes !== 1 ? 'es' : ''}
			</span>
		);
	}

	return (
		<span className="px-2.5 py-1 bg-neverland-green/10 text-neverland-green rounded-full text-[9px] font-black uppercase tracking-wider border border-neverland-green/20">
			{plazasRestantes} plazas disponibles
		</span>
	);
};

const TallerPublicCard = ({ taller }) => {
	const { ref, controls } = useScrollReveal(0.15);

	const fecha = safeParseDate(taller.fecha);
	const fechaFormateada = fecha ? formatLongSafeDate(taller.fecha) : '';
	const precioFormateado = `${taller.precio}€/niño`;

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
		>
			<Link
				to={`/talleres/${taller.id || taller._id}`}
				className="group block bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
			>
				{/* Imagen de portada */}
				<div className="relative h-48 sm:h-56 overflow-hidden bg-gray-100">
					{taller.portada ? (
						<img
							src={taller.portada}
							alt={taller.nombre}
							className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center">
							<ImageIcon size={40} className="text-gray-200" />
						</div>
					)}
					<div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

					{/* Badge de precio flotante */}
					<div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg">
						<span className="font-display font-black text-energy-orange text-sm">
							{precioFormateado}
						</span>
					</div>
				</div>

				{/* Contenido */}
				<div className="p-5 space-y-3">
					<h3 className="font-display font-black text-lg text-text-black group-hover:text-neverland-green transition-colors leading-tight">
						{taller.nombre}
					</h3>

					<div className="flex flex-wrap gap-3 text-[11px] text-gray-500 font-medium">
						<div className="flex items-center gap-1.5">
							<Calendar size={14} className="text-gray-300" />
							<span>{fechaFormateada}</span>
						</div>
						{taller.horario?.inicio && (
							<div className="flex items-center gap-1.5">
								<Clock size={14} className="text-gray-300" />
								<span>
									{taller.horario.inicio} - {taller.horario.fin}
								</span>
							</div>
						)}
					</div>

					{taller.turnos && taller.turnos.length > 0 && (
						<div className="flex gap-1.5">
							{taller.turnos.map((t) => (
								<span
									key={t}
									className="px-2 py-0.5 bg-gray-50 text-gray-400 rounded-md text-[8px] font-black uppercase tracking-wider border border-gray-100"
								>
									{t}
								</span>
							))}
						</div>
					)}

					<div className="flex items-center justify-between pt-2 border-t border-gray-50">
						<AforoIndicator
							numInscripciones={taller.numInscripciones || taller.inscripciones?.length || 0}
							aforo={taller.aforo}
						/>
						<div className="flex items-center gap-1 text-gray-300 text-[10px] font-medium">
							<Users size={12} />
							<span>{taller.aforo} plazas</span>
						</div>
					</div>
				</div>
			</Link>
		</motion.div>
	);
};

export default TallerPublicCard;
