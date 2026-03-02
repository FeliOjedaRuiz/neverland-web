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
	MessageSquare,
	Unlock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	getReservations,
	createBooking,
	deleteReservation,
	updateReservation,
} from '../../services/api';

const DayDetailView = () => {
	const navigate = useNavigate();
	const { date: dateParam } = useParams();
	const date = new Date(dateParam + 'T00:00:00');
	const [dayEvents, setDayEvents] = useState([]);
	const [loading, setLoading] = useState(true);
	const [blockingTurn, setBlockingTurn] = useState(null);
	const [blockModal, setBlockModal] = useState({
		show: false,
		turnId: null,
		isFullDay: false,
		reason: '',
	});
	const [unblockModal, setUnblockModal] = useState({
		show: false,
		eventId: null,
	});

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

	const handleBlockTurn = (turnId) => {
		setBlockModal({
			show: true,
			turnId,
			isFullDay: false,
			reason: '',
		});
	};

	const handleBlockDay = () => {
		if (hasAnyReservation) {
			alert(
				'No puedes bloquear el día completo porque hay reservas confirmadas o solicitadas.',
			);
			return;
		}

		setBlockModal({
			show: true,
			turnId: 'ALL',
			isFullDay: true,
			reason: '',
		});
	};

	const executeBlock = async () => {
		const { turnId, isFullDay, reason } = blockModal;
		setBlockModal((prev) => ({ ...prev, show: false }));

		if (isFullDay) {
			setBlockingTurn('ALL');
			try {
				const promises = SHIFTS.map(async (shift) => {
					const { status, event } = getTurnStatus(shift.id);

					if (status === 'blocked' && event) {
						await updateReservation(event.id || event._id, {
							notasAdmin: reason || 'Bloqueo desde app',
						});
					} else if (status === 'available') {
						await createBooking({
							tipo: 'bloqueo',
							fecha: dateStr,
							turno: shift.id,
							estado: 'confirmado',
							notasAdmin: reason || 'Bloqueo desde app',
							detalles: {
								niños: { cantidad: 12, menuId: 1 },
								extras: {
									taller: 'ninguno',
									personaje: 'ninguno',
									pinata: false,
								},
								adultos: [],
							},
						});
					}
				});

				await Promise.all(promises);
				await fetchDayEvents();
			} catch (err) {
				console.error('Error blocking day:', err);
				alert('Error al bloquear de forma masiva');
			} finally {
				setBlockingTurn(null);
			}
		} else {
			setBlockingTurn(turnId);
			try {
				await createBooking({
					tipo: 'bloqueo',
					fecha: dateStr,
					turno: turnId,
					estado: 'confirmado',
					notasAdmin: reason || 'Bloqueo desde app',
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
		}
	};

	const handleUnblock = (eventId) => {
		setUnblockModal({ show: true, eventId });
	};

	const executeUnblock = async () => {
		const { eventId } = unblockModal;
		setUnblockModal({ show: false, eventId: null });
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

	const hasAnyReservation = dayEvents.some(
		(e) => e.tipo === 'reserva' && e.estado !== 'cancelada',
	);

	return (
		<div className="flex flex-col h-full animate-in slide-in-from-right duration-300 bg-calendar-bg">
			{/* Header Compacto */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-orange-100/50 shrink-0">
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

				{!hasAnyReservation && (
					<button
						onClick={handleBlockDay}
						disabled={blockingTurn === 'ALL'}
						className="bg-text-black text-white hover:bg-black px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase flex items-center gap-1.5 shadow-md hover:shadow-lg active:scale-95 transition-all outline-none"
					>
						{blockingTurn === 'ALL' ? (
							<Loader2 size={14} className="animate-spin" />
						) : (
							<Lock size={14} />
						)}
						Bloquear Día
					</button>
				)}
			</div>

			{/* Content */}
			<div className="flex-1 p-3 sm:p-5 bg-cream-bg flex flex-col gap-3 sm:gap-4 overflow-hidden rounded-t-3xl shadow-inner mt-2">
				{loading ? (
					<div className="flex justify-center py-20">
						<Loader2 className="animate-spin text-neverland-green" size={40} />
					</div>
				) : (
					<div className="grid grid-rows-3 flex-1 gap-2 min-h-0">
						{SHIFTS.map((shift) => {
							const { status, event } = getTurnStatus(shift.id);
							let cardStyles = '';
							let statusColor = '';
							let statusText = '';
							let badgeStyles = '';

							if (status === 'available') {
								cardStyles =
									'bg-white/60 border-dashed border-gray-200 hover:bg-white hover:border-neverland-green/20';
								statusColor = 'text-gray-400 bg-gray-50';
								statusText = 'Disponible';
								badgeStyles = 'bg-cream-bg text-text-black/60';
							} else if (status === 'blocked') {
								cardStyles = 'bg-gray-50/80 border-gray-200 shadow-sm';
								statusColor = 'text-gray-600 bg-gray-100';
								statusText = 'Bloqueado';
								badgeStyles = 'bg-gray-800 text-white shadow-md';
							} else if (status === 'confirmado' || status === 'confirmada') {
								cardStyles =
									'bg-white border-2 border-neverland-green/30 shadow-xl shadow-green-900/5';
								statusColor =
									'text-neverland-green bg-green-50 font-black uppercase';
								statusText = 'Confirmado';
								badgeStyles =
									'bg-neverland-green text-white shadow-lg shadow-green-200';
							} else if (status === 'pendiente' || status === 'solicitado') {
								cardStyles =
									'bg-white border-2 border-energy-orange/30 shadow-xl shadow-orange-900/5';
								statusColor =
									'text-energy-orange bg-orange-50 font-black uppercase';
								statusText = 'Solicitado';
								badgeStyles =
									'bg-energy-orange text-white shadow-lg shadow-orange-200';
							} else if (status === 'cancelled') {
								cardStyles =
									'bg-gray-100/50 border-gray-200 opacity-50 contrast-75';
								statusColor = 'text-gray-400 bg-gray-200';
								statusText = 'Cancelado';
								badgeStyles = 'bg-gray-300 text-gray-500';
							}

							return (
								<div
									key={shift.id}
									className={`rounded-3xl border p-4 sm:p-5 flex flex-col transition-all gap-3 ${cardStyles}`}
								>
									{/* Top Row: Shift Info & Main Actions */}
									<div className="flex items-center justify-between w-full">
										<div className="flex items-center gap-3">
											<div
												className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${badgeStyles}`}
											>
												<h3 className="text-xl font-display font-black">
													{shift.id}
												</h3>
											</div>
											<div className="flex flex-col">
												<span
													className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full w-fit mb-0.5 tracking-wider ${statusColor}`}
												>
													{statusText}
												</span>
												<div className="flex items-center gap-1 text-gray-400">
													<Clock size={10} />
													<p className="text-[10px] font-bold font-sans">
														{shift.time}
													</p>
												</div>
											</div>
										</div>

										{/* Top Right Action (Compact) */}
										<div className="flex gap-2">
											{status === 'available' ? (
												<button
													onClick={() => handleBlockTurn(shift.id)}
													disabled={blockingTurn === shift.id}
													className="p-2.5 bg-text-black text-white rounded-xl hover:bg-black transition-all shadow-md active:scale-90 flex items-center justify-center"
													title="Bloquear Turno"
												>
													{blockingTurn === shift.id ? (
														<Loader2 className="animate-spin" size={16} />
													) : (
														<Lock size={16} />
													)}
												</button>
											) : status === 'blocked' ? (
												<button
													onClick={() => handleUnblock(event.id || event._id)}
													className="p-2.5 bg-green-50 text-neverland-green rounded-xl hover:bg-neverland-green hover:text-white transition-all border border-green-100 flex items-center justify-center active:scale-90 shadow-sm"
													title="Desbloquear"
												>
													<Unlock size={16} />
												</button>
											) : (
												status !== 'cancelled' && (
													<button
														onClick={() =>
															navigate(`/admin/evento/${event.id}`)
														}
														className="p-2.5 bg-neverland-green/10 text-neverland-green rounded-xl hover:bg-neverland-green hover:text-white transition-all active:scale-90 flex items-center justify-center"
														title="Ver Detalles"
													>
														<Eye size={18} />
													</button>
												)
											)}
										</div>
									</div>

									{/* Main Content Area: Reason or Client (Compact) */}
									<div className="pl-1">
										{status === 'available' ? (
											<p className="text-xs text-gray-400 font-medium italic">
												Turno libre para reserva manual o web.
											</p>
										) : status === 'blocked' ? (
											<div className="flex flex-col">
												<label className="text-[9px] items-center gap-1 uppercase font-black text-gray-400 flex mb-0.5">
													<MessageSquare size={9} />
													Motivo
												</label>
												<p className="text-base sm:text-lg font-display font-black text-text-black leading-tight italic">
													"{event.notasAdmin || 'Bloqueado'}"
												</p>
											</div>
										) : (
											<div className="flex flex-col">
												<label className="text-[9px] uppercase font-black text-gray-400 mb-0.5">
													Cliente
												</label>
												<div className="flex items-baseline gap-2">
													<p className="font-display font-black text-lg text-text-black truncate max-w-[150px]">
														{event.cliente?.nombreNiño}
													</p>
													<p className="text-[10px] font-bold text-gray-400 truncate">
														• {event.cliente?.nombrePadre}
													</p>
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

			{/* Modal de Bloqueo */}
			<AnimatePresence>
				{blockModal.show && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
						>
							<div className="p-6">
								<div className="flex items-center gap-3 mb-4">
									<div className="p-2 bg-orange-100 rounded-xl text-energy-orange">
										<Lock size={20} />
									</div>
									<h3 className="text-lg font-display font-black text-text-black">
										{blockModal.isFullDay
											? 'Bloqueo de Día Completo'
											: `Bloquear Turno ${blockModal.turnId}`}
									</h3>
								</div>

								<div className="space-y-4">
									<div>
										<label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5 ml-1">
											Motivo del Bloqueo
										</label>
										<div className="relative">
											<MessageSquare
												size={16}
												className="absolute left-3 top-3 text-gray-400"
											/>
											<textarea
												value={blockModal.reason}
												onChange={(e) =>
													setBlockModal((prev) => ({
														...prev,
														reason: e.target.value,
													}))
												}
												placeholder="Ej: Mantenimiento, Evento Privado..."
												className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-energy-orange/20 focus:border-energy-orange outline-none transition-all min-h-[100px] resize-none"
												autoFocus
											/>
										</div>
									</div>
								</div>

								<div className="flex gap-3 mt-6">
									<button
										onClick={() =>
											setBlockModal((prev) => ({ ...prev, show: false }))
										}
										className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
									>
										Cancelar
									</button>
									<button
										onClick={executeBlock}
										className="flex-1 py-3 px-4 rounded-xl text-sm font-black bg-text-black text-white hover:bg-black transition-all shadow-md active:scale-95"
									>
										Confirmar
									</button>
								</div>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
			{/* Modal de Desbloqueo */}
			<AnimatePresence>
				{unblockModal.show && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
						>
							<div className="p-6 text-center">
								<div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-neverland-green mb-4">
									<Unlock size={32} />
								</div>
								<h3 className="text-xl font-display font-black text-text-black mb-2">
									¿Desbloquear Turno?
								</h3>
								<p className="text-gray-500 text-sm mb-6">
									Este turno volverá a estar disponible para reservas manuales y
									web.
								</p>

								<div className="flex gap-3">
									<button
										onClick={() =>
											setUnblockModal({ show: false, eventId: null })
										}
										className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
									>
										No, Volver
									</button>
									<button
										onClick={executeUnblock}
										className="flex-1 py-3 px-4 rounded-xl text-sm font-black bg-neverland-green text-white hover:bg-neverland-green-dark transition-all shadow-md active:scale-95"
									>
										Sí, Desbloquear
									</button>
								</div>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default DayDetailView;
