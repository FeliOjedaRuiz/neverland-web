import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle } from 'lucide-react';

const Step1Date = ({
	formData,
	setFormData,
	currentMonth,
	setCurrentMonth,
	view,
	setView,
	monthlyOccupied,
}) => {
	const changeMonth = (delta) => {
		const newDate = new Date(currentMonth);
		newDate.setMonth(newDate.getMonth() + delta);
		setCurrentMonth(newDate);
	};

	const getOccupiedForDate = (dateStr) => {
		return monthlyOccupied
			.filter((o) => o.date === dateStr)
			.map((o) => o.shift);
	};

	return (
		<div className="flex flex-col h-full">
			<h2 className="text-xl font-display font-bold text-text-black text-center mb-3">
				{view === 'calendar' ? 'Elige la Fecha' : 'Elige el Turno'}
			</h2>
			{view === 'calendar' && (
				<div className="flex flex-col h-full">
					<div className="flex justify-between items-center mb-2 px-2 shrink-0">
						<button
							onClick={() => changeMonth(-1)}
							className="p-2 hover:bg-green-50 rounded-full text-neverland-green"
						>
							<ChevronLeft />
						</button>
						<span className="font-display font-bold capitalize text-neverland-green">
							{currentMonth.toLocaleDateString('es-ES', {
								month: 'long',
								year: 'numeric',
							})}
						</span>
						<button
							onClick={() => changeMonth(1)}
							className="p-2 hover:bg-green-50 rounded-full text-neverland-green"
						>
							<ChevronRight />
						</button>
					</div>
					<div className="grid grid-cols-7 mb-1 shrink-0">
						{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
							<span
								key={d}
								className="text-xs font-bold text-center opacity-60"
							>
								{d}
							</span>
						))}
					</div>
					<div className="grid grid-cols-7 gap-1 auto-rows-[1fr] grow content-stretch">
						{Array.from({ length: 42 }).map((_, i) => {
							const year = currentMonth.getFullYear();
							const month = currentMonth.getMonth();
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
							const occupied = getOccupiedForDate(dateStr);

							return (
								<button
									key={i}
									disabled={isPast}
									onClick={() => {
										if (!isCur) {
											const newM = new Date(date);
											newM.setDate(1);
											setCurrentMonth(newM);
										}
										setFormData({
											...formData,
											fecha: dateStr,
											turno: '',
										});
										setView('dayDetails');
									}}
									className={`rounded-xl flex flex-col items-center justify-start pt-1 relative transition-all border ${
										isSel
											? 'bg-neverland-green text-white shadow-md border-neverland-green'
											: isPast
												? 'bg-gray-50 text-gray-300 border-transparent'
												: isCur
													? 'bg-white text-gray-700 border-gray-100 hover:border-green-200'
													: 'bg-gray-50/50 text-gray-400 border-transparent hover:bg-white hover:border-green-100'
									}`}
								>
									<span
										className={`text-sm mb-0.5 ${isSel ? 'font-bold' : ''}`}
									>
										{date.getDate()}
									</span>

									{/* Stripes Indicators */}
									{!isPast && !isSel && (
										<div className="w-full px-0.5 flex flex-col gap-px">
											{['T1', 'T2', 'T3'].map((t) => {
												const isOcc = occupied.includes(t);
												return (
													<div
														key={t}
														className={`h-2 w-full rounded-sm flex items-center justify-center ${
															isOcc ? 'bg-gray-200' : 'bg-green-100'
														}`}
													>
														{!isOcc && (
															<span className="text-[9px] font-bold text-neverland-green tracking-tighter leading-none scale-[0.7]">
																LIBRE
															</span>
														)}
													</div>
												);
											})}
										</div>
									)}
								</button>
							);
						})}
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
						const isOcc = getOccupiedForDate(formData.fecha).includes(turn.id);
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
