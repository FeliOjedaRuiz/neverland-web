import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle } from 'lucide-react';

const Step1Date = ({
	formData,
	setFormData,
	currentMonth,
	setCurrentMonth,
	view,
	setView,
	availabilityError,
	availabilityLoading,
	availabilityCache = {},
}) => {
	// Carousel State
	const containerRef = useRef(null);
	const [width, setWidth] = useState(0);
	const [headerDate, setHeaderDate] = useState(currentMonth); // Display date
	const x = useMotionValue(0);

	// Sync headerDate when currentMonth changes externally
	useEffect(() => {
		setHeaderDate(currentMonth);
	}, [currentMonth]);

	// Measure container width
	useEffect(() => {
		if (containerRef.current) {
			setWidth(containerRef.current.offsetWidth);
			x.set(-containerRef.current.offsetWidth);
		}
		const handleResize = () => {
			if (containerRef.current) {
				const w = containerRef.current.offsetWidth;
				setWidth(w);
				x.set(-w);
			}
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [x, view]);

	const cycleMonth = async (direction) => {
		if (width === 0) return;

		const nextDate = new Date(currentMonth);
		nextDate.setMonth(nextDate.getMonth() + direction);
		setHeaderDate(nextDate);

		const targetX = direction === 1 ? -2 * width : 0;

		await animate(x, targetX, {
			type: 'tween',
			duration: 0.3,
			ease: 'easeInOut',
		});

		setCurrentMonth(nextDate);
		x.set(-width);
	};

	const handleDragEnd = async () => {
		const currentX = x.get();
		const threshold = width * 0.25;

		let direction = 0;
		if (currentX < -width - threshold) direction = 1;
		else if (currentX > -width + threshold) direction = -1;

		if (direction !== 0) {
			await cycleMonth(direction);
		} else {
			animate(x, -width, { type: 'tween', duration: 0.3, ease: 'easeOut' });
		}
	};

	const getOccupiedForDate = (dateObj) => {
		const y = dateObj.getFullYear();
		const m = dateObj.getMonth() + 1;
		const key = `${y}-${m}`;
		const monthData = availabilityCache[key] || [];

		const dateStr = [
			dateObj.getFullYear(),
			String(dateObj.getMonth() + 1).padStart(2, '0'),
			String(dateObj.getDate()).padStart(2, '0'),
		].join('-');

		return monthData.filter((o) => o.date === dateStr).map((o) => o.shift);
	};

	const months = [-1, 0, 1].map((offset) => {
		const date = new Date(currentMonth);
		date.setMonth(date.getMonth() + offset);
		return date;
	});

	if (availabilityError) {
		return (
			<div className="flex flex-col items-center justify-center text-center p-6">
				<div className="text-red-500 mb-4">
					<CheckCircle size={48} className="rotate-45" />
				</div>
				<h3 className="text-lg font-bold text-gray-700 mb-2">
					Servicio de Reservas No Disponible
				</h3>
				<p className="text-sm text-gray-500 max-w-xs mx-auto">
					No pudimos sincronizar con el calendario. Por favor, inténtalo de
					nuevo más tarde o contáctanos directamente.
				</p>
				<button
					onClick={() => window.location.reload()}
					className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold transition-colors"
				>
					Reintentar
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full overflow-hidden">
			<h2 className="text-xl font-display font-bold text-text-black text-center mb-1">
				{view === 'calendar' ? 'Elige la Fecha' : 'Elige el Turno'}
			</h2>
			{view === 'calendar' && (
				<div className="w-full flex-1 flex flex-col min-h-0">
					{/* Navigation Overlay */}
					<div className="flex justify-between items-center mb-1 px-2 shrink-0 bg-surface">
						<button
							onClick={() => cycleMonth(-1)}
							className="p-1.5 hover:bg-green-50 rounded-full text-neverland-green"
						>
							<ChevronLeft size={20} />
						</button>
						<span className="font-display font-bold capitalize text-neverland-green select-none text-sm">
							{headerDate.toLocaleDateString('es-ES', {
								month: 'long',
								year: 'numeric',
							})}
						</span>
						<button
							onClick={() => cycleMonth(1)}
							className="p-1.5 hover:bg-green-50 rounded-full text-neverland-green"
						>
							<ChevronRight size={20} />
						</button>
					</div>

					{/* Sliding Container */}
					<div
						className="overflow-hidden w-full relative flex-1 min-h-0 shrink-0"
						ref={containerRef}
					>
						{/* Sliding Track */}
						<motion.div
							className="flex h-full touch-pan-y cursor-grab active:cursor-grabbing"
							style={{ x, width: width * 3 }}
							drag="x"
							dragConstraints={{ left: -2 * width, right: 0 }}
							dragElastic={0.1}
							onDragEnd={handleDragEnd}
						>
							{months.map((monthDate) => {
								return (
									<div
										key={monthDate.toISOString()}
										style={{ width: width }}
										className="flex flex-col shrink-0 h-full bg-surface border-r border-gray-100/50"
									>
										{/* Weekday Headers */}
										<div className="grid grid-cols-7 mb-1 shrink-0">
											{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
												<span
													key={d}
													className="text-[10px] font-bold text-center opacity-40"
												>
													{d}
												</span>
											))}
										</div>

										{/* Grid */}
										<div className="grid grid-cols-7 grid-rows-6 gap-px h-full relative touch-pan-y select-none pb-2">
											{availabilityLoading && (
												<div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl pointer-events-none">
													<div className="w-6 h-6 border-2 border-neverland-green/20 border-t-neverland-green rounded-full animate-spin"></div>
												</div>
											)}

											{Array.from({ length: 42 }).map((_, i) => {
												const year = monthDate.getFullYear();
												const month = monthDate.getMonth();
												const firstDay = new Date(year, month, 1);
												const startDay = (firstDay.getDay() + 6) % 7;
												const date = new Date(year, month, 1 - startDay + i);
												const isCur = date.getMonth() === month;
												const dateStr = [
													date.getFullYear(),
													String(date.getMonth() + 1).padStart(2, '0'),
													String(date.getDate()).padStart(2, '0'),
												].join('-');
												const today = new Date();
												today.setHours(0, 0, 0, 0);
												const isPast = date < today;
												const isSel = formData.fecha === dateStr;
												const occupied = getOccupiedForDate(date);

												return (
													<div
														key={i}
														onClick={() => {
															if (isPast) return;
															if (!isCur) {
																const newM = new Date(date);
																newM.setDate(1);
																setCurrentMonth(newM);
																x.set(-width);
															}
															setFormData({
																...formData,
																fecha: dateStr,
																turno: '',
															});
															setView('dayDetails');
														}}
														className={`rounded-lg flex flex-col items-center justify-between pt-0.5 pb-0.5 relative transition-all border select-none ${
															isSel
																? 'bg-neverland-green text-white shadow-md border-neverland-green'
																: isPast
																	? 'bg-gray-50 text-gray-300 border-transparent pointer-events-none'
																	: isCur
																		? 'bg-white text-gray-700 border-gray-100 hover:border-green-200 cursor-pointer'
																		: 'bg-gray-50/50 text-gray-400 border-transparent hover:bg-white hover:border-green-100 cursor-pointer'
														}`}
													>
														<span
															className={`text-[10px] mb-0.5 ${isSel ? 'font-black' : ''}`}
														>
															{date.getDate()}
														</span>

														{!isPast && !isSel && (
															<div className="w-full px-0.5 flex flex-col gap-[1px]">
																{['T1', 'T2', 'T3'].map((t) => {
																	const isOcc = occupied.includes(t);
																	return (
																		<div
																			key={t}
																			className={`h-[9px] w-full rounded-sm flex items-center justify-center ${
																				isOcc ? 'bg-gray-200' : 'bg-green-100'
																			}`}
																		>
																			{!isOcc && (
																				<span className="text-[6.5px] font-bold text-neverland-green tracking-tighter leading-none">
																					LIBRE
																				</span>
																			)}
																		</div>
																	);
																})}
															</div>
														)}
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
			)}
			{view === 'dayDetails' && (
				<div className="space-y-3">
					<div className="bg-green-50 rounded-2xl p-4 flex justify-between items-center">
						<div>
							<p className="text-xs font-bold text-gray-400 uppercase">
								Día Seleccionado
							</p>
							<p className="font-display font-black text-neverland-green capitalize">
								{new Date(formData.fecha).toLocaleDateString('es-ES', {
									weekday: 'long',
									day: 'numeric',
									month: 'long',
								})}
							</p>
						</div>
						<button
							onClick={() => setView('calendar')}
							className="bg-white p-2 rounded-full text-neverland-green shadow-sm"
						>
							<Calendar size={20} />
						</button>
					</div>
					{[
						{ id: 'T1', l: 'Turno 1', t: '17:00 - 19:00' },
						{ id: 'T2', l: 'Turno 2', t: '18:00 - 20:00' },
						{ id: 'T3', l: 'Turno 3', t: '19:15 - 21:15' },
					].map((turn) => {
						const isOcc = getOccupiedForDate(new Date(formData.fecha)).includes(
							turn.id,
						);
						return (
							<button
								key={turn.id}
								disabled={isOcc}
								onClick={() => setFormData({ ...formData, turno: turn.id })}
								className={`w-full p-4 rounded-2xl border-2 flex justify-between items-center transition-all ${
									formData.turno === turn.id
										? 'border-neverland-green bg-neverland-green text-white shadow-lg'
										: isOcc
											? 'bg-gray-50 border-gray-100 opacity-50'
											: 'bg-white border-white hover:border-green-200'
								}`}
							>
								<div className="text-left">
									<p className="text-xs font-bold uppercase opacity-80">
										{turn.l}
									</p>
									<p className="text-xl font-black">{turn.t}</p>
								</div>
								{isOcc ? (
									<span className="text-xs font-bold bg-gray-200 px-2 py-1 rounded text-gray-500">
										OCUPADO
									</span>
								) : (
									formData.turno === turn.id && <CheckCircle size={20} />
								)}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default Step1Date;
