import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const BookingSuccess = ({ formData }) => {
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
			<p className="text-gray-600 max-w-xs mx-auto text-sm mb-8">
				Gracias {formData.cliente.nombrePadre}. El equipo de Neverland te
				contactará muy pronto.
			</p>
			<button
				onClick={() => (window.location.href = '/')}
				className="px-8 py-3 bg-white border-2 border-neverland-green text-neverland-green rounded-full font-bold shadow-sm hover:bg-green-50 w-full"
			>
				Volver al Inicio
			</button>
		</div>
	);
};

export default BookingSuccess;
