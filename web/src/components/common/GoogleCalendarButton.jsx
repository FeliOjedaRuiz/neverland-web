import React from 'react';
import { Calendar } from 'lucide-react';

const GoogleCalendarButton = ({ reservation, className = '' }) => {
	const generateGoogleCalendarUrl = () => {
		const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';

		// Titulo
		const text = `Reserva en Neverland - ${reservation.cliente?.nombreNiño || 'Cumpleaños'}`;

		// Fechas y Horas
		// reserva.fecha es "YYYY-MM-DD" o ISO string
		const datePart = reservation.fecha.split('T')[0].replace(/-/g, '');

		// Mapeo de turnos a horarios base (esto debería coincidir con la lógica del negocio)
		const turnosMap = {
			T1: { start: '170000', end: '190000' },
			T2: { start: '180000', end: '200000' },
			T3: { start: '191500', end: '211500' },
		};

		const times = turnosMap[reservation.turno] || {
			start: '170000',
			end: '190000',
		};

		// Manejar extensiones si es posible, o usar el horario base
		// Para simplificar y ya que Google Calendar requiere formato específico, usamos el base del turno
		// Pero si tenemos getExtendedTime podemos intentar parsearlo o simplemente dejar el base
		const dates = `${datePart}T${times.start}/${datePart}T${times.end}`;

		// Detalles (incluimos el link para editar/ver)
		const publicUrl = `${window.location.origin}/mi-reserva/${reservation.publicId || reservation.id}`;
		const gCalDetails = `Gestiona tu reserva aquí:
${publicUrl}

¡Gracias por elegir Neverland!`;
		const details = gCalDetails;

		const location =
			'Neverland Cúllar Vega, Calle Clara Campoamor, 18195 Cúllar Vega, Granada';

		return `${baseUrl}&text=${encodeURIComponent(text)}&dates=${dates}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
	};

	return (
		<a
			href={generateGoogleCalendarUrl()}
			target="_blank"
			rel="noreferrer"
			className={`flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-neverland-green/20 text-neverland-green rounded-2xl font-bold text-sm hover:bg-neverland-green/5 hover:border-neverland-green/40 transition-all active:scale-95 shadow-sm ${className}`}
		>
			<Calendar size={18} />
			Añadir a Google Calendar
		</a>
	);
};

export default GoogleCalendarButton;
