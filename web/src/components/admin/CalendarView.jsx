import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import {
	ChevronLeft,
	ChevronRight,
	Calendar as CalendarIcon,
	Loader2,
} from 'lucide-react';
import { getReservations } from '../../services/api';

const CalendarView = ({ onDayClick }) => {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [headerDate, setHeaderDate] = useState(new Date());
	const [reservations, setReservations] = useState([]);
	const [loading, setLoading] = useState(true);

	// Carousel State
	const containerRef = useRef(null);
	const [width, setWidth] = useState(0);
	const x = useMotionValue(0);

	const fetchEvents = async () => {
		setLoading(true);
		try {
			const res = await getReservations();
			setReservations(res.data);
		} catch (err) {
			console.error('Error fetching reservations for calendar:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchEvents();
	}, []);

	// Measure container width for carousel
	useEffect(() => {
		if (containerRef.current) {
			const w = containerRef.current.offsetWidth;
			if (w > 0) {
				setWidth(w);
				x.set(-w); // Start at middle (Current Month)
			}
		}
		const handleResize = () => {
			if (containerRef.current) {
				const w = containerRef.current.offsetWidth;
				if (w > 0) {
					setWidth(w);
					x.set(-w);
				}
			}
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [x, loading]);

	const monthName = headerDate.toLocaleString('es-ES', { month: 'long' });
	const year = headerDate.getFullYear();

	const activeShifts = ['T1', 'T2', 'T3'];

	const getEventsForDate = (dateObj) => {
		if (!dateObj) return [];
		return reservations.filter((r) => {
			const eventDate = new Date(r.fecha);
			return (
				eventDate.getFullYear() === dateObj.getFullYear() &&
				eventDate.getMonth() === dateObj.getMonth() &&
				eventDate.getDate() === dateObj.getDate()
			);
		});
	};

	const getStatusColor = (estado, tipo) => {
		if (tipo === 'bloqueo') return 'bg-gray-300 border-gray-400';
		if (estado === 'cancelada') return 'bg-red-500 border-red-600';
		if (estado === 'confirmado' || estado === 'confirmada')
			return 'bg-neverland-green border-green-700';
		if (estado === 'pendiente' || estado === 'solicitado')
			return 'bg-yellow-400 border-yellow-500';
		return 'bg-white border-black hover:bg-gray-50';
	};

	const handleDayClick = (dateObj) => {
		if (onDayClick && dateObj) {
			onDayClick(dateObj);
		}
	};

	// Cycle function: Updates state and resets x
	const cycleMonth = async (direction) => {
		if (width === 0) return;

		// Immediate Title Update
		const nextDate = new Date(currentDate);
		nextDate.setMonth(nextDate.getMonth() + direction);
		setHeaderDate(nextDate);

		const targetX = direction === 1 ? -2 * width : 0; // 1 = Next (move to left), -1 = Prev (move to right)

		await animate(x, targetX, {
			type: 'tween',
			duration: 0.3,
			ease: 'easeInOut',
		});

		setCurrentDate(nextDate);
		x.set(-width); // Seamlessly reset to center
	};

	const handleDragEnd = async () => {
		const currentX = x.get();
		const threshold = width * 0.25;

		let direction = 0;
		if (currentX < -width - threshold)
			direction = 1; // Dragged left -> Go Next
		else if (currentX > -width + threshold) direction = -1; // Dragged right -> Go Prev

		if (direction !== 0) {
			await cycleMonth(direction);
		} else {
			// Snap back to center
			animate(x, -width, { type: 'tween', duration: 0.3, ease: 'easeOut' });
		}
	};

	// Generate 3 months: Prev, Current, Next
	const months = [-1, 0, 1].map((offset) => {
		const date = new Date(currentDate);
		date.setMonth(date.getMonth() + offset);
		return date;
	});

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-full py-20 text-gray-300 gap-4">
				<Loader2 className="animate-spin text-neverland-green/40" size={48} />
				<p className="font-display font-black uppercase tracking-widest text-[10px]">
					Sincronizando calendario...
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-white overflow-hidden">
			{/* Calendar Header */}
			<div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 border-b border-gray-100 shrink-0 relative z-20 bg-white shadow-sm">
				<div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
					<button
						onClick={() => cycleMonth(-1)}
						className="p-1.5 hover:bg-gray-50 rounded-lg border border-gray-200 transition-all text-gray-500 hover:text-neverland-green"
					>
						<ChevronLeft size={20} />
					</button>

					<h4 className="text-xl font-display font-black text-text-black capitalize flex items-center gap-2 text-center select-none">
						<CalendarIcon
							size={24}
							className="text-neverland-green hidden sm:block"
						/>
						{monthName}{' '}
						<span className="text-gray-300 font-sans font-light">{year}</span>
					</h4>

					<button
						onClick={() => cycleMonth(1)}
						className="p-1.5 hover:bg-gray-50 rounded-lg border border-gray-200 transition-all text-gray-500 hover:text-neverland-green"
					>
						<ChevronRight size={20} />
					</button>
				</div>

				{/* Legend */}
				<div className="w-full sm:w-auto mt-2 sm:mt-0">
					<div className="grid grid-cols-5 gap-1 sm:gap-2">
						<div className="flex items-center justify-center px-1 py-1 rounded border border-black bg-white text-[9px] font-bold text-black uppercase tracking-tighter text-center">
							Libre
						</div>
						<div className="flex items-center justify-center px-1 py-1 rounded border border-yellow-500 bg-yellow-400 text-[9px] font-bold text-yellow-900 uppercase tracking-tighter text-center">
							Solicitado
						</div>
						<div className="flex items-center justify-center px-1 py-1 rounded border border-green-700 bg-neverland-green text-[9px] font-bold text-white uppercase tracking-tighter text-center">
							Confirmado
						</div>
						<div className="flex items-center justify-center px-1 py-1 rounded border border-red-600 bg-red-500 text-[9px] font-bold text-white uppercase tracking-tighter text-center">
							Cancelado
						</div>
						<div className="flex items-center justify-center px-1 py-1 rounded border border-gray-400 bg-gray-300 text-[9px] font-bold text-gray-700 uppercase tracking-tighter text-center">
							Bloqueado
						</div>
					</div>
				</div>
			</div>

			{/* Sliding Container */}
			<div className="flex-1 relative overflow-hidden" ref={containerRef}>
				<motion.div
					className={`flex h-full absolute top-0 left-0 touch-pan-y cursor-grab active:cursor-grabbing ${width === 0 ? 'opacity-0' : 'opacity-100'}`}
					style={{ x, width: width * 3 }}
					drag="x"
					dragConstraints={{ left: -2 * width, right: 0 }}
					dragElastic={0.1}
					onDragEnd={handleDragEnd}
				>
					{months.map((monthDate) => {
						const mYear = monthDate.getFullYear();
						const mMonth = monthDate.getMonth();

						return (
							<div
								key={monthDate.toISOString()}
								style={{ width: width }}
								className="flex flex-col shrink-0 h-full bg-white"
							>
								{/* Weekdays Labels - Part of sliding block */}
								<div className="grid grid-cols-7 border-b border-gray-100 shrink-0 bg-gray-50/50">
									{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
										<div
											key={d}
											className="text-center text-xs font-black text-gray-400 py-2"
										>
											{d}
										</div>
									))}
								</div>

								{/* Calendar Grid */}
								<div className="grid grid-cols-7 grid-rows-6 gap-2 p-4 bg-gray-50/30 grow auto-rows-fr overflow-hidden touch-pan-y">
									{Array.from({ length: 42 }).map((_, i) => {
										const firstDay = new Date(mYear, mMonth, 1);
										const startDay = (firstDay.getDay() + 6) % 7;
										const date = new Date(mYear, mMonth, 1 - startDay + i);
										const isCur = date.getMonth() === mMonth;

										const cellBg = isCur ? 'bg-white' : 'bg-gray-100/50';
										const textOpacity = isCur ? 'text-black' : 'text-gray-300';
										const hoverEffect = isCur
											? 'hover:shadow-md hover:border-neverland-green/50 cursor-pointer'
											: 'cursor-default';
										const activeOpacity = isCur
											? 'opacity-100'
											: 'opacity-40 grayscale';

										const dayEvents = getEventsForDate(date);
										const isToday =
											date.getDate() === new Date().getDate() &&
											date.getMonth() === new Date().getMonth() &&
											date.getFullYear() === new Date().getFullYear();

										return (
											<div
												key={i}
												onClick={() => isCur && handleDayClick(date)}
												className={`rounded-xl border border-gray-100 p-1 lg:p-2 transition-all relative group flex flex-col justify-between select-none ${cellBg} ${hoverEffect} ${
													!isCur ? 'pointer-events-none' : ''
												}`}
											>
												<div className="flex justify-center mb-1">
													<span
														className={`text-xs lg:text-sm font-black w-6 h-6 flex items-center justify-center rounded-full ${
															isToday
																? 'bg-neverland-green text-white'
																: textOpacity
														}`}
													>
														{date.getDate()}
													</span>
												</div>

												<div
													className={`flex flex-col gap-1 w-full grow justify-center pb-1 ${activeOpacity}`}
												>
													{activeShifts.map((turno) => {
														let event = dayEvents.find(
															(e) =>
																e.turno === turno && e.estado !== 'cancelada',
														);
														if (!event) {
															event = dayEvents.find(
																(e) =>
																	e.turno === turno && e.estado === 'cancelada',
															);
														}
														const finalColor = event
															? getStatusColor(event.estado, event.tipo)
															: 'bg-white border-black';
														return (
															<div
																key={turno}
																className={`h-2 lg:h-3 w-full border ${finalColor} rounded-sm transition-opacity`}
																title={
																	event
																		? `${event.estado} - ${event.cliente?.nombreNiño || 'N/A'}`
																		: 'Disponible'
																}
															/>
														);
													})}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</motion.div>
			</div>
		</div>
	);
};

export default CalendarView;
