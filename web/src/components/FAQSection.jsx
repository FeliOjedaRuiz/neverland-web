import React, { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQItem = ({ question, answer }) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="border-b border-gray-100 last:border-0">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
			>
				<span
					className={`text-lg font-bold transition-colors ${isOpen ? 'text-neverland-green' : 'text-text-black group-hover:text-neverland-green'}`}
				>
					{question}
				</span>
				<div
					className={`flex-shrink-0 ml-4 p-2 rounded-full transition-colors ${isOpen ? 'bg-neverland-green text-white' : 'bg-cream-bg text-gray-500'}`}
				>
					{isOpen ? <Minus size={20} /> : <Plus size={20} />}
				</div>
			</button>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.3, ease: 'easeInOut' }}
						className="overflow-hidden"
					>
						<p className="pb-6 text-gray-600 leading-relaxed">{answer}</p>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

const FAQSection = () => {
	const faqs = [
		{
			question: '¿Con cuánta antelación debo reservar?',
			answer:
				'Recomendamos reservar con al menos 2-3 semanas de antelación para asegurar la fecha y hora que prefieres, especialmente para fines de semana.',
		},
		{
			question: '¿Qué pasa si algún niño tiene alergias?',
			answer:
				'Nos tomamos muy en serio las alergias alimentarias. Disponemos de menús especiales sin gluten, sin lactosa y adaptados a otras alergias. Por favor, indícalo al realizar la reserva.',
		},
		{
			question: '¿Es obligatorio el uso de calcetines?',
			answer:
				'Sí, por higiene y seguridad, tanto niños como adultos que accedan a la zona de juegos deben llevar calcetines. Si se os olvidan, tenemos a la venta en recepción.',
		},
		{
			question: '¿Pueden quedarse los padres durante el cumpleaños?',
			answer:
				'¡Por supuesto! Tenemos una zona de cafetería habilitada para que los padres puedan relajarse y tomar algo mientras los niños se divierten.',
		},
		{
			question: '¿Se puede cancelar la reserva?',
			answer:
				'Sí, puedes cancelar o modificar tu reserva hasta 72 horas antes del evento sin coste alguno. Pasado ese plazo, no se garantiza la devolución de la señal.',
		},
	];

	return (
		<section id="faq" className="py-20 bg-white">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-12">
					<div className="inline-flex items-center justify-center p-2 bg-cream-bg rounded-full mb-4 px-4">
						<HelpCircle className="text-rec-blue mr-2" size={20} />
						<span className="text-sm font-bold text-text-black uppercase tracking-wider">
							Preguntas Frecuentes
						</span>
					</div>
					<h2 className="text-3xl sm:text-4xl font-bold text-neverland-green mb-4">
						Todo lo que necesitas saber
					</h2>
					<p className="text-gray-600">
						Resolvemos tus dudas para que solo te preocupes de disfrutar.
					</p>
				</div>

				<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-10">
					{faqs.map((faq, idx) => (
						<FAQItem key={idx} {...faq} />
					))}
				</div>
			</div>
		</section>
	);
};

export default FAQSection;
