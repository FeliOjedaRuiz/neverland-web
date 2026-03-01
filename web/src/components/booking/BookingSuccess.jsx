import React from 'react';
import { CheckCircle } from 'lucide-react';
import { formatSafeDate } from '../../utils/safeDate';

const BookingSuccess = ({ formData, createdId, getExtendedTime }) => {
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
				<div className="bg-neverland-green/5 border border-neverland-green/10 p-4 rounded-2xl">
					<p className="text-neverland-green font-bold text-sm mb-1">
						📧 Revisa tu correo
					</p>
					<p className="text-xs text-silhouette-green/80">
						Te hemos enviado un mail con todos los detalles de tu solicitud.
					</p>
				</div>
				<p className="text-xs sm:text-sm pt-2">
					El equipo de Neverland revisará los detalles y te contactará muy
					pronto.
				</p>
			</div>

			<div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
				<button
					onClick={() => (window.location.href = '/')}
					className="px-8 py-4 bg-neverland-green text-white rounded-2xl font-bold text-sm shadow-lg shadow-neverland-green/20 hover:scale-[1.02] active:scale-95 transition-all w-full"
				>
					Volver al Inicio
				</button>
			</div>
		</div>
	);
};

export default BookingSuccess;
