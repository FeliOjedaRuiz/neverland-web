import React, { useState } from 'react';
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
	ChevronLeft,
	Check,
	ChevronDown,
	Loader2,
	AlertTriangle,
	Pencil,
	Plus,
	Trash2,
	ChevronRight,
	CheckCircle,
	Pizza,
	Mail,
} from 'lucide-react';
import {
	updateReservation,
	deleteReservation,
	getConfig,
	checkAvailability,
} from '../../services/api';

const ReservationDetailView = ({ reservation: initialReservation, onBack }) => {
	const [reservation, setReservation] = useState(initialReservation);
	const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [activeModal, setActiveModal] = useState(null); // 'client', 'datetime', 'menus', 'extras'
	const [config, setConfig] = useState(null);

	React.useEffect(() => {
		const fetchConfig = async () => {
			try {
				const res = await getConfig();
				setConfig(res.data);
			} catch (err) {
				console.error('Error fetching config:', err);
			}
		};
		fetchConfig();
	}, []);

	if (!reservation) return null;

	const handleStatusChange = async (newStatus) => {
		if (newStatus === reservation.estado) {
			setIsStatusMenuOpen(false);
			return;
		}
		if (newStatus === 'cancelado') {
			setShowDeleteConfirm(true);
			setIsStatusMenuOpen(false);
			return;
		}

		setIsUpdating(true);
		setIsStatusMenuOpen(false);
		try {
			await updateReservation(reservation.id, { estado: newStatus });
			setReservation({ ...reservation, estado: newStatus });
		} catch (err) {
			console.error('Error updating status:', err);
			alert('Error al actualizar el estado');
		} finally {
			setIsUpdating(false);
		}
	};

	const handleDelete = async () => {
		setIsUpdating(true);
		setShowDeleteConfirm(false);
		try {
			await deleteReservation(reservation.id);
			onBack(); // Go back to calendar or inbox
		} catch (err) {
			console.error('Error deleting reservation:', err);
			alert('Error al eliminar la reserva');
			setIsUpdating(false);
		}
	};

	const formatDate = (dateString, format = 'long') => {
		if (format === 'short') {
			const d = new Date(dateString);
			return `${String(d.getDate()).padStart(2, '0')}/${String(
				d.getMonth() + 1,
			).padStart(2, '0')}/${String(d.getFullYear()).substring(2)}`;
		}
		const options = {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		};
		return new Date(dateString).toLocaleDateString('es-ES', options);
	};

	const getTurnoLabel = (turnoId, horario) => {
		// If we have actual start/end times in the horario object, use them
		if (horario?.inicio && horario?.fin) {
			return `${horario.inicio} - ${horario.fin}`;
		}

		// Fallback to base times
		const baseTimes = {
			T1: '17:00 - 19:00',
			T2: '18:00 - 20:00',
			T3: '19:15 - 21:15',
		};

		const base = baseTimes[turnoId] || turnoId;

		// If there is an extension but no explicit inicio/fin, we should ideally calculate it,
		// but since the backend/frontend now send it, the first if should catch it.
		return base;
	};

	return (
		<div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300 relative">
			{/* Modal de Confirmación de Borrado */}
			{showDeleteConfirm && (
				<div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
						<div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
							<AlertTriangle size={32} />
						</div>
						<h3 className="text-xl font-display font-black text-text-black text-center mb-2">
							¿Eliminar reserva?
						</h3>
						<p className="text-gray-500 text-sm text-center mb-8 px-2">
							Esta acción no se puede deshacer. Se liberará el turno{' '}
							<span className="font-bold text-text-black">
								{reservation.turno}
							</span>{' '}
							del día{' '}
							<span className="font-bold text-text-black">
								{new Date(reservation.fecha).toLocaleDateString('es-ES')}
							</span>
							.
						</p>
						<div className="flex flex-col gap-3">
							<button
								onClick={handleDelete}
								disabled={isUpdating}
								className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-red-200 transition-all active:scale-95"
							>
								{isUpdating ? 'Eliminando...' : 'Sí, eliminar reserva'}
							</button>
							<button
								onClick={() => setShowDeleteConfirm(false)}
								className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black text-sm transition-all active:scale-95"
							>
								No, mantenerla
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Header con fondo verde */}
			<div className="flex items-center gap-3 p-4 bg-neverland-green text-white shrink-0 shadow-md relative z-20">
				<button
					onClick={onBack}
					className="p-1 -ml-1 hover:bg-white/20 rounded-full text-white transition-colors"
				>
					<ChevronLeft size={22} />
				</button>

				<div className="flex-1 min-w-0">
					{/* Fila 1: Nombre y Edad */}
					<h2 className="text-xl font-display font-black leading-tight break-words">
						{reservation.cliente?.nombreNiño}
						{reservation.cliente?.edadNiño
							? `, ${reservation.cliente.edadNiño} años`
							: ''}
					</h2>

					{/* Fila 2: ID */}
					<p className="text-white/60 text-[9px] font-black uppercase tracking-tight truncate mb-2">
						ID: {reservation.publicId}
					</p>

					{/* Fila 3: Fecha + Turno + Horario + Boton Estado */}
					<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
						<div className="flex items-center gap-2 text-[11px] font-black">
							<span className="opacity-90">
								{formatDate(reservation.fecha, 'short')}
							</span>
							<span className="text-white/40 bg-white/10 px-1 rounded text-[9px]">
								{reservation.turno}
							</span>
							<span className="opacity-95 text-[11px]">
								{getTurnoLabel(reservation.turno, reservation.horario)}
							</span>
						</div>

						<div className="relative">
							<button
								onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
								disabled={isUpdating}
								className={`px-3 py-1 rounded-2xl text-[9px] font-black uppercase flex items-center gap-1.5 transition-all active:scale-95 border-none shadow-none ${
									reservation.estado === 'confirmado' ||
									reservation.estado === 'confirmada'
										? 'bg-white/20 text-white'
										: reservation.estado === 'pendiente' ||
											  reservation.estado === 'solicitado'
											? 'bg-yellow-400 text-yellow-900 shadow-sm'
											: 'bg-white/10 text-white'
								}`}
							>
								{isUpdating ? (
									<Loader2 size={10} className="animate-spin" />
								) : (
									reservation.estado
								)}
								<ChevronDown
									size={12}
									className={`transition-transform duration-200 ${isStatusMenuOpen ? 'rotate-180' : ''}`}
								/>
							</button>

							{isStatusMenuOpen && (
								<div className="absolute right-0 mt-2 w-48 bg-white rounded-3xl shadow-2xl border border-gray-100 py-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden z-30 shadow-neverland-green/10">
									<p className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
										Estado
									</p>
									<button
										onClick={() => handleStatusChange('confirmado')}
										className="w-full text-left px-5 py-4 text-sm font-bold text-neverland-green hover:bg-neverland-green/5 flex items-center justify-between group"
									>
										Confirmar
										<Check
											size={16}
											className="opacity-0 group-hover:opacity-100 transition-opacity"
										/>
									</button>
									<button
										onClick={() => handleStatusChange('pendiente')}
										className="w-full text-left px-5 py-4 text-sm font-bold text-yellow-600 hover:bg-yellow-50 flex items-center justify-between group"
									>
										Pendiente
										<Clock
											size={16}
											className="opacity-0 group-hover:opacity-100 transition-opacity"
										/>
									</button>
									<button
										onClick={() => handleStatusChange('cancelado')}
										className="w-full text-left px-5 py-4 text-sm font-bold text-red-500 hover:bg-red-50 flex items-center justify-between group"
									>
										Cancelar
										<X
											size={16}
											className="opacity-0 group-hover:opacity-100 transition-opacity"
										/>
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/30">
				{/* Client Info */}
				<section className="space-y-4 max-w-3xl mx-auto">
					<div className="flex justify-between items-center">
						<h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
							<User size={14} /> Información del Cliente
						</h4>
						<button
							onClick={() => setActiveModal('client')}
							className="p-1.5 hover:bg-neverland-green/10 text-neverland-green rounded-lg transition-colors"
						>
							<Pencil size={14} />
						</button>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
						<div>
							<p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
								Niño/a del cumple
							</p>
							<p className="font-display font-black text-xl text-text-black">
								{reservation.cliente?.nombreNiño}
							</p>
							<span className="text-sm font-bold text-neverland-green bg-neverland-green/5 px-2 py-0.5 rounded">
								{reservation.cliente?.edadNiño} años
							</span>
						</div>
						<div>
							<p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
								Responsable
							</p>
							<p className="font-bold text-text-black">
								{reservation.cliente?.nombrePadre}
							</p>
							<a
								href={`https://wa.me/${reservation.cliente?.telefono?.replace(/\s/g, '')}`}
								target="_blank"
								rel="noreferrer"
								className="text-neverland-green hover:underline flex items-center gap-1 text-sm font-bold mt-2 bg-neverland-green/10 w-fit px-3 py-1 rounded-full"
							>
								<Phone size={14} /> {reservation.cliente?.telefono}
							</a>
							{reservation.cliente?.email && (
								<p className="flex items-center gap-1 text-sm font-bold mt-2 text-gray-500 bg-gray-100 w-fit px-3 py-1 rounded-full">
									<Mail size={14} /> {reservation.cliente.email}
								</p>
							)}
						</div>
					</div>
				</section>

				{/* Date & Time */}
				<section className="space-y-4 max-w-3xl mx-auto">
					<div className="flex justify-between items-center">
						<h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
							<Calendar size={14} /> Fecha y Horario
						</h4>
						<button
							onClick={() => setActiveModal('datetime')}
							className="p-1.5 hover:bg-neverland-green/10 text-neverland-green rounded-lg transition-colors"
						>
							<Pencil size={14} />
						</button>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
							<div className="w-12 h-12 bg-energy-orange/10 text-energy-orange rounded-2xl flex items-center justify-center">
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
						<div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
							<div className="w-12 h-12 bg-blue-400/10 text-blue-400 rounded-2xl flex items-center justify-center">
								<Clock size={24} />
							</div>
							<div>
								<p className="text-[10px] text-gray-400 font-black uppercase">
									Turno / Horario
								</p>
								<p className="font-bold text-text-black">
									{reservation.turno} (
									{getTurnoLabel(reservation.turno, reservation.horario)})
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

				{/* Menus */}
				<section className="space-y-4 max-w-3xl mx-auto">
					<div className="flex justify-between items-center">
						<h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
							<Utensils size={14} /> Menús y Asistencia
						</h4>
						<button
							onClick={() => setActiveModal('menus')}
							className="p-1.5 hover:bg-neverland-green/10 text-neverland-green rounded-lg transition-colors"
						>
							<Pencil size={14} />
						</button>
					</div>
					<div className="space-y-3">
						<div className="flex justify-between items-center p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
							<div className="flex items-center gap-3">
								<Smile className="text-neverland-green" size={20} />
								<span className="font-bold text-text-black">
									Niños ({reservation.detalles?.niños?.cantidad})
								</span>
							</div>
							<span className="bg-neverland-green/10 text-neverland-green px-4 py-1.5 rounded-full text-xs font-black uppercase">
								{(() => {
									const menu = config?.menusNiños?.find(
										(m) =>
											m.id === reservation.detalles?.niños?.menuId ||
											m.number === reservation.detalles?.niños?.menuId ||
											String(m.id) ===
												String(reservation.detalles?.niños?.menuId),
									);
									return menu
										? `${menu.nombre}${menu.principal ? `, ${menu.principal}` : ''}`
										: `Menú ${reservation.detalles?.niños?.menuId}`;
								})()}
							</span>
						</div>

						<div className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
							<div className="flex items-center gap-3 border-b border-gray-50 pb-3">
								<Utensils className="text-energy-orange" size={20} />
								<span className="font-bold text-text-black">
									Adultos ({reservation.detalles?.adultos?.cantidad || 0})
								</span>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
								{(() => {
									const adultos = reservation.detalles?.adultos;
									let normalized = [];

									if (Array.isArray(adultos)) {
										// Old Direct Array Format: [{item, cantidad}]
										normalized = adultos;
									} else if (adultos && typeof adultos === 'object') {
										if (Array.isArray(adultos.comida)) {
											// New Unified Format: { cantidad, comida: [{item, cantidad}] }
											normalized = adultos.comida;
										} else if (
											adultos.comida &&
											typeof adultos.comida === 'object'
										) {
											// Legacy Client Format: { cantidad, comida: { name: qty } }
											normalized = Object.entries(adultos.comida)
												.filter(([, qty]) => qty > 0)
												.map(([name, qty]) => ({
													item: name,
													cantidad: qty,
												}));
										}
									}

									const itemsToDisplay = normalized.filter(
										(i) => i.item && String(i.item).trim(),
									);

									if (itemsToDisplay.length > 0) {
										return itemsToDisplay.map((item, idx) => (
											<div
												key={idx}
												className="flex justify-between p-2 bg-gray-50 rounded-xl text-sm text-gray-600 font-medium"
											>
												<span className="truncate mr-2">{item.item}</span>
												<span className="font-black text-text-black shrink-0">
													x{item.cantidad}
												</span>
											</div>
										));
									}

									return (
										<p className="text-xs text-gray-400 italic">
											No se solicitó comida de adultos
										</p>
									);
								})()}
							</div>
						</div>
					</div>
				</section>

				{/* Extras */}
				<section className="space-y-4 max-w-3xl mx-auto">
					<div className="flex justify-between items-center">
						<h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
							<Sparkles size={14} /> Extras y Actividades
						</h4>
						<button
							onClick={() => setActiveModal('extras')}
							className="p-1.5 hover:bg-neverland-green/10 text-neverland-green rounded-lg transition-colors"
						>
							<Pencil size={14} />
						</button>
					</div>
					<div className="grid grid-cols-1 gap-3">
						{/* Actividad */}
						<div
							className={`p-4 px-6 rounded-3xl border flex items-center justify-between transition-all ${
								reservation.detalles?.extras?.taller !== 'ninguno'
									? 'bg-blue-50 border-blue-100 text-blue-600'
									: 'bg-gray-50 border-gray-100 text-gray-300 opacity-60'
							}`}
						>
							<div className="flex items-center gap-3">
								<Sparkles size={18} />
								<span className="text-[10px] font-black uppercase tracking-widest">
									Actividad
								</span>
							</div>
							<span className="text-sm font-black capitalize">
								{reservation.detalles?.extras?.taller === 'ninguno'
									? 'Sin actividad'
									: reservation.detalles?.extras?.taller}
							</span>
						</div>

						{/* Personaje */}
						<div
							className={`p-4 px-6 rounded-3xl border flex items-center justify-between transition-all ${
								reservation.detalles?.extras?.personaje !== 'ninguno'
									? 'bg-purple-50 border-purple-100 text-purple-600'
									: 'bg-gray-50 border-gray-100 text-gray-300 opacity-60'
							}`}
						>
							<div className="flex items-center gap-3">
								<Smile size={18} />
								<span className="text-[10px] font-black uppercase tracking-widest">
									Personaje
								</span>
							</div>
							<span className="text-sm font-black capitalize">
								{reservation.detalles?.extras?.personaje === 'ninguno'
									? 'Sin personaje'
									: reservation.detalles?.extras?.personaje}
							</span>
						</div>

						{/* Piñata */}
						<div
							className={`p-4 px-6 rounded-3xl border flex items-center justify-between transition-all ${
								reservation.detalles?.extras?.pinata
									? 'bg-energy-orange/5 border-energy-orange/20 text-energy-orange shadow-sm'
									: 'bg-gray-50 border-gray-100 text-gray-300 opacity-60'
							}`}
						>
							<div className="flex items-center gap-3">
								<Package size={18} />
								<span className="text-[10px] font-black uppercase tracking-widest">
									Piñata
								</span>
							</div>
							<span className="text-sm font-black">
								{reservation.detalles?.extras?.pinata ? 'Incluida' : 'No'}
							</span>
						</div>
					</div>
				</section>
			</div>

			{/* Sticky Price Box */}
			<div className="p-6 bg-white border-t border-gray-100 shrink-0 flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.03)] pb-8">
				<div>
					<p className="text-[10px] text-gray-400 font-black uppercase">
						Ingreso Previsto
					</p>
					<p className="text-4xl font-display font-black text-neverland-green">
						{reservation.precioTotal}€
					</p>
				</div>
				<div className="flex gap-2"></div>
			</div>

			{/* Modal Overlay System */}
			{activeModal && (
				<div className="fixed inset-0 z-110 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
						<div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
							<h3 className="text-lg font-display font-black text-text-black uppercase tracking-tight">
								{activeModal === 'client' && 'Editar Información Cliente'}
								{activeModal === 'datetime' && 'Editar Fecha y Horario'}
								{activeModal === 'menus' && 'Editar Menús y Asistencia'}
								{activeModal === 'extras' && 'Editar Extras y Actividades'}
							</h3>
							<button
								onClick={() => setActiveModal(null)}
								className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
							>
								<X size={20} />
							</button>
						</div>

						<div className="flex-1 overflow-y-auto p-6 sm:p-8">
							{activeModal === 'client' && (
								<ClientInfoEdit
									current={reservation.cliente}
									onCancel={() => setActiveModal(null)}
									onSave={async (newData) => {
										setIsUpdating(true);
										try {
											const res = await updateReservation(reservation.id, {
												cliente: newData,
											});
											setReservation(res.data); // Use server response
											setActiveModal(null);
										} catch (err) {
											console.error(err);
											alert('Error al guardar');
										} finally {
											setIsUpdating(false);
										}
									}}
								/>
							)}

							{activeModal === 'menus' && (
								<MenusEdit
									current={reservation.detalles}
									config={config}
									onCancel={() => setActiveModal(null)}
									onSave={async (newDetalles) => {
										setIsUpdating(true);
										try {
											const res = await updateReservation(reservation.id, {
												detalles: newDetalles,
											});
											setReservation(res.data); // Update with returned reservation (includes price)
											setActiveModal(null);
										} catch (err) {
											console.error(err);
											alert('Error al guardar');
										} finally {
											setIsUpdating(false);
										}
									}}
								/>
							)}

							{activeModal === 'extras' && (
								<ExtrasEdit
									current={reservation.detalles.extras}
									config={config}
									onCancel={() => setActiveModal(null)}
									onSave={async (newExtras) => {
										setIsUpdating(true);
										try {
											const res = await updateReservation(reservation.id, {
												detalles: {
													...reservation.detalles,
													extras: newExtras,
												},
											});
											setReservation(res.data);
											setActiveModal(null);
										} catch (err) {
											console.error(err);
											alert('Error al guardar');
										} finally {
											setIsUpdating(false);
										}
									}}
								/>
							)}

							{activeModal === 'datetime' && (
								<DateTimeEdit
									reservation={reservation}
									onCancel={() => setActiveModal(null)}
									onSave={async (newDate, newTurno) => {
										setIsUpdating(true);
										try {
											const res = await updateReservation(reservation.id, {
												fecha: newDate,
												turno: newTurno,
											});
											setReservation(res.data);
											setActiveModal(null);
										} catch (err) {
											console.error(err);
											alert('Error al guardar');
										} finally {
											setIsUpdating(false);
										}
									}}
								/>
							)}

							{/* Other modals will go here */}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

// Sub-component for Date and Time Edit
const DateTimeEdit = ({ reservation, onCancel, onSave }) => {
	const [view, setView] = useState('calendar'); // 'calendar' | 'shifts'
	const [currentMonth, setCurrentMonth] = useState(new Date(reservation.fecha));
	const [selectedDate, setSelectedDate] = useState(
		reservation.fecha.split('T')[0],
	);
	const [selectedTurno, setSelectedTurno] = useState(reservation.turno);
	const [occupied, setOccupied] = useState([]);

	const fetchAvailability = React.useCallback(async () => {
		try {
			const res = await checkAvailability({
				year: currentMonth.getFullYear(),
				month: currentMonth.getMonth() + 1,
			});
			// Filter out current reservation so it doesn't block itself
			// Now we use the ID returned by the backend to handle overlaps correctly
			const filtered = res.data.occupied.filter(
				(o) =>
					!(
						o.date === reservation.fecha.split('T')[0] &&
						(o.id === reservation.id ||
							(reservation.googleEventId && o.id === reservation.googleEventId))
					),
			);
			setOccupied(filtered);
		} catch (err) {
			console.error(err);
		}
	}, [
		currentMonth,
		reservation.fecha,
		reservation.id,
		reservation.googleEventId,
	]);

	React.useEffect(() => {
		fetchAvailability();
	}, [fetchAvailability]);

	const changeMonth = (delta) => {
		const newDate = new Date(currentMonth);
		newDate.setMonth(newDate.getMonth() + delta);
		setCurrentMonth(newDate);
	};

	const getOccupiedForDate = (dateStr) => {
		return occupied.filter((o) => o.date === dateStr).map((o) => o.shift);
	};

	return (
		<div className="space-y-6 flex flex-col h-full min-h-[400px]">
			{view === 'calendar' ? (
				<div className="flex flex-col h-full">
					<div className="flex justify-between items-center mb-6 bg-gray-50 p-2 rounded-2xl border border-gray-100">
						<button
							onClick={() => changeMonth(-1)}
							className="p-2 hover:bg-white rounded-full text-neverland-green transition-all"
						>
							<ChevronLeft size={24} />
						</button>
						<span className="font-display font-black capitalize text-text-black lg:text-lg">
							{currentMonth.toLocaleDateString('es-ES', {
								month: 'long',
								year: 'numeric',
							})}
						</span>
						<button
							onClick={() => changeMonth(1)}
							className="p-2 hover:bg-white rounded-full text-neverland-green transition-all"
						>
							<ChevronRight size={24} />
						</button>
					</div>

					<div className="grid grid-cols-7 mb-4">
						{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
							<span
								key={d}
								className="text-[10px] font-black text-center text-gray-400 uppercase tracking-widest"
							>
								{d}
							</span>
						))}
					</div>

					<div className="grid grid-cols-7 gap-1 grow">
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
							const isSel = selectedDate === dateStr;
							const dayOccupied = getOccupiedForDate(dateStr);
							const isFullyOccupied = dayOccupied.length >= 3;

							return (
								<button
									key={i}
									disabled={!isCur || isPast}
									onClick={() => {
										setSelectedDate(dateStr);
										setView('shifts');
									}}
									className={`min-h-[60px] rounded-2xl flex flex-col items-center justify-center relative transition-all border ${
										isSel
											? 'bg-neverland-green text-white shadow-lg border-neverland-green'
											: isPast
												? 'bg-gray-50 text-gray-200 border-transparent opacity-40 cursor-not-allowed'
												: isCur
													? isFullyOccupied
														? 'bg-red-50 text-red-300 border-red-100 hover:bg-red-100/50'
														: 'bg-white text-text-black border-gray-100 hover:border-neverland-green/50 hover:shadow-soft'
													: 'bg-transparent text-gray-200 border-transparent'
									}`}
								>
									<span className={`text-sm font-black ${isSel ? '' : ''}`}>
										{date.getDate()}
									</span>
									{isCur && !isPast && !isSel && (
										<div className="flex gap-0.5 mt-1">
											{[1, 2, 3].map((s) => (
												<div
													key={s}
													className={`w-1.5 h-1.5 rounded-full ${dayOccupied.includes(`T${s}`) ? 'bg-gray-200' : 'bg-neverland-green/40'}`}
												/>
											))}
										</div>
									)}
								</button>
							);
						})}
					</div>

					<div className="mt-8 flex gap-3">
						<button
							onClick={onCancel}
							className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm transition-all"
						>
							Cancelar
						</button>
					</div>
				</div>
			) : (
				<div className="space-y-6">
					<div className="bg-neverland-green/5 rounded-3xl p-6 flex justify-between items-center border border-neverland-green/10">
						<div>
							<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
								Dia Seleccionado
							</p>
							<p className="font-display font-black text-xl text-text-black capitalize">
								{new Date(selectedDate + 'T00:00:00').toLocaleDateString(
									'es-ES',
									{
										weekday: 'long',
										day: 'numeric',
										month: 'long',
									},
								)}
							</p>
						</div>
						<button
							onClick={() => setView('calendar')}
							className="bg-white p-3 rounded-2xl text-neverland-green shadow-soft hover:scale-105 transition-all"
						>
							<Calendar size={20} />
						</button>
					</div>

					<div className="grid grid-cols-1 gap-3">
						{[
							{ id: 'T1', label: 'T1', time: '17:00 - 19:00' },
							{ id: 'T2', label: 'T2', time: '18:00 - 20:00' },
							{ id: 'T3', label: 'T3', time: '19:15 - 21:15' },
						].map((turn) => {
							const isOcc = getOccupiedForDate(selectedDate).includes(turn.id);
							const isSelected = selectedTurno === turn.id;

							return (
								<button
									key={turn.id}
									disabled={isOcc}
									onClick={() => setSelectedTurno(turn.id)}
									className={`w-full p-5 rounded-[24px] border-2 flex justify-between items-center transition-all ${
										isSelected
											? 'border-neverland-green bg-neverland-green text-white shadow-xl scale-[1.02]'
											: isOcc
												? 'bg-gray-50 border-gray-100 opacity-40 cursor-not-allowed grayscale'
												: 'bg-white border-gray-100 hover:border-neverland-green/30 hover:bg-gray-50/50'
									}`}
								>
									<div className="flex items-center gap-4 text-left">
										<div
											className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${isSelected ? 'bg-white/20' : 'bg-gray-100 text-text-black'}`}
										>
											{turn.id}
										</div>
										<div>
											<p className="text-xs font-black uppercase opacity-60">
												Horario de Tarde
											</p>
											<p className="text-xl font-display font-black">
												{turn.time}
											</p>
										</div>
									</div>
									{isOcc ? (
										<div className="px-3 py-1 bg-gray-200 text-gray-500 text-[10px] font-black uppercase rounded-lg">
											Ocupado
										</div>
									) : (
										isSelected && <CheckCircle size={24} />
									)}
								</button>
							);
						})}
					</div>

					<div className="flex gap-3 pt-4 border-t border-gray-100">
						<button
							onClick={() => onSave(selectedDate, selectedTurno)}
							className="flex-1 py-4 bg-neverland-green text-white rounded-2xl font-black text-sm shadow-lg shadow-neverland-green/20 transition-all active:scale-95"
						>
							Guardar
						</button>
						<button
							onClick={() => setView('calendar')}
							className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm transition-all active:scale-95"
						>
							Volver
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

// Sub-component for Menus Edit
const MenusEdit = ({ current, config, onCancel, onSave }) => {
	const [niñosExt, setNiñosExt] = useState({ ...current.niños });
	const [adultosQty, setAdultosQty] = useState(current.adultos?.cantidad || 0);
	// Flatten/Normalize adultos for editing
	const [adultosList, setAdultosList] = useState(() => {
		if (Array.isArray(current.adultos)) return [...current.adultos];
		const comida = current.adultos?.comida;
		if (Array.isArray(comida)) return [...comida];
		if (comida && typeof comida === 'object') {
			return Object.entries(comida)
				.filter(([, qty]) => qty > 0)
				.map(([name, qty]) => {
					// Try to find price in config to maintain metadata if possible
					const configItem = config?.preciosAdultos?.find(
						(p) => p.nombre === name || p.id === name,
					);
					return {
						item: name,
						cantidad: qty,
						precioUnitario: configItem?.precio || 0,
					};
				});
		}
		return [];
	});

	const addAdultItem = (item) => {
		const existing = adultosList.findIndex((a) => a.item === item.nombre);
		if (existing >= 0) {
			const newList = [...adultosList];
			newList[existing] = {
				...newList[existing],
				cantidad: newList[existing].cantidad + 1,
			};
			setAdultosList(newList);
		} else {
			setAdultosList([
				...adultosList,
				{ item: item.nombre, cantidad: 1, precioUnitario: item.precio },
			]);
		}
	};

	const removeAdultItem = (idx) => {
		const newList = [...adultosList];
		newList.splice(idx, 1);
		setAdultosList(newList);
	};

	const updateAdultQty = (idx, qty) => {
		const newList = [...adultosList];
		newList[idx].cantidad = Math.max(1, qty);
		setAdultosList(newList);
	};

	return (
		<div className="space-y-8 pb-4">
			{/* Niños */}
			<div className="space-y-4">
				<h5 className="text-xs font-black text-neverland-green uppercase tracking-widest border-b border-neverland-green/10 pb-2">
					Asistencia Infantil
				</h5>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
							Cantidad de Niños
						</label>
						<div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-neverland-green/10 focus-within:border-neverland-green transition-all">
							<button
								onClick={() =>
									setNiñosExt({
										...niñosExt,
										cantidad: Math.max(12, niñosExt.cantidad - 1),
									})
								}
								className="px-4 py-3 hover:bg-white text-gray-400 font-bold transition-colors"
							>
								-
							</button>
							<input
								type="number"
								min="12"
								value={niñosExt.cantidad}
								onChange={(e) =>
									setNiñosExt({
										...niñosExt,
										cantidad: parseInt(e.target.value) || 12,
									})
								}
								className="w-full bg-transparent text-center font-bold outline-none py-3"
							/>
							<button
								onClick={() =>
									setNiñosExt({ ...niñosExt, cantidad: niñosExt.cantidad + 1 })
								}
								className="px-4 py-3 hover:bg-white text-gray-400 font-bold transition-colors"
							>
								+
							</button>
						</div>
					</div>
					<div className="space-y-2">
						<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
							Nivel de Menú
						</label>
						<select
							value={niñosExt.menuId}
							onChange={(e) =>
								setNiñosExt({ ...niñosExt, menuId: parseInt(e.target.value) })
							}
							className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-neverland-green/10 focus:border-neverland-green outline-none transition-all"
						>
							<option value={1}>Menú 1</option>
							<option value={2}>Menú 2</option>
							<option value={3}>Menú 3</option>
							<option value={4}>Menú 4</option>
						</select>
					</div>
				</div>
			</div>

			{/* Adultos */}
			<div className="space-y-4">
				<div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline border-b-2 border-orange-100/50 pb-5 gap-4">
					<div className="space-y-1">
						<h5 className="text-sm font-display font-black text-energy-orange uppercase tracking-wider">
							Adultos y Comida
						</h5>
						<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
							Gestión de asistentes y menú
						</p>
					</div>
					<div className="flex items-center justify-between w-full sm:w-auto gap-4 bg-orange-50 p-2.5 rounded-2xl border border-orange-100">
						<span className="text-[10px] font-black text-energy-orange uppercase pl-1">
							Total Adultos:
						</span>
						<div className="flex items-center bg-white border border-energy-orange/30 rounded-xl overflow-hidden shadow-sm">
							<button
								onClick={() => setAdultosQty(Math.max(0, adultosQty - 1))}
								className="px-4 py-2 hover:bg-orange-50 text-energy-orange font-black transition-colors"
							>
								-
							</button>
							<span className="px-5 py-2 font-display font-black text-base border-x border-orange-50 min-w-[56px] text-center text-text-black">
								{adultosQty}
							</span>
							<button
								onClick={() => setAdultosQty(adultosQty + 1)}
								className="px-4 py-2 hover:bg-orange-50 text-energy-orange font-black transition-colors"
							>
								+
							</button>
						</div>
					</div>
				</div>

				<div className="space-y-3">
					{adultosList.map((item, idx) => (
						<div
							key={idx}
							className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100"
						>
							<div className="flex-1">
								<p className="text-sm font-bold text-text-black">{item.item}</p>
								<p className="text-[10px] text-gray-400 font-bold">
									{item.precioUnitario}€ / ud.
								</p>
							</div>
							<div className="flex items-center gap-3">
								<div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
									<button
										onClick={() => updateAdultQty(idx, item.cantidad - 1)}
										className="px-3 py-1 hover:bg-gray-50 text-gray-400 font-bold"
									>
										-
									</button>
									<span className="px-3 py-1 font-bold text-sm border-x border-gray-100 min-w-[40px] text-center">
										{item.cantidad}
									</span>
									<button
										onClick={() => updateAdultQty(idx, item.cantidad + 1)}
										className="px-3 py-1 hover:bg-gray-50 text-gray-400 font-bold"
									>
										+
									</button>
								</div>
								<button
									onClick={() => removeAdultItem(idx)}
									className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
								>
									<Trash2 size={16} />
								</button>
							</div>
						</div>
					))}
				</div>

				{config?.preciosAdultos && (
					<div className="pt-2">
						<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
							Añadir Comida de Adultos
						</p>
						<div className="flex flex-wrap gap-2">
							{config.preciosAdultos
								.filter(
									(opt) => !adultosList.some((a) => a.item === opt.nombre),
								)
								.map((opt) => (
									<button
										key={opt.id}
										onClick={() => addAdultItem(opt)}
										className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-energy-orange hover:text-energy-orange transition-all flex items-center gap-2"
									>
										<Plus size={12} />
										{opt.nombre}
									</button>
								))}
						</div>
					</div>
				)}
			</div>

			<div className="flex gap-3 pt-6 border-t border-gray-100">
				<button
					onClick={() =>
						onSave({
							...current,
							niños: niñosExt,
							adultos: {
								cantidad: adultosQty,
								comida: adultosList,
							},
						})
					}
					className="flex-1 py-4 bg-neverland-green text-white rounded-2xl font-black text-sm shadow-lg shadow-neverland-green/20 transition-all active:scale-95"
				>
					Guardar
				</button>
				<button
					onClick={onCancel}
					className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm transition-all active:scale-95"
				>
					Cancelar
				</button>
			</div>
		</div>
	);
};

// Sub-component for Extras Edit
const ExtrasEdit = ({ current, config, onCancel, onSave }) => {
	const [formData, setFormData] = useState({ ...current });

	return (
		<div className="space-y-8 pb-4">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
				{/* Taller */}
				<div className="space-y-2">
					<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
						Actividad Seleccionada
					</label>
					<select
						value={formData.taller}
						onChange={(e) =>
							setFormData({ ...formData, taller: e.target.value })
						}
						className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-neverland-green/10 focus:border-neverland-green outline-none transition-all"
					>
						<option value="ninguno">Sin actividad</option>
						{config?.workshops?.map((ws) => (
							<option key={ws.id} value={ws.name}>
								{ws.name}
							</option>
						))}
					</select>
				</div>

				{/* Personaje */}
				<div className="space-y-2">
					<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
						Acompañamiento Personaje
					</label>
					<select
						value={formData.personaje}
						onChange={(e) =>
							setFormData({ ...formData, personaje: e.target.value })
						}
						className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-neverland-green/10 focus:border-neverland-green outline-none transition-all"
					>
						<option value="ninguno">Ninguno</option>
						{config?.characters?.map((char, idx) => (
							<option key={idx} value={char}>
								{char}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Piñata */}
			<div
				onClick={() => setFormData({ ...formData, pinata: !formData.pinata })}
				className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${
					formData.pinata
						? 'bg-energy-orange/5 border-energy-orange text-energy-orange shadow-inner'
						: 'bg-gray-50 border-gray-100 text-gray-400 grayscale'
				}`}
			>
				<div className="flex items-center gap-4">
					<div
						className={`w-12 h-12 rounded-2xl flex items-center justify-center ${formData.pinata ? 'bg-energy-orange/20' : 'bg-gray-200'}`}
					>
						<Package size={24} />
					</div>
					<div>
						<p className="font-display font-black text-lg">Incluir Piñata</p>
						<p className="text-xs opacity-70">
							{formData.pinata ? 'Servicio incluido' : 'Servicio no incluido'}
						</p>
					</div>
				</div>
				<div
					className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${formData.pinata ? 'border-energy-orange bg-energy-orange text-white' : 'border-gray-200 bg-white text-transparent'}`}
				>
					<Check size={18} />
				</div>
			</div>

			<div className="flex gap-3 pt-6 border-t border-gray-100">
				<button
					onClick={() => onSave(formData)}
					className="flex-1 py-4 bg-neverland-green text-white rounded-2xl font-black text-sm shadow-lg shadow-neverland-green/20 transition-all active:scale-95"
				>
					Guardar
				</button>
				<button
					onClick={onCancel}
					className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm transition-all active:scale-95"
				>
					Cancelar
				</button>
			</div>
		</div>
	);
};

// Sub-component for Client Info Edit
const ClientInfoEdit = ({ current, onCancel, onSave }) => {
	const [formData, setFormData] = useState({ ...current });

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="space-y-2">
					<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
						Nombre del Niño/a
					</label>
					<input
						type="text"
						value={formData.nombreNiño}
						onChange={(e) =>
							setFormData({ ...formData, nombreNiño: e.target.value })
						}
						className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-neverland-green/10 focus:border-neverland-green outline-none transition-all"
					/>
				</div>
				<div className="space-y-2">
					<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
						Edad
					</label>
					<input
						type="number"
						value={formData.edadNiño}
						onChange={(e) =>
							setFormData({ ...formData, edadNiño: parseInt(e.target.value) })
						}
						className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-neverland-green/10 focus:border-neverland-green outline-none transition-all"
					/>
				</div>
				<div className="space-y-2">
					<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
						Nombre del Padre/Madre
					</label>
					<input
						type="text"
						value={formData.nombrePadre}
						onChange={(e) =>
							setFormData({ ...formData, nombrePadre: e.target.value })
						}
						className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-neverland-green/10 focus:border-neverland-green outline-none transition-all"
					/>
				</div>
				<div className="space-y-2">
					<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
						Teléfono
					</label>
					<input
						type="text"
						value={formData.telefono}
						onChange={(e) =>
							setFormData({ ...formData, telefono: e.target.value })
						}
						className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-neverland-green/10 focus:border-neverland-green outline-none transition-all"
					/>
				</div>
				<div className="space-y-2 sm:col-span-2">
					<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
						Email de contacto
					</label>
					<input
						type="email"
						value={formData.email || ''}
						onChange={(e) =>
							setFormData({ ...formData, email: e.target.value })
						}
						className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-neverland-green/10 focus:border-neverland-green outline-none transition-all"
						placeholder="ejemplo@email.com"
					/>
				</div>
			</div>

			<div className="flex gap-3 pt-4 border-t border-gray-100">
				<button
					onClick={() => onSave(formData)}
					className="flex-1 py-4 bg-neverland-green text-white rounded-2xl font-black text-sm shadow-lg shadow-neverland-green/20 transition-all active:scale-95"
				>
					Guardar
				</button>
				<button
					onClick={onCancel}
					className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm transition-all active:scale-95"
				>
					Cancelar
				</button>
			</div>
		</div>
	);
};

export default ReservationDetailView;
