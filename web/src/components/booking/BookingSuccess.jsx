import React from 'react';
import { CheckCircle } from 'lucide-react';
import { formatSafeDate } from '../../utils/safeDate';

const BookingSuccess = ({ formData, createdId, getExtendedTime }) => {
	const whatsappNumber = '34651707985'; // Number from Footer
	const reservationDate = formData?.fecha || '';
	let reservationTime = '';
	try {
		reservationTime =
			typeof getExtendedTime === 'function' ? getExtendedTime() : '';
	} catch {
		reservationTime = '';
	}
	const clientName = formData?.cliente?.nombrePadre || 'Cliente';

	let formattedDate = '';
	try {
		formattedDate = formatSafeDate(reservationDate);
	} catch {
		formattedDate = reservationDate;
	}

	const whatsappMessage = encodeURIComponent(
		`¡Hola! Soy ${clientName}. He enviado una solicitud de reserva en Neverland.\n\n` +
			`📍 *Detalles de la Reserva:*\n` +
			`- ID: *${createdId || 'N/A'}*\n` +
			`- Día: *${formattedDate}*\n` +
			`- Horario: *${reservationTime}*\n\n` +
			`Aguardo su confirmación para completar el proceso. ¡Muchas gracias!`,
	);

	const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

	return (
		<div className="flex flex-col items-center justify-center min-h-[400px] h-full text-center p-6 bg-white/50 rounded-3xl pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
			<div
				className="w-20 h-20 sm:w-24 sm:h-24 bg-neverland-green text-white rounded-full flex items-center justify-center mb-6 shadow-xl shrink-0"
				style={{
					animation:
						'successBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
				}}
			>
				<CheckCircle className="w-10 h-10 sm:w-12 sm:h-12" />
			</div>
			<style>{`
				@keyframes successBounce {
					0% { transform: scale(0); opacity: 0; }
					60% { transform: scale(1.15); opacity: 1; }
					100% { transform: scale(1); opacity: 1; }
				}
			`}</style>
			<h2 className="text-2xl sm:text-3xl font-display font-bold text-text-black mb-2">
				¡Solicitud Enviada!
			</h2>
			<div className="text-gray-600 max-w-sm mx-auto text-sm sm:text-base mb-8 space-y-4">
				<p>
					Gracias{' '}
					<span className="font-bold text-neverland-green">{clientName}</span>.
				</p>
				<p>
					Has solicitado una reserva para el día{' '}
					<span className="font-bold">{formattedDate}</span> en el horario{' '}
					<span className="font-bold">{reservationTime}</span>.
				</p>
				<div className="flex flex-col items-center gap-2 py-2">
					<span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
						ID de tu solicitud
					</span>
					<span className="text-lg font-display font-black text-neverland-green bg-neverland-green/10 border-2 border-neverland-green/20 px-6 py-2 rounded-2xl shadow-inner tracking-widest">
						{createdId || '---'}
					</span>
				</div>
				<p className="text-xs sm:text-sm">
					El equipo de Neverland te contactará muy pronto.
				</p>
			</div>

			<div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
				<a
					href={whatsappUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="px-8 py-4 bg-[#25D366] text-white rounded-2xl font-black text-sm shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
				>
					Avisar por WhatsApp
					<svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
						<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.81 9.81 0 017.008 2.895 9.835 9.835 0 012.876 7.003c-.001 5.45-4.436 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
					</svg>
				</a>

				<button
					onClick={() => (window.location.href = '/')}
					className="px-8 py-3 bg-white border-2 border-gray-100 text-gray-400 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all"
				>
					Volver al Inicio
				</button>
			</div>
		</div>
	);
};

export default BookingSuccess;
