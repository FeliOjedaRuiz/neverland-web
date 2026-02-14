import React, { useState, useEffect } from 'react';
import {
	Eye,
	MessageCircle,
	Loader2,
	Calendar as CalendarIcon,
} from 'lucide-react';
import { getReservations } from '../../services/api';

const ReservationInbox = ({ onViewReservation }) => {
	const [reservations, setReservations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState('pendiente'); // pendiente, confirmado

	const fetchReservations = async () => {
		setLoading(true);
		try {
			const res = await getReservations();
			setReservations(Array.isArray(res.data) ? res.data : []);
		} catch (err) {
			console.error('Error fetching reservations:', err);
			setReservations([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchReservations();
	}, []);

	const filteredReservations = reservations.filter(
		(r) => r.estado === filter && r.tipo === 'reserva',
	);

	return (
		<div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
			{/* Filters Header - Flush with sides */}
			<div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center shrink-0">
				<div className="flex gap-2 bg-gray-200/50 p-1 rounded-2xl">
					<button
						onClick={() => setFilter('pendiente')}
						className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filter === 'pendiente' ? 'bg-white text-neverland-green shadow-sm shadow-black/5' : 'text-gray-400 hover:text-gray-600'}`}
					>
						Pendientes
					</button>
					<button
						onClick={() => setFilter('confirmado')}
						className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filter === 'confirmado' ? 'bg-white text-neverland-green shadow-sm shadow-black/5' : 'text-gray-400 hover:text-gray-600'}`}
					>
						Confirmadas
					</button>
				</div>
				<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">
					Total: {filteredReservations.length}
				</p>
			</div>

			{/* List Area */}
			<div className="flex-1 overflow-y-auto min-h-0 bg-white">
				{loading ? (
					<div className="flex flex-col items-center justify-center h-full py-20 text-gray-300 gap-4">
						<Loader2
							className="animate-spin text-neverland-green/40"
							size={48}
						/>
						<p className="font-display font-black uppercase tracking-widest text-[10px]">
							Sincronizando reservas...
						</p>
					</div>
				) : filteredReservations.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-gray-300 gap-4 py-20 px-6">
						<CalendarIcon size={48} className="opacity-10" />
						<p className="font-display font-black uppercase tracking-widest text-[10px] text-center">
							No hay reservas {filter}as
						</p>
					</div>
				) : (
					<div className="divide-y divide-gray-50">
						{filteredReservations.map((item) => (
							<div
								key={item.id}
								className="group flex items-center justify-between p-4 sm:p-6 hover:bg-neverland-green/[0.02] transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-neverland-green"
								onClick={() => onViewReservation(item)}
							>
								<div className="flex-1 min-w-0 pr-4">
									<div className="flex items-center gap-2 mb-1.5">
										<h4 className="font-display font-black text-lg text-text-black truncate leading-none">
											{item.cliente?.nombreNiño}
											{item.cliente?.edadNiño && (
												<span className="text-gray-300 font-bold ml-1.5 text-sm uppercase tracking-tighter">
													{item.cliente.edadNiño} años
												</span>
											)}
										</h4>
									</div>

									<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
										<div className="flex items-center gap-2 text-[11px] font-black">
											<span className="text-gray-500">
												{new Date(item.fecha).toLocaleDateString('es-ES', {
													day: '2-digit',
													month: '2-digit',
													year: '2-digit',
												})}
											</span>
											<span className="text-white/60 bg-energy-orange/80 px-1.5 py-0.5 rounded text-[9px] leading-none">
												{item.turno}
											</span>
											<span className="text-gray-400 opacity-80">
												{item.horario?.inicio || '17:00'} -{' '}
												{item.horario?.fin || '19:00'}
											</span>
										</div>
									</div>
								</div>

								<div className="flex items-center gap-2 sm:gap-3 shrink-0">
									<a
										href={`https://wa.me/${String(item.cliente?.telefono || '').replace(/\s/g, '')}`}
										target="_blank"
										rel="noreferrer"
										onClick={(e) => e.stopPropagation()}
										className="p-3 text-neverland-green bg-neverland-green/5 rounded-2xl hover:bg-neverland-green hover:text-white transition-all active:scale-95 shadow-sm shadow-neverland-green/5"
										title="WhatsApp"
									>
										<MessageCircle size={20} />
									</a>
									<button className="p-3 bg-gray-50 text-gray-400 group-hover:text-neverland-green group-hover:bg-neverland-green/5 rounded-2xl transition-all active:scale-95">
										<Eye size={20} />
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default ReservationInbox;
