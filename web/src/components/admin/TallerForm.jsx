import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
	Save,
	Loader2,
	ArrowLeft,
	Upload,
	Image as ImageIcon,
	X,
	Trash2,
	Plus,
	ChevronLeft,
	ChevronRight,
	CheckCircle,
	Calendar,
	Lock,
	AlertCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
	getTallerById,
	createTaller,
	updateTaller,
	uploadTallerImage,
	getMonthlyAvailability,
} from '../../services/api';
import { safeParseDate } from '../../utils/safeDate';

// Turnos reales de Neverland
const SHIFTS = {
	T1: { label: 'Turno 1', time: '17:00 - 19:00' },
	T2: { label: 'Turno 2', time: '18:00 - 20:00' },
	T3: { label: 'Turno 3', time: '19:15 - 21:15' },
};

const SHIFT_ORDER = ['T1', 'T2', 'T3'];

const INITIAL_STATE = {
	nombre: '',
	descripcion: '',
	precio: 10,
	aforo: 15,
	fecha: '',
	turnos: [],
	horario: { inicio: '17:00', fin: '18:30' },
	portada: '',
	galeria: [],
};

const TallerForm = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const isEditing = Boolean(id);

	const [form, setForm] = useState(INITIAL_STATE);
	const [originalForm, setOriginalForm] = useState(null);
	const [loading, setLoading] = useState(isEditing);
	const [saving, setSaving] = useState(false);
	const [uploadingPortada, setUploadingPortada] = useState(false);
	const [uploadingGaleria, setUploadingGaleria] = useState(false);
	const [errors, setErrors] = useState({});

	// Calendario
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [availabilityCache, setAvailabilityCache] = useState({});
	const [availabilityLoading, setAvailabilityLoading] = useState(false);
	const [selectedDateObj, setSelectedDateObj] = useState(null);

	// Obtener disponibilidad del mes actual
	const fetchMonthAvailability = useCallback(async (monthDate) => {
		const year = monthDate.getFullYear();
		const month = monthDate.getMonth() + 1;
		const key = `${year}-${month}`;

		if (availabilityCache[key] !== undefined) return;

		setAvailabilityLoading(true);
		try {
			const res = await getMonthlyAvailability(year, month);
			const data = res.data?.occupied || res.data || [];
			setAvailabilityCache((prev) => ({ ...prev, [key]: data }));
		} catch (err) {
			console.error('Error fetching availability:', err);
		} finally {
			setAvailabilityLoading(false);
		}
	}, [availabilityCache]);

	useEffect(() => {
		fetchMonthAvailability(currentMonth);
	}, [currentMonth, fetchMonthAvailability]);

	// Formatear fecha YYYY-MM-DD a objeto Date
	const parseDateStr = (dateStr) => {
		if (!dateStr) return null;
		const d = safeParseDate(dateStr);
		return d && !isNaN(d.getTime()) ? d : null;
	};

	// Obtener turnos ocupados para una fecha
	const getOccupiedForDate = useCallback((dateObj) => {
		const y = dateObj.getFullYear();
		const m = dateObj.getMonth() + 1;
		const key = `${y}-${m}`;
		const monthData = availabilityCache[key] || [];

		const dateStr = [
			dateObj.getFullYear(),
			String(dateObj.getMonth() + 1).padStart(2, '0'),
			String(dateObj.getDate()).padStart(2, '0'),
		].join('-');

		const entries = monthData.filter((o) => o.date === dateStr);
		const ocupados = {};
		entries.forEach((e) => {
			ocupados[e.shift] = e.tipo || 'reserva'; // reserva, bloqueo, taller
		});
		return ocupados;
	}, [availabilityCache]);

	// Cargar taller existente si es edición
	useEffect(() => {
		if (!isEditing) return;
		const fetchTaller = async () => {
			setLoading(true);
			try {
				const res = await getTallerById(id);
				const t = res.data;
				const fechaObj = t.fecha ? new Date(t.fecha) : null;
				const fechaLocal = fechaObj && !isNaN(fechaObj.getTime())
					? fechaObj.toISOString().split('T')[0]
					: '';

				const loaded = {
					nombre: t.nombre || '',
					descripcion: t.descripcion || '',
					precio: t.precio ?? 10,
					aforo: t.aforo ?? 15,
					fecha: fechaLocal,
					turnos: t.turnos || [],
					horario: t.horario || { inicio: '17:00', fin: '18:30' },
					portada: t.portada || '',
					galeria: t.galeria || [],
				};
				setForm(loaded);
				setOriginalForm(JSON.parse(JSON.stringify(loaded)));

				if (fechaObj) {
					setCurrentMonth(fechaObj);
				}
			} catch (err) {
				console.error('Error fetching taller:', err);
				toast.error('Error al cargar el taller');
				navigate('/admin/talleres');
			} finally {
				setLoading(false);
			}
		};
		fetchTaller();
	}, [id, isEditing, navigate]);

	// También cargar disponibilidad para mes siguiente/anterior
	useEffect(() => {
		const next = new Date(currentMonth);
		next.setMonth(next.getMonth() + 1);
		fetchMonthAvailability(next);
		const prev = new Date(currentMonth);
		prev.setMonth(prev.getMonth() - 1);
		fetchMonthAvailability(prev);
	}, [currentMonth, fetchMonthAvailability]);

	const updateField = (field, value) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => ({ ...prev, [field]: null }));
	};

	const handleDateSelect = (dateStr, dateObj) => {
		updateField('fecha', dateStr);
		updateField('turnos', []);
		setSelectedDateObj(dateObj);
	};

	const handleTurnoToggle = (turno) => {
		const current = form.turnos;
		const nuevo = current.includes(turno)
			? current.filter((t) => t !== turno)
			: [...current, turno];
		updateField('turnos', nuevo);
	};

	const handlePortadaUpload = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith('image/')) { toast.error('El archivo debe ser una imagen'); return; }
		if (file.size > 20 * 1024 * 1024) { toast.error('La imagen es demasiado grande (máx 20MB)'); return; }

		setUploadingPortada(true);
		try {
			const res = await uploadTallerImage(file);
			if (res.data.imageUrl) {
				updateField('portada', res.data.imageUrl);
				toast.success('Portada subida');
			}
		} catch (err) {
			toast.error('Error al subir la portada');
		} finally {
			setUploadingPortada(false);
			e.target.value = '';
		}
	};

	const handleGaleriaUpload = async (e) => {
		const files = e.target.files;
		if (!files?.length) return;
		setUploadingGaleria(true);
		let count = 0;
		try {
			for (const file of files) {
				if (!file.type.startsWith('image/')) continue;
				const res = await uploadTallerImage(file);
				if (res.data.imageUrl) {
					setForm((prev) => ({ ...prev, galeria: [...prev.galeria, res.data.imageUrl] }));
					count++;
				}
			}
			if (count) toast.success(`${count} imagen(es) subida(s)`);
		} catch (err) {
			toast.error('Error al subir imágenes');
		} finally {
			setUploadingGaleria(false);
			e.target.value = '';
		}
	};

	const removeGaleriaImage = (index) => {
		setForm((prev) => ({ ...prev, galeria: prev.galeria.filter((_, i) => i !== index) }));
	};

	const validate = () => {
		const newErrors = {};
		if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
		if (!form.fecha) newErrors.fecha = 'Selecciona una fecha en el calendario';
		if (!form.horario.inicio) newErrors.horarioInicio = 'La hora de inicio es obligatoria';
		if (!form.horario.fin) newErrors.horarioFin = 'La hora de fin es obligatoria';
		if (form.horario.inicio && form.horario.fin && form.horario.inicio >= form.horario.fin)
			newErrors.horarioFin = 'La hora de fin debe ser posterior a la de inicio';
		if (form.turnos.length === 0) newErrors.turnos = 'Selecciona al menos un turno';
		if (!form.precio || form.precio <= 0) newErrors.precio = 'El precio debe ser mayor que 0';
		if (!form.aforo || form.aforo < 1) newErrors.aforo = 'El aforo mínimo es 1';

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validate()) {
			try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) { window.scrollTo(0, 0); }
			toast.error('Corrige los errores antes de guardar');
			return;
		}
		setSaving(true);
		try {
			const payload = {
				nombre: form.nombre.trim(),
				descripcion: form.descripcion.trim(),
				precio: Number(form.precio),
				aforo: Number(form.aforo),
				fecha: form.fecha,
				turnos: form.turnos,
				horario: form.horario,
				portada: form.portada,
				galeria: form.galeria,
			};
			const res = isEditing
				? await updateTaller(id, payload)
				: await createTaller(payload);
			if (isEditing) toast.success('Taller actualizado');
			else toast.success('Taller creado');
			const savedId = res.data?.id || res.data?._id || id;
			navigate(`/admin/talleres/${savedId}`);
		} catch (err) {
			const msg = err.response?.data?.error || err.response?.data?.message || 'Error al guardar el taller';
			toast.error(msg);
		} finally {
			setSaving(false);
		}
	};

	// Generar días del mes para el calendario
	const renderCalendar = () => {
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();
		const firstDay = new Date(year, month, 1);
		const startDay = (firstDay.getDay() + 6) % 7; // Lunes = 0
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const weeks = [];
		let day = 1;
		for (let w = 0; w < 6; w++) {
			const week = [];
			for (let d = 0; d < 7; d++) {
				if (w === 0 && d < startDay) {
					week.push(null);
				} else if (day > new Date(year, month + 1, 0).getDate()) {
					week.push(null);
				} else {
					const date = new Date(year, month, day);
					const dateStr = [
						date.getFullYear(),
						String(date.getMonth() + 1).padStart(2, '0'),
						String(day).padStart(2, '0'),
					].join('-');
					week.push({ date, dateStr, dayNum: day });
					day++;
				}
			}
			weeks.push(week);
		}
		return weeks;
	};

	const cycleMonth = (dir) => {
		const next = new Date(currentMonth);
		next.setMonth(next.getMonth() + dir);
		setCurrentMonth(next);
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-full py-20 text-gray-300 gap-4">
				<Loader2 className="animate-spin text-neverland-green/40" size={48} />
				<p className="font-display font-black uppercase tracking-widest text-[10px]">Cargando taller...</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full animate-in fade-in duration-300">
			<div className="flex-1 overflow-y-auto pb-8">
				<div className="p-6 max-w-3xl mx-auto">
					<button
						onClick={() => navigate('/admin/talleres')}
						className="flex items-center gap-2 text-gray-400 hover:text-neverland-green transition-colors font-display font-bold text-[10px] uppercase tracking-wider mb-4"
					>
						<ArrowLeft size={14} /> Volver a talleres
					</button>

					<motion.form
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						onSubmit={handleSubmit}
						className="bg-white rounded-[40px] p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6"
					>
						<h2 className="text-2xl font-display font-black text-text-black">
							{isEditing ? 'Editar Taller' : 'Nuevo Taller'}
						</h2>

						{/* Nombre */}
						<div>
							<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
								Nombre del taller <span className="text-red-400">*</span>
							</label>
							<input
								type="text"
								value={form.nombre}
								onChange={(e) => updateField('nombre', e.target.value)}
								placeholder="Ej: Taller de Slime"
								className={`w-full bg-gray-50/50 p-4 rounded-2xl text-sm font-bold text-text-black border outline-none transition-all min-text-[16px] ${
									errors.nombre ? 'border-red-200 bg-red-50/30' : 'border-transparent focus:bg-white focus:border-neverland-green/20'
								}`}
							/>
							{errors.nombre && <p className="text-[10px] text-red-500 font-medium mt-1 ml-1">{errors.nombre}</p>}
						</div>

						{/* Descripción */}
						<div>
							<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Descripción</label>
							<div className="relative">
								<textarea
									value={form.descripcion}
									onChange={(e) => { if (e.target.value.length <= 150) updateField('descripcion', e.target.value); }}
									placeholder="Describe el taller (máx 150 caracteres)..."
									rows={3}
									className="w-full bg-gray-50/50 p-4 rounded-2xl text-sm font-medium text-gray-600 border border-transparent focus:bg-white focus:border-neverland-green/20 outline-none resize-none transition-all leading-relaxed min-text-[16px]"
								/>
								<div className={`absolute bottom-3 right-3 text-[8px] font-black ${form.descripcion.length >= 140 ? 'text-energy-orange' : 'text-gray-200'}`}>
									{form.descripcion.length}/150
								</div>
							</div>
						</div>

						{/* Precio y Aforo */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Precio (€) <span className="text-red-400">*</span></label>
								<input type="number" min="0" step="0.5" value={form.precio}
									onChange={(e) => updateField('precio', parseFloat(e.target.value) || 0)}
									className={`w-full bg-gray-50/50 p-4 rounded-2xl text-sm font-bold text-text-black border outline-none transition-all min-text-[16px] ${errors.precio ? 'border-red-200 bg-red-50/30' : 'border-transparent focus:bg-white focus:border-neverland-green/20'}`} />
								{errors.precio && <p className="text-[10px] text-red-500 font-medium mt-1 ml-1">{errors.precio}</p>}
							</div>
							<div>
								<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Aforo <span className="text-red-400">*</span></label>
								<input type="number" min="1" value={form.aforo}
									onChange={(e) => updateField('aforo', parseInt(e.target.value) || 1)}
									className={`w-full bg-gray-50/50 p-4 rounded-2xl text-sm font-bold text-text-black border outline-none transition-all min-text-[16px] ${errors.aforo ? 'border-red-200 bg-red-50/30' : 'border-transparent focus:bg-white focus:border-neverland-green/20'}`} />
								{errors.aforo && <p className="text-[10px] text-red-500 font-medium mt-1 ml-1">{errors.aforo}</p>}
							</div>
						</div>

						{/* Calendario */}
						<div>
							<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">
								Fecha y Turnos <span className="text-red-400">*</span>
							</label>

							{/* Navegación de mes */}
							<div className="flex justify-between items-center mb-3 px-2">
								<button type="button" onClick={() => cycleMonth(-1)}
									className="p-1.5 hover:bg-green-50 rounded-full text-neverland-green transition-colors">
									<ChevronLeft size={20} />
								</button>
								<span className="font-display font-bold capitalize text-neverland-green text-sm">
									{currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
								</span>
								<button type="button" onClick={() => cycleMonth(1)}
									className="p-1.5 hover:bg-green-50 rounded-full text-neverland-green transition-colors">
									<ChevronRight size={20} />
								</button>
							</div>

							{/* Cabecera días */}
							<div className="grid grid-cols-7 mb-1">
								{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
									<span key={d} className="text-[10px] font-bold text-center opacity-40">{d}</span>
								))}
							</div>

							{/* Grid del mes */}
							<div className="relative">
								{availabilityLoading && (
									<div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
										<div className="w-8 h-8 border-4 border-neverland-green/20 border-t-neverland-green rounded-full animate-spin" />
									</div>
								)}
								<div className="grid grid-cols-7 gap-1.5">
									{renderCalendar().flat().map((cell, i) => {
										if (!cell) return <div key={i} className="aspect-square" />;
										const { date, dateStr, dayNum } = cell;
										const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
										const isSelected = form.fecha === dateStr;
										const occupied = getOccupiedForDate(date);
										const allThreeOccupied = Object.keys(occupied).length >= 3;

										// Determinar si tiene bloqueos (todos los ocupados son bloqueo o taller)
										const soloBloqueosYTalleres = Object.values(occupied).every(t => t === 'bloqueo' || t === 'taller');
										const tieneReservas = Object.values(occupied).some(t => t === 'reserva');

										return (
											<button
												key={i}
												type="button"
												disabled={isPast}
												onClick={() => handleDateSelect(dateStr, date)}
												className={`aspect-square rounded-xl flex flex-col items-center justify-center p-1 transition-all border text-xs ${
													isSelected
														? 'bg-neverland-green text-white shadow-md border-neverland-green scale-105'
														: isPast
															? 'bg-gray-50 text-gray-300 border-transparent cursor-not-allowed'
															: 'bg-white text-gray-700 border-gray-100 hover:border-green-200 cursor-pointer'
												}`}
											>
												<span className={`text-sm ${isSelected ? 'font-black' : 'font-bold'}`}>{dayNum}</span>
												{!isPast && !isSelected && (
													<div className="w-full flex gap-px mt-0.5">
														{SHIFT_ORDER.map((t) => {
															const tipo = occupied[t];
															let bg;
															if (!tipo) bg = 'bg-green-100'; // Libre
															else if (tipo === 'bloqueo') bg = 'bg-blue-300'; // Bloqueo = seleccionable
															else if (tipo === 'taller') bg = 'bg-purple-300'; // Otro taller
															else bg = 'bg-red-200'; // Reserva cumpleaños = NO seleccionable
															return <div key={t} className={`h-1 flex-1 rounded-full ${bg}`} />;
														})}
													</div>
												)}
											</button>
										);
									})}
								</div>
							</div>

							{/* Leyenda */}
							<div className="flex items-center gap-4 mt-3 text-[9px] font-bold text-gray-400 flex-wrap">
								<span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block" /> Libre</span>
								<span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-300 inline-block" /> Bloqueo (seleccionable)</span>
								<span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 inline-block" /> Reserva (no disponible)</span>
								<span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-300 inline-block" /> Taller</span>
							</div>
						</div>

						{/* Selector de turnos */}
						{form.fecha && (
							<div>
								<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">
									Turnos <span className="text-red-400">*</span>
									{form.fecha && (
										<span className="ml-2 text-neverland-green font-sans normal-case tracking-normal">
											— {safeParseDate(form.fecha)?.toLocaleDateString?.('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) || form.fecha}
										</span>
									)}
								</label>

								<div className="space-y-2">
									{SHIFT_ORDER.map((turnId) => {
										const shift = SHIFTS[turnId];
										const occupied = getOccupiedForDate(selectedDateObj || parseDateStr(form.fecha) || new Date());
										const tipoOcupacion = occupied[turnId];
										const esReserva = tipoOcupacion === 'reserva';
										const esBloqueo = tipoOcupacion === 'bloqueo';
										const esTaller = tipoOcupacion === 'taller';
										const isSelected = form.turnos.includes(turnId);
										const seleccionable = !esReserva; // Solo las reservas de cumpleaños NO son seleccionables

										return (
											<button
												key={turnId}
												type="button"
												disabled={!seleccionable}
												onClick={() => handleTurnoToggle(turnId)}
												className={`w-full p-4 rounded-2xl border-2 flex justify-between items-center transition-all ${
													isSelected
														? 'border-neverland-green bg-neverland-green text-white shadow-lg'
														: esReserva
															? 'bg-red-50/30 border-red-100 cursor-not-allowed opacity-60'
															: esBloqueo
																? 'bg-blue-50/50 border-blue-200 hover:border-green-300 cursor-pointer'
																: esTaller
																	? 'bg-purple-50/50 border-purple-200 hover:border-green-300 cursor-pointer'
																	: 'bg-white border-gray-100 hover:border-green-200 cursor-pointer'
												}`}
											>
												<div className="text-left">
													<p className={`text-xs font-bold uppercase ${isSelected ? 'opacity-80' : esReserva ? 'text-red-400' : 'text-gray-500'}`}>
														{shift.label}
													</p>
													<p className={`text-xl font-black ${isSelected ? '' : esReserva ? 'text-red-400' : ''}`}>
														{shift.time}
													</p>
												</div>
												{esReserva && (
													<span className="flex items-center gap-1 text-xs font-bold bg-red-100 px-2.5 py-1 rounded-lg text-red-500">
														<Lock size={12} /> OCUPADO
													</span>
												)}
												{esBloqueo && (
													<span className="flex items-center gap-1 text-xs font-bold bg-blue-100 px-2.5 py-1 rounded-lg text-blue-600">
														<Lock size={12} /> BLOQUEO
													</span>
												)}
												{esTaller && (
													<span className="flex items-center gap-1 text-xs font-bold bg-purple-100 px-2.5 py-1 rounded-lg text-purple-600">
														<AlertCircle size={12} /> TALLER
													</span>
												)}
												{!tipoOcupacion && isSelected && <CheckCircle size={20} />}
												{!tipoOcupacion && !isSelected && (
													<span className="text-[9px] font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">DISPONIBLE</span>
												)}
											</button>
										);
									})}
								</div>
								{errors.turnos && <p className="text-[10px] text-red-500 font-medium mt-2 ml-1">{errors.turnos}</p>}
							</div>
						)}

						{/* Horario */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Hora inicio <span className="text-red-400">*</span></label>
								<input type="time" value={form.horario.inicio}
									onChange={(e) => setForm((prev) => ({ ...prev, horario: { ...prev.horario, inicio: e.target.value } }))}
									className="w-full bg-gray-50/50 p-4 rounded-2xl text-sm font-bold text-text-black border border-transparent focus:bg-white focus:border-neverland-green/20 outline-none transition-all min-text-[16px]" />
							</div>
							<div>
								<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Hora fin <span className="text-red-400">*</span></label>
								<input type="time" value={form.horario.fin}
									onChange={(e) => setForm((prev) => ({ ...prev, horario: { ...prev.horario, fin: e.target.value } }))}
									className={`w-full bg-gray-50/50 p-4 rounded-2xl text-sm font-bold text-text-black border outline-none transition-all min-text-[16px] ${errors.horarioFin ? 'border-red-200 bg-red-50/30' : 'border-transparent focus:bg-white focus:border-neverland-green/20'}`} />
								{errors.horarioFin && <p className="text-[10px] text-red-500 font-medium mt-1 ml-1">{errors.horarioFin}</p>}
							</div>
						</div>

						{/* Portada */}
						<div>
							<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Imagen de portada</label>
							<div className="relative">
								{form.portada ? (
									<div className="relative rounded-2xl overflow-hidden bg-gray-100 h-48 sm:h-56">
										<img src={form.portada} alt="Portada" className="w-full h-full object-cover" />
										<div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
										<div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
											<label className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-xl transition-all cursor-pointer border border-white/30">
												<input type="file" className="hidden" accept="image/*" onChange={handlePortadaUpload} disabled={uploadingPortada} />
												<Upload size={14} /><span className="font-display font-black text-[9px] uppercase tracking-wider">Cambiar</span>
											</label>
											<button type="button" onClick={() => updateField('portada', '')} className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-xl transition-all"><Trash2 size={14} /></button>
										</div>
										{uploadingPortada && <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center"><Loader2 className="animate-spin text-neverland-green" size={28} /></div>}
									</div>
								) : (
									<label className="flex flex-col items-center justify-center h-48 sm:h-56 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-neverland-green/30 hover:bg-neverland-green/5 transition-all group">
										<input type="file" className="hidden" accept="image/*" onChange={handlePortadaUpload} disabled={uploadingPortada} />
										{uploadingPortada ? (<><Loader2 className="animate-spin text-neverland-green mb-2" size={28} /><p className="text-[10px] font-black text-neverland-green uppercase tracking-widest">Subiendo...</p></>) : (
											<><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-300 mb-2 shadow-sm group-hover:scale-110 transition-transform"><ImageIcon size={22} /></div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Añadir portada</p></>
										)}
									</label>
								)}
							</div>
						</div>

						{/* Galería */}
						<div>
							<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Galería de imágenes</label>
							<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-3">
								{form.galeria.map((url, idx) => (
									<div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
										<img src={url} alt={`Galería ${idx + 1}`} className="w-full h-full object-cover" />
										<button type="button" onClick={() => removeGaleriaImage(idx)} className="absolute top-1 right-1 p-1 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-500"><X size={10} /></button>
									</div>
								))}
								<label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-neverland-green/30 hover:bg-neverland-green/5 transition-all group">
									<input type="file" className="hidden" accept="image/*" multiple onChange={handleGaleriaUpload} disabled={uploadingGaleria} />
									{uploadingGaleria ? <Loader2 className="animate-spin text-neverland-green" size={20} /> : <><Plus size={18} className="text-gray-300 group-hover:text-neverland-green transition-colors" /><span className="text-[7px] font-black text-gray-300 uppercase tracking-wider mt-1">Añadir</span></>}
								</label>
							</div>
						</div>

						{/* Submit */}
						<div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50">
							<button type="button" onClick={() => navigate('/admin/talleres')}
								className="px-6 py-2.5 text-gray-400 hover:text-gray-600 font-display font-black text-[10px] uppercase tracking-wider transition-colors">Cancelar</button>
							<button type="submit" disabled={saving}
								className="flex items-center gap-2 px-6 py-2.5 bg-neverland-green text-white rounded-2xl font-display font-black text-[10px] uppercase tracking-wider shadow-lg shadow-neverland-green/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
								{saving ? <><Loader2 size={14} className="animate-spin" />{isEditing ? 'Guardando...' : 'Creando...'}</> : <><Save size={14} />{isEditing ? 'Guardar Cambios' : 'Crear Taller'}</>}
							</button>
						</div>
					</motion.form>
				</div>
			</div>
		</div>
	);
};

export default TallerForm;
