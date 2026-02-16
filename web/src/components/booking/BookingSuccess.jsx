import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const BookingSuccess = ({ formData, createdId, getExtendedTime }) => {
	const whatsappNumber = '34651707985'; // Number from Footer
	const reservationDate = formData.fecha;
	const reservationTime = getExtendedTime();
	const clientName = formData.cliente.nombrePadre;

	const whatsappMessage = encodeURIComponent(
		`Hola! He enviado una solicitud de reserva para el día ${reservationDate}, Horario ${reservationTime}. Aguardo su confirmación.\nSaludos!`,
	);

	const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

	return (
		<div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white/50 rounded-3xl">
			<motion.div
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={{ type: 'spring', damping: 12 }}
				className="w-24 h-24 bg-neverland-green text-white rounded-full flex items-center justify-center mb-6 shadow-xl"
			>
				<CheckCircle size={48} />
			</motion.div>
			<h2 className="text-3xl font-display font-bold text-text-black mb-2">
				¡Solicitud Enviada!
			</h2>
			<div className="text-gray-600 max-w-sm mx-auto text-sm mb-8 space-y-4">
				<p>
					Gracias{' '}
					<span className="font-bold text-neverland-green">{clientName}</span>.
				</p>
				<p>
					Has solicitado una reserva para el día{' '}
					<span className="font-bold">{reservationDate}</span> en el horario{' '}
					<span className="font-bold">{reservationTime}</span>.
				</p>
				{createdId && (
					<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 py-1 px-3 rounded-full inline-block">
						Id: {createdId}
					</p>
				)}
				<p>El equipo de Neverland te contactará muy pronto.</p>
			</div>

			<div className="flex flex-col gap-3 w-full">
				<a
					href={whatsappUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="px-8 py-4 bg-[#25D366] text-white rounded-2xl font-black text-sm shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
				>
					<span className="text-xl">💬</span> Avisar por WhatsApp
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
