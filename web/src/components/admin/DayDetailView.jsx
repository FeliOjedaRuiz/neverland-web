import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
	ChevronLeft,
	Clock,
	Lock,
	CheckCircle,
	AlertTriangle,
	Eye,
	X,
	Loader2,
} from 'lucide-react';
import {
	getReservations,
	createBooking,
	deleteReservation,
} from '../../services/api';

const DayDetailView = () => {
	const navigate = useNavigate();
	const { date: dateParam } = useParams();
	const date = new Date(dateParam + 'T00:00:00');
	const [dayEvents, setDayEvents] = useState([]);
	const [loading, setLoading] = useState(true);
	const [blockingTurn, setBlockingTurn] = useState(null);

	const dateStr = dateParam;

	const fetchDayEvents = useCallback(async () => {
		setLoading(true);
		try {
			const res = await getReservations();
			const events = res.data.filter((r) => r.fecha.split('T')[0] === dateStr);
			setDayEvents(events);
		} catch (err) {
			console.error('Error fetching day events:', err);
		} finally {
			setLoading(false);
		}
	}, [dateStr]);

	useEffect(() => {
		fetchDayEvents();
	}, [fetchDayEvents]);

	const handleBlockTurn = async (turnId) => {
		setBlockingTurn(turnId);
		try {
			await createBooking({
				tipo: 'bloqueo',
				fecha: dateStr,
				turno: turnId,
				estado: 'confirmado',
				notasAdmin: 'Bloqueo Manual desde Panel',
				detalles: {
					niños: { cantidad: 12, menuId: 1 },
					extras: { taller: 'ninguno', personaje: 'ninguno', pinata: false },
					adultos: [],
				},
			});
			await fetchDayEvents();
		} catch (err) {
			console.error('Error blocking turn:', err);
			alert('Error al bloquear el turno');
		} finally {
			setBlockingTurn(null);
		}
	};

	const handleBlockDay = async () => {
		if (!window.confirm('¿Bloquear los 3 turnos de este día?')) return;
		setBlockingTurn('ALL');
		try {
			const availableShifts = SHIFTS.filter((shift) => {
				const { status } = getTurnStatus(shift.id);
				return status === 'available';
			});

			if (availableShifts.length === 0) {
				alert('No hay turnos disponibles para bloquear.');
				return;
			}

			for (const shift of availableShifts) {
				await createBooking({
					tipo: 'bloqueo',
					fecha: dateStr,
					turno: shift.id,
					estado: 'confirmado',
					notasAdmin: 'Bloqueo Día Completo',
					detalles: {
						niños: { cantidad: 12, menuId: 1 },
						extras: { taller: 'ninguno', personaje: 'ninguno', pinata: false },
						adultos: [],
					},
				});
			}
			await fetchDayEvents();
		} catch (err) {
			console.error('Error blocking day:', err);
			alert('Error al bloquear el día completo');
		} finally {
			setBlockingTurn(null);
		}
	};

	const handleUnblock = async (eventId) => {
		if (!window.confirm('¿Desbloquear este turno?')) return;
		try {
			await deleteReservation(eventId);
			await fetchDayEvents();
		} catch (err) {
			console.error(err);
			alert('Error al desbloquear');
		}
	};

	const getTurnStatus = (turnId) => {
		const event = dayEvents.find(
			(e) => e.turno === turnId && e.estado !== 'cancelada',
		);
		if (event)
			return {
				status: event.tipo === 'bloqueo' ? 'blocked' : event.estado,
				event,
			};

		const cancelledEvent = dayEvents.find(
			(e) => e.turno === turnId && e.estado === 'cancelada',
		);
		if (cancelledEvent) return { status: 'cancelled', event: cancelledEvent };

		return { status: 'available', event: null };
	};

	const SHIFTS = [
		{ id: 'T1', label: 'T1', time: '17:00 - 19:00' },
		{ id: 'T2', label: 'T2', time: '18:00 - 20:00' },
		{ id: 'T3', label: 'T3', time: '19:15 - 21:15' },
	];

	const hasAnyAvailable = SHIFTS.some(
		(s) => getTurnStatus(s.id).status === 'available',
	);

	const hasAnyReservation = dayEvents.some(
		(e) => e.tipo === 'reserva' && e.estado !== 'cancelada',
	);

	return (
		<div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
			{/* Header Compacto */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
				<div className="flex items-center gap-3">
					<button
						onClick={() => navigate(-1)}
						className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
					>
						<ChevronLeft size={20} />
					</button>
					<div>
						<h2 className="text-lg font-display font-black text-text-black capitalize leading-none">
							{date.toLocaleDateString('es-ES', {
								weekday: 'long',
								day: 'numeric',
								month: 'long',
							})}
						</h2>
					</div>
				</div>

				{hasAnyAvailable && !hasAnyReservation && (
					<button
						onClick={handleBlockDay}
						disabled={blockingTurn === 'ALL'}
						className="bg-gray-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
					>
						{blockingTurn === 'ALL' ? (
							<Loader2 size={12} className="animate-spin" />
						) : (
							<Lock size={12} />
						)}
						Bloquear Día
					</button>
				)}
			</div>

			{/* Content */}
			<div className="flex-1 p-2 sm:p-4 bg-gray-50/50 flex flex-col gap-2 sm:gap-4 overflow-hidden">
				{loading ? (
					<div className="flex justify-center py-20">
						<Loader2 className="animate-spin text-neverland-green" size={40} />
					</div>
				) : (
					<div className="flex flex-col h-full gap-2">
						{SHIFTS.map((shift) => {
							const { status, event } = getTurnStatus(shift.id);
							let cardStyles = 'bg-white border-gray-200';
							let statusColor = 'text-gray-500 bg-gray-100';
							let statusText = 'Disponible';

							if (status === 'available') {
								cardStyles =
									'bg-white border-dashed border-gray-300 hover:border-gray-400';
								statusColor = 'text-gray-500 bg-gray-100';
								statusText = 'Disponible';
							} else if (status === 'blocked') {
								cardStyles = 'bg-gray-50/80 border-gray-200 opacity-90';
								statusColor = 'text-gray-600 bg-gray-200';
								statusText = 'Bloqueado';
							} else if (status === 'confirmado' || status === 'confirmada') {
								cardStyles = 'bg-green-50/50 border-green-200';
								statusColor = 'text-green-700 bg-green-100';
								statusText = 'Confirmado';
							} else if (status === 'pendiente' || status === 'solicitado') {
								cardStyles = 'bg-yellow-50/50 border-yellow-200';
								statusColor = 'text-yellow-700 bg-yellow-100';
								statusText = 'Solicitado';
							} else if (status === 'cancelled') {
								cardStyles = 'bg-red-50/30 border-red-100 opacity-60';
								statusColor = 'text-red-600 bg-red-100';
								statusText = 'Cancelado';
							}

							return (
								<div
									key={shift.id}
									className={`rounded-2xl border px-4 py-2 flex items-center justify-between relative group transition-all flex-1 ${cardStyles}`}
								>
									{/* Left: Time & Label */}
									<div className="flex flex-col justify-center min-w-[80px]">
										<div className="flex items-baseline gap-2">
											<h3 className="text-xl font-display font-black text-text-black/80">
												{shift.id}
											</h3>
											<span
												className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${statusColor}`}
											>
												{statusText}
											</span>
										</div>
										<p className="text-xs font-bold text-gray-400 font-sans">
											{shift.time}
										</p>
									</div>

									{/* Center/Right: Actions or Info */}
									<div className="flex-1 flex justify-end items-center pl-4">
										{status === 'available' ? (
											<button
												onClick={() => handleBlockTurn(shift.id)}
												disabled={blockingTurn === shift.id}
												className="px-3 py-1.5 bg-white border border-gray-200 hover:border-black text-black rounded-lg font-bold text-xs transition-all flex items-center gap-1 shadow-sm"
											>
												{blockingTurn === shift.id ? (
													<Loader2 className="animate-spin" size={12} />
												) : (
													<Lock size={12} />
												)}
												Bloquear
											</button>
										) : status === 'blocked' ? (
											<div className="flex items-center gap-3">
												<p className="text-xs text-gray-500 italic truncate max-w-[100px] hidden sm:block">
													"{event.notasAdmin}"
												</p>
												<button
													onClick={() => handleUnblock(event.id)}
													className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-bold transition-colors"
												>
													Desbloquear
												</button>
											</div>
										) : (
											// Reservation Info Compact
											<div className="flex items-center gap-3 w-full justify-end">
												<div className="flex flex-col items-end mr-2 truncate">
													<p className="font-display font-black text-sm text-text-black truncate max-w-[120px]">
														{event.cliente?.nombreNiño}
													</p>
													<p className="text-[10px] text-gray-400 font-bold uppercase">
														{statusText}
													</p>
												</div>

												<div className="flex gap-1">
													{status !== 'cancelled' && (
														<button
															onClick={() =>
																navigate(`/admin/evento/${event.id}`)
															}
															className="p-2 bg-neverland-green text-white rounded-lg shadow-sm hover:scale-105 transition-transform"
															title="Ver Detalle"
														>
															<Eye size={16} />
														</button>
													)}
												</div>
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default DayDetailView;
