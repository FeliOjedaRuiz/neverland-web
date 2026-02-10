import React, { useState, useEffect } from 'react';
import {
	ChevronLeft,
	ChevronRight,
	Calendar as CalendarIcon,
	Clock,
	User,
	Phone,
	Eye,
	X,
	PlusCircle,
	Lock,
} from 'lucide-react';
import { getReservations, deleteReservation } from '../../services/api';
import ReservationDetailModal from './ReservationDetailModal';
import BlockDateModal from './BlockDateModal';

const CalendarView = () => {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [reservations, setReservations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedDateEvents, setSelectedDateEvents] = useState(null);
	const [showDetailModal, setShowDetailModal] = useState(null);
	const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

	const fetchEvents = async () => {
		setLoading(true);
		try {
			const res = await getReservations();
			setReservations(res.data);

			// Refresh selected date if open
			if (selectedDateEvents) {
				const day = selectedDateEvents.day;
				const dayEvents = res.data.filter((r) => {
					const eventDate = new Date(r.fecha);
					return (
						eventDate.getFullYear() === year &&
						eventDate.getMonth() === month &&
						eventDate.getDate() === day &&
						r.estado !== 'cancelada'
					);
				});
				setSelectedDateEvents({ day, events: dayEvents });
			}
		} catch (err) {
			console.error('Error fetching reservations for calendar:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchEvents();
	}, [currentDate.getFullYear(), currentDate.getMonth()]); // Fetch when month changes

	const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
	const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

	const prevMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
		);
		setSelectedDateEvents(null);
	};

	const nextMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
		);
		setSelectedDateEvents(null);
	};

	const year = currentDate.getFullYear();
	const month = currentDate.getMonth();
	const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });

	const monthDays = daysInMonth(year, month);
	let firstDay = firstDayOfMonth(year, month);
	// Adjust for Monday start (0 is Sunday, so if firstDay is 0 change it to 6, otherwise firstDay-1)
	firstDay = firstDay === 0 ? 6 : firstDay - 1;

	const calendarDays = [];
	for (let i = 0; i < firstDay; i++) {
		calendarDays.push(null);
	}
	for (let i = 1; i <= monthDays; i++) {
		calendarDays.push(i);
	}

	const getEventsForDay = (day) => {
		if (!day) return [];
		return reservations.filter((r) => {
			const eventDate = new Date(r.fecha);
			return (
				eventDate.getFullYear() === year &&
				eventDate.getMonth() === month &&
				eventDate.getDate() === day &&
				r.estado !== 'cancelada'
			);
		});
	};

	const getTurnoColor = (turno) => {
		if (turno === 'T1') return 'bg-neverland-green';
		if (turno === 'T2') return 'bg-energy-orange';
		if (turno === 'T3') return 'bg-blue-400';
		return 'bg-gray-400';
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
				<div className="w-12 h-12 border-4 border-neverland-green/20 border-t-neverland-green rounded-full animate-spin" />
				<p className="font-medium">Cargando eventos...</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col lg:flex-row gap-6 pb-10">
			{/* Calendar Grid */}
			<div className="flex-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-fit">
				{/* Calendar Header */}
				<div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
					<h4 className="text-xl font-display font-black text-text-black capitalize flex items-center gap-3">
						<CalendarIcon size={24} className="text-neverland-green" />
						{monthName}{' '}
						<span className="text-gray-300 font-sans font-light">{year}</span>
					</h4>
					<div className="flex items-center gap-3">
						<button
							onClick={() => setIsBlockModalOpen(true)}
							className="flex items-center gap-2 px-4 py-2 bg-energy-orange text-white rounded-xl text-xs font-bold shadow-md hover:bg-opacity-90 transition-all hover:scale-105 active:scale-95 mr-2"
						>
							<Lock size={14} />
							Bloquear Turno
						</button>
						<div className="flex gap-2">
							<button
								onClick={prevMonth}
								className="p-2 hover:bg-gray-50 rounded-xl border border-gray-100 transition-all text-gray-500"
							>
								<ChevronLeft size={20} />
							</button>
							<button
								onClick={nextMonth}
								className="p-2 hover:bg-gray-50 rounded-xl border border-gray-100 transition-all text-gray-500"
							>
								<ChevronRight size={20} />
							</button>
						</div>
					</div>
				</div>

				{/* Weekdays Labels */}
				<div className="grid grid-cols-7 gap-2 mb-2">
					{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
						<div
							key={d}
							className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest pb-2"
						>
							{d}
						</div>
					))}
				</div>

				{/* Calendar Days */}
				<div className="grid grid-cols-7 gap-2">
					{calendarDays.map((day, idx) => {
						const dayEvents = getEventsForDay(day);
						const isToday =
							day === new Date().getDate() &&
							month === new Date().getMonth() &&
							year === new Date().getFullYear();
						const isSelected = selectedDateEvents?.day === day;

						return (
							<div
								key={idx}
								onClick={() =>
									day && setSelectedDateEvents({ day, events: dayEvents })
								}
								className={`min-h-[80px] lg:min-h-[100px] p-2 rounded-2xl border transition-all cursor-pointer relative group flex flex-col ${
									!day
										? 'bg-transparent border-transparent'
										: isSelected
											? 'bg-neverland-green/5 border-neverland-green shadow-inner'
											: 'bg-white border-gray-100 hover:border-neverland-green/50 hover:shadow-soft'
								}`}
							>
								{day && (
									<>
										<span
											className={`text-sm font-black mb-1 ${
												isToday
													? 'bg-neverland-green text-white w-6 h-6 flex items-center justify-center rounded-full'
													: isSelected
														? 'text-neverland-green'
														: 'text-gray-400 group-hover:text-text-black'
											}`}
										>
											{day}
										</span>
										<div className="flex flex-col gap-1 overflow-hidden">
											{dayEvents.slice(0, 3).map((e, eIdx) => (
												<div
													key={eIdx}
													className={`h-1.5 w-full rounded-full ${getTurnoColor(e.turno)} opacity-70`}
													title={`${e.cliente?.nombreNiño} - ${e.turno}`}
												/>
											))}
											{dayEvents.length > 3 && (
												<span className="text-[9px] font-black text-gray-300 text-center">
													+{dayEvents.length - 3} más
												</span>
											)}
										</div>
									</>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Side Panel: Selected Day Details */}
			<div className="w-full lg:w-96 bg-cream-bg/30 lg:bg-transparent flex flex-col">
				{!selectedDateEvents ? (
					<div className="flex-1 bg-white p-8 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center opacity-60">
						<div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
							<CalendarIcon size={32} className="text-gray-300" />
						</div>
						<p className="text-sm font-medium text-gray-400">
							Selecciona un día para ver las reservas detalladas
						</p>
					</div>
				) : (
					<div className="flex-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
						<div className="mb-6 flex justify-between items-start">
							<div>
								<h5 className="text-lg font-display font-black text-text-black">
									Eventos del {selectedDateEvents.day} de {monthName}
								</h5>
								<p className="text-xs text-gray-400 font-medium">
									Hay {selectedDateEvents.events.length} reservas programadas
								</p>
							</div>
						</div>

						{selectedDateEvents.events.length === 0 ? (
							<div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-40">
								<p className="text-sm italic">Sin reservas para este día</p>
							</div>
						) : (
							<div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
								{selectedDateEvents.events.map((event) => (
									<div
										key={event.id}
										className={`group p-4 rounded-2xl border transition-all hover:shadow-soft ${
											event.tipo === 'bloqueo'
												? 'bg-gray-50/50 border-gray-200 border-dashed hover:bg-white'
												: 'bg-gray-50 border-gray-100 hover:border-neverland-green/30 hover:bg-white'
										}`}
									>
										<div className="flex justify-between items-start mb-3">
											<div className="flex items-center gap-2">
												<div
													className={`w-3 h-3 rounded-full ${event.tipo === 'bloqueo' ? 'bg-gray-300' : getTurnoColor(event.turno)} shadow-sm`}
												/>
												<span className="text-xs font-black text-text-black uppercase tracking-tight">
													{event.turno}
												</span>
											</div>
											<div className="flex gap-2">
												<span
													className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
														event.tipo === 'bloqueo'
															? 'bg-gray-200 text-gray-500'
															: event.estado === 'confirmado'
																? 'bg-green-100 text-green-600'
																: 'bg-yellow-100 text-yellow-600'
													}`}
												>
													{event.tipo === 'bloqueo' ? 'Bloqueo' : event.estado}
												</span>
												<button
													onClick={async () => {
														if (
															window.confirm(
																'¿Estás seguro de eliminar este evento?',
															)
														) {
															await deleteReservation(event.id);
															await fetchEvents();
														}
													}}
													className="text-gray-300 hover:text-red-500 transition-colors"
													title="Eliminar"
												>
													<X size={14} />
												</button>
											</div>
										</div>

										<div className="space-y-2">
											<h6 className="font-display font-black text-text-black flex items-center gap-1">
												{event.tipo === 'bloqueo'
													? event.notasAdmin || 'Bloqueo Manual'
													: event.cliente?.nombreNiño}
												{event.tipo !== 'bloqueo' && (
													<span className="text-xs text-gray-400 font-sans">
														({event.cliente?.edadNiño} años)
													</span>
												)}
											</h6>

											{event.tipo !== 'bloqueo' ? (
												<div className="grid grid-cols-2 gap-2">
													<div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
														<User size={12} className="text-gray-300" />
														{event.cliente?.nombrePadre}
													</div>
													<div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium overflow-hidden whitespace-nowrap overflow-ellipsis">
														<Phone size={12} className="text-gray-300" />
														{event.cliente?.telefono}
													</div>
												</div>
											) : (
												<p className="text-[10px] text-gray-400 italic">
													Este turno está bloqueado para el público.
												</p>
											)}
										</div>

										{event.tipo !== 'bloqueo' && (
											<div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all">
												<p className="text-sm font-black text-neverland-green">
													{event.precioTotal}€
												</p>
												<button
													onClick={() => setShowDetailModal(event)}
													className="flex items-center gap-1.5 text-[10px] font-black uppercase text-neverland-green hover:underline"
												>
													<Eye size={12} /> Ver Ficha
												</button>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>

			{showDetailModal && (
				<ReservationDetailModal
					reservation={showDetailModal}
					onClose={() => setShowDetailModal(null)}
				/>
			)}

			<BlockDateModal
				isOpen={isBlockModalOpen}
				onClose={() => setIsBlockModalOpen(false)}
				onBlockCreated={fetchEvents}
			/>
		</div>
	);
};

export default CalendarView;
