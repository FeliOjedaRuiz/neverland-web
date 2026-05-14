import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle2, Calendar, Clock, User, ExternalLink, ArrowLeft } from 'lucide-react';
import { safeParseDate } from '../../utils/safeDate';
import SEO from '../common/SEO';

const formatFecha = (fechaStr) => {
	const date = safeParseDate(fechaStr);
	if (!date) return '';
	const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' }).replace(/^\w/, (c) => c.toUpperCase());
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = String(date.getFullYear()).slice(-2);
	return `${weekday}, ${day}/${month}/${year}`;
};

const generarGoogleCalendarUrl = (taller) => {
	if (!taller.fecha || !taller.horario?.inicio || !taller.horario?.fin) return '#';
	const fechaObj = safeParseDate(taller.fecha);
	if (!fechaObj) return '#';
	const [hI, mI] = taller.horario.inicio.split(':').map(Number);
	const [hF, mF] = taller.horario.fin.split(':').map(Number);
	const inicio = new Date(fechaObj); inicio.setHours(hI, mI, 0, 0);
	const fin = new Date(fechaObj); fin.setHours(hF, mF, 0, 0);
	const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: `Taller: ${taller.nombre}`,
		dates: `${fmt(inicio)}/${fmt(fin)}`,
		details: `Taller: ${taller.nombre}\n${taller.descripcion || ''}`,
		location: 'Neverland - C/ Las Palmeras, Cúllar Vega, Granada',
	});
	return `https://www.google.com/calendar/render?${params.toString()}`;
};

const InscripcionResumen = () => {
	const location = useLocation();
	const { inscripcionData, taller } = location.state || {};

	if (!inscripcionData || !taller) {
		return <Navigate to="/talleres" replace />;
	}

	const fechaFormateada = formatFecha(taller.fecha);
	const horaStr = taller.horario?.inicio ? `${taller.horario.inicio} – ${taller.horario.fin}` : '';

	return (
		<>
			<SEO title="Inscripción Confirmada" />

			<div className="min-h-dvh bg-cream-bg">
				<div className="pt-24 sm:pt-28 pb-16 px-4">
					<div className="max-w-lg mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-soft space-y-5">

						{/* Éxito */}
						<div className="text-center space-y-3">
							<CheckCircle2 size={44} className="text-neverland-green mx-auto" />
							<h1 className="text-2xl sm:text-3xl font-display font-black text-text-black">
								¡Inscripción confirmada!
							</h1>
							<p className="text-sm text-gray-500">
								Te hemos enviado un email de confirmación a{' '}
								<span className="font-bold text-text-black">{inscripcionData.emailResponsable}</span>
							</p>
						</div>

						<div className="border-t border-gray-100" />

						{/* Nombre del taller — destacado */}
						<h2 className="text-2xl sm:text-3xl font-display font-black text-energy-orange text-center leading-tight">
							{taller.nombre}
						</h2>

						{/* Datos — iconos sin fondo */}
						<div className="space-y-3">
							<div className="flex items-center gap-2.5">
								<Calendar size={17} className="text-neverland-green shrink-0" />
								<span className="text-sm text-gray-700">{fechaFormateada}</span>
							</div>

							{horaStr && (
								<div className="flex items-center gap-2.5">
									<Clock size={17} className="text-neverland-green shrink-0" />
									<span className="text-sm text-gray-700">{horaStr}</span>
								</div>
							)}

							<div className="flex items-center gap-2.5">
								<User size={17} className="text-neverland-green shrink-0" />
								<span className="text-sm text-gray-700">
									{inscripcionData.nombreNiño}
									{inscripcionData.edadNiño ? ` (${inscripcionData.edadNiño} años)` : ''}
								</span>
							</div>
						</div>

						<div className="border-t border-gray-100" />

						{/* Precio */}
						<div className="text-center">
							<p className="font-display font-black text-base text-energy-orange">
								Precio {taller.precio}€
							</p>
						</div>

						{/* Google Calendar */}
						<a
							href={generarGoogleCalendarUrl(taller)}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center justify-center gap-2 w-full py-3 bg-neverland-green text-white rounded-2xl font-display font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
						>
							<Calendar size={16} />
							Añadir a Google Calendar
							<ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
						</a>

						{/* Volver */}
						<div className="text-center">
							<Link
								to="/talleres"
								className="inline-flex items-center gap-2 text-gray-400 hover:text-neverland-green transition-colors font-display font-bold text-[10px] uppercase tracking-wider"
							>
								<ArrowLeft size={12} />
								Volver a talleres
							</Link>
						</div>

					</div>
				</div>
			</div>
		</>
	);
};

export default InscripcionResumen;
