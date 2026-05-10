import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
	CheckCircle2,
	Calendar,
	Clock,
	Euro,
	User,
	ExternalLink,
	ArrowLeft,
	Mail,
} from 'lucide-react';
import { safeParseDate, formatLongSafeDate } from '../../utils/safeDate';
import SEO from '../common/SEO';

const InscripcionResumen = () => {
	const location = useLocation();
	const { inscripcionData, taller } = location.state || {};

	if (!inscripcionData || !taller) {
		return <Navigate to="/talleres" replace />;
	}

	const fecha = safeParseDate(taller.fecha);
	const fechaFormateada = fecha ? formatLongSafeDate(taller.fecha) : '';

	// Generar URL de Google Calendar
	const generarGoogleCalendarUrl = () => {
		if (!taller.fecha || !taller.horario?.inicio || !taller.horario?.fin) return '#';

		const fechaObj = safeParseDate(taller.fecha);
		if (!fechaObj) return '#';

		const [horaInicio, minInicio] = taller.horario.inicio.split(':');
		const [horaFin, minFin] = taller.horario.fin.split(':');

		const inicio = new Date(fechaObj);
		inicio.setHours(parseInt(horaInicio), parseInt(minInicio), 0, 0);
		const fin = new Date(fechaObj);
		fin.setHours(parseInt(horaFin), parseInt(minFin), 0, 0);

		const formatGoogleDate = (date) => {
			return date
				.toISOString()
				.replace(/[-:]/g, '')
				.replace(/\.\d{3}/, '');
		};

		const params = new URLSearchParams({
			action: 'TEMPLATE',
			text: `Taller: ${taller.nombre}`,
			dates: `${formatGoogleDate(inicio)}/${formatGoogleDate(fin)}`,
			details: `Taller: ${taller.nombre}\nNiño: ${inscripcionData.nombreNiño}\nPrecio: ${taller.precio}€`,
			location: 'Neverland - C/ Las Palmeras, Cúllar Vega, Granada',
		});

		return `https://www.google.com/calendar/render?${params.toString()}`;
	};

	return (
		<>
			<SEO title="Inscripción Confirmada" />

			<div className="min-h-dvh bg-cream-bg flex items-center justify-center p-4">
				<motion.div
					initial={{ opacity: 0, scale: 0.95, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					transition={{ duration: 0.5, ease: 'easeOut' }}
					className="w-full max-w-lg"
				>
					<div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm text-center">
						{/* Icono de éxito */}
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
							className="w-20 h-20 bg-neverland-green/10 rounded-full flex items-center justify-center mx-auto mb-6"
						>
							<CheckCircle2
								size={40}
								className="text-neverland-green"
							/>
						</motion.div>

						<h1 className="text-2xl sm:text-3xl font-display font-black text-text-black mb-2">
							¡Inscripción confirmada!
						</h1>
						<p className="text-sm text-gray-500 mb-8">
							Te hemos enviado un email de confirmación a{' '}
							<span className="font-bold text-text-black">
								{inscripcionData.emailResponsable}
							</span>
						</p>

						{/* Resumen */}
						<div className="bg-gray-50/50 rounded-[24px] p-5 space-y-3 text-left mb-8">
							<h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center mb-4">
								Resumen de la inscripción
							</h3>

							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-xl bg-neverland-green/10 flex items-center justify-center text-neverland-green shrink-0">
									<User size={16} />
								</div>
								<div>
									<p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
										Niño
									</p>
									<p className="font-display font-black text-sm text-text-black">
										{inscripcionData.nombreNiño}
										{inscripcionData.edadNiño ? ` (${inscripcionData.edadNiño} años)` : ''}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-xl bg-neverland-green/10 flex items-center justify-center text-neverland-green shrink-0">
									<Calendar size={16} />
								</div>
								<div>
									<p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
										Taller
									</p>
									<p className="font-display font-black text-sm text-text-black">
										{taller.nombre}
									</p>
									<p className="text-[10px] text-gray-400 font-medium">
										{fechaFormateada}
									</p>
								</div>
							</div>

							{taller.horario?.inicio && (
								<div className="flex items-center gap-3">
									<div className="w-9 h-9 rounded-xl bg-energy-orange/10 flex items-center justify-center text-energy-orange shrink-0">
										<Clock size={16} />
									</div>
									<div>
										<p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
											Horario
										</p>
										<p className="font-display font-black text-sm text-text-black">
											{taller.horario.inicio} - {taller.horario.fin}
										</p>
									</div>
								</div>
							)}

							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-xl bg-energy-orange/10 flex items-center justify-center text-energy-orange shrink-0">
									<Euro size={16} />
								</div>
								<div>
									<p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
										Precio
									</p>
									<p className="font-display font-black text-sm text-energy-orange">
										{taller.precio}€
									</p>
								</div>
							</div>
						</div>

						{/* Botón Google Calendar */}
						<a
							href={generarGoogleCalendarUrl()}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center justify-center gap-2 w-full py-3.5 bg-white text-neverland-green rounded-2xl font-display font-black text-[10px] uppercase tracking-wider border-2 border-neverland-green/20 hover:bg-neverland-green hover:text-white hover:border-neverland-green transition-all shadow-sm mb-3 group"
						>
							<Calendar size={16} />
							Añadir a Google Calendar
							<ExternalLink
								size={12}
								className="group-hover:translate-x-0.5 transition-transform"
							/>
						</a>

						{/* Volver a talleres */}
						<Link
							to="/talleres"
							className="inline-flex items-center gap-2 text-gray-400 hover:text-neverland-green transition-colors font-display font-bold text-[10px] uppercase tracking-wider"
						>
							<ArrowLeft size={12} />
							Volver a talleres
						</Link>
					</div>
				</motion.div>
			</div>
		</>
	);
};

export default InscripcionResumen;
