import React from 'react';
import {
	X,
	User,
	Phone,
	Calendar,
	Clock,
	Utensils,
	Sparkles,
	Smile,
	Package,
	ChevronRight,
	MessageSquare,
} from 'lucide-react';

const ReservationDetailModal = ({ reservation, onClose }) => {
	if (!reservation) return null;

	const formatDate = (dateString) => {
		const options = {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		};
		return new Date(dateString).toLocaleDateString('es-ES', options);
	};

	const getTurnoLabel = (reservation) => {
		if (reservation.horario?.inicio && reservation.horario?.fin) {
			return `${reservation.horario.inicio} - ${reservation.horario.fin}`;
		}
		const t = reservation.turno;
		if (t === 'T1') return '17:00 - 19:00';
		if (t === 'T2') return '18:00 - 20:00';
		if (t === 'T3') return '19:15 - 21:15';
		return t;
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
			<div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
				{/* Header */}
				<div className="p-6 bg-neverland-green text-white flex justify-between items-center">
					<div>
						<h3 className="text-xl font-display font-black">
							Detalles de la Reserva
						</h3>
						<p className="text-white/80 text-xs font-medium uppercase tracking-wider">
							ID: {reservation.publicId}
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-2 hover:bg-white/20 rounded-full transition-all"
					>
						<X size={24} />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
					{/* Client Info */}
					<section className="space-y-4">
						<h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
							<User size={14} /> Información del Cliente
						</h4>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
							<div>
								<p className="text-xs text-gray-400 font-bold uppercase">
									Niño/a del cumple
								</p>
								<p className="font-display font-black text-lg text-text-black">
									{reservation.cliente?.nombreNiño} (
									{reservation.cliente?.edadNiño} años)
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-400 font-bold uppercase">
									Responsable
								</p>
								<p className="font-bold text-text-black">
									{reservation.cliente?.nombrePadre}
								</p>
								<a
									href={`https://wa.me/${reservation.cliente?.telefono?.replace(/\s/g, '')}`}
									target="_blank"
									rel="noreferrer"
									className="text-neverland-green hover:underline flex items-center gap-1 text-sm font-bold mt-1"
								>
									<Phone size={14} /> {reservation.cliente?.telefono}
								</a>
							</div>
						</div>
					</section>

					{/* Date & Time */}
					<section className="space-y-4">
						<h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
							<Calendar size={14} /> Fecha y Horario
						</h4>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
								<div className="w-12 h-12 bg-energy-orange/10 text-energy-orange rounded-xl flex items-center justify-center">
									<Calendar size={24} />
								</div>
								<div>
									<p className="text-[10px] text-gray-400 font-black uppercase">
										Fecha
									</p>
									<p className="font-bold text-text-black capitalize">
										{formatDate(reservation.fecha)}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
								<div className="w-12 h-12 bg-blue-400/10 text-blue-400 rounded-xl flex items-center justify-center">
									<Clock size={24} />
								</div>
								<div>
									<p className="text-[10px] text-gray-400 font-black uppercase">
										Turno / Horario
									</p>
									<p className="font-bold text-text-black">
										{reservation.turno} ({getTurnoLabel(reservation)})
									</p>
									{reservation.horario?.extensionMinutos > 0 && (
										<p className="text-xs text-blue-500 font-bold">
											+ {reservation.horario.extensionMinutos} min extra
										</p>
									)}
								</div>
							</div>
						</div>
					</section>

					{/* Observaciones - Moved between Date/Time and Menus */}
					<section className="space-y-3">
						<h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
							<MessageSquare size={14} /> Observaciones / Notas
						</h4>
						<div className="p-4 px-6 rounded-2xl border bg-gray-50 border-gray-100 flex flex-col gap-2 relative w-full overflow-hidden">
							<div className="absolute top-0 left-0 w-1 h-full bg-blue-400 opacity-20"></div>
							{reservation.detalles?.extras?.observaciones ? (
								<p className="text-sm font-medium text-gray-700 italic">
									"{reservation.detalles.extras.observaciones}"
								</p>
							) : (
								<p className="text-xs text-gray-400 italic">
									Sin observaciones adicionales
								</p>
							)}
						</div>
					</section>

					{/* Menus */}
					<section className="space-y-4">
						<h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
							<Utensils size={14} /> Menús y Asistencia
						</h4>
						<div className="space-y-3">
							<div className="flex justify-between items-center p-4 bg-surface rounded-2xl border border-gray-100">
								<div className="flex items-center gap-3">
									<Smile className="text-neverland-green" size={20} />
									<span className="font-bold text-text-black">
										Niños ({reservation.detalles?.niños?.cantidad})
									</span>
								</div>
								<span className="bg-neverland-green/10 text-neverland-green px-3 py-1 rounded-full text-xs font-black uppercase">
									Menú {reservation.detalles?.niños?.menuId}
								</span>
							</div>

							<div className="p-4 bg-surface rounded-2xl border border-gray-100 space-y-3">
								<div className="flex items-center gap-3 border-b border-gray-50 pb-2">
									<Utensils className="text-energy-orange" size={20} />
									<span className="font-bold text-text-black">
										Adultos ({reservation.detalles?.adultos?.cantidad})
									</span>
								</div>
								<div className="space-y-1 pl-8">
									{reservation.detalles?.adultos?.comida?.length > 0 ? (
										reservation.detalles.adultos.comida.map((item, idx) => (
											<div
												key={idx}
												className="flex justify-between text-sm text-gray-600"
											>
												<span>
													{item.cantidad}x {item.item}
												</span>
											</div>
										))
									) : (
										<p className="text-xs text-gray-400 italic">
											No se solicitó comida de adultos
										</p>
									)}
								</div>
							</div>
						</div>
					</section>

					{/* Extras */}
					<section className="space-y-4">
						<h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
							<Sparkles size={14} /> Extras y Actividades
						</h4>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<div
								className={`p-4 rounded-2xl border flex flex-col items-center gap-1 transition-all ${reservation.detalles?.extras?.taller !== 'ninguno' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-300'}`}
							>
								<Sparkles size={20} />
								<span className="text-[10px] font-black uppercase">
									Actividad
								</span>
								<span className="text-xs font-bold text-center capitalize">
									{reservation.detalles?.extras?.taller === 'ninguno'
										? 'Sin actividad'
										: reservation.detalles?.extras?.taller}
								</span>
							</div>
							<div
								className={`p-4 rounded-2xl border flex flex-col items-center gap-1 transition-all ${reservation.detalles?.extras?.personaje !== 'ninguno' ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-gray-50 border-gray-100 text-gray-300'}`}
							>
								<Smile size={20} />
								<span className="text-[10px] font-black uppercase">
									Personaje
								</span>
								<span className="text-xs font-bold text-center capitalize">
									{reservation.detalles?.extras?.personaje === 'ninguno'
										? 'No'
										: reservation.detalles?.extras?.personaje}
								</span>
							</div>
							<div
								className={`p-4 rounded-2xl border flex flex-col items-center gap-1 transition-all ${reservation.detalles?.extras?.pinata ? 'bg-energy-orange/5 border-energy-orange/20 text-energy-orange' : 'bg-gray-50 border-gray-100 text-gray-300'}`}
							>
								<Package size={20} />
								<span className="text-[10px] font-black uppercase">Piñata</span>
								<span className="text-xs font-bold text-center">
									{reservation.detalles?.extras?.pinata ? 'Sí' : 'No'}
								</span>
							</div>
						</div>
					</section>
				</div>

				{/* Footer / Total Price */}
				<div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
					<div>
						<p className="text-xs text-gray-400 font-bold uppercase">
							Estado de la reserva
						</p>
						<span
							className={`px-4 py-1 rounded-full text-xs font-black uppercase inline-block mt-1 ${
								reservation.estado === 'confirmado'
									? 'bg-green-100 text-green-600'
									: reservation.estado === 'pendiente'
										? 'bg-yellow-100 text-yellow-600'
										: 'bg-gray-100 text-gray-600'
							}`}
						>
							{reservation.estado}
						</span>
					</div>
					<div className="text-right">
						<p className="text-xs text-gray-400 font-bold uppercase">
							Precio Total
						</p>
						<p className="text-3xl font-display font-black text-neverland-green">
							{reservation.precioTotal}€
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ReservationDetailModal;
