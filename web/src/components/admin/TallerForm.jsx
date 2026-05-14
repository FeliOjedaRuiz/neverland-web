import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
	Save, Loader2, ArrowLeft, Upload, Image as ImageIcon, X, Trash2, Plus,
	Minus, ChevronLeft, ChevronRight, CheckCircle, Lock, AlertCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
	getTallerById, createTaller, updateTaller, uploadTallerImage, deleteTallerImage, getMonthlyAvailability,
} from '../../services/api';
import { safeParseDate } from '../../utils/safeDate';

const SHIFTS = {
	T1: { label: 'Turno 1', time: '17:00 - 19:00' },
	T2: { label: 'Turno 2', time: '18:00 - 20:00' },
	T3: { label: 'Turno 3', time: '19:15 - 21:15' },
};
const SHIFT_ORDER = ['T1', 'T2', 'T3'];

// ── Componente Numérico con +/- ──
const NumberInput = ({ label, value, onChange, min, max, step = 1, allowDecimals = false, error }) => {
	const handleDelta = (delta) => {
		const next = (parseFloat(value) || 0) + delta;
		if (min !== undefined && next < min) return;
		if (max !== undefined && next > max) return;
		onChange(allowDecimals ? next : Math.round(next));
	};
	return (
		<div className="flex-1">
			<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">{label}</label>
			<div className={`flex items-center bg-white border ${error ? 'border-red-200' : 'border-gray-200'} rounded-xl overflow-hidden`}>
				<button type="button" onClick={() => handleDelta(-step)}
					className="p-2.5 text-gray-400 hover:text-neverland-green hover:bg-gray-50 transition-colors">
					<Minus size={16} />
				</button>
				<input type="number" value={value} min={min} max={max} step={allowDecimals ? 0.5 : 1}
					onChange={(e) => onChange(allowDecimals ? parseFloat(e.target.value) : parseInt(e.target.value) || 0)}
					className="w-full text-center text-sm font-black bg-transparent outline-none p-2 min-text-[16px]" />
				<button type="button" onClick={() => handleDelta(step)}
					className="p-2.5 text-gray-400 hover:text-neverland-green hover:bg-gray-50 transition-colors">
					<Plus size={16} />
				</button>
			</div>
			{error && <p className="text-[10px] text-red-500 font-medium mt-1">{error}</p>}
		</div>
	);
};

const INITIAL_STATE = {
	nombre: '', descripcion: '', precio: 10, aforo: 15, fecha: '', turnos: [],
	horario: { inicio: '17:00', fin: '18:30' }, portada: '', galeria: [],
};

const TallerForm = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const isEditing = Boolean(id);

	const [form, setForm] = useState(INITIAL_STATE);
	const [loading, setLoading] = useState(isEditing);
	const [saving, setSaving] = useState(false);
	const [errors, setErrors] = useState({});
	const [uploadingPortada, setUploadingPortada] = useState(false);
	const [uploadingGaleria, setUploadingGaleria] = useState(false);

	// ── Calendario de disponibilidad ──
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [availabilityCache, setAvailabilityCache] = useState({});
	const [availabilityLoading, setAvailabilityLoading] = useState(false);
	const [selectedDateObj, setSelectedDateObj] = useState(null);

	const fetchMonthAvailability = useCallback(async (monthDate) => {
		const year = monthDate.getFullYear();
		const month = monthDate.getMonth() + 1;
		const key = `${year}-${month}`;
		if (availabilityCache[key] !== undefined) return;
		setAvailabilityLoading(true);
		try {
			const res = await getMonthlyAvailability(year, month);
			setAvailabilityCache((prev) => ({ ...prev, [key]: res.data?.occupied || res.data || [] }));
		} catch (err) {
			console.error('Error fetching availability:', err);
		} finally {
			setAvailabilityLoading(false);
		}
	}, [availabilityCache]);

	useEffect(() => { fetchMonthAvailability(currentMonth); }, [currentMonth, fetchMonthAvailability]);

	useEffect(() => {
		const next = new Date(currentMonth);
		next.setMonth(next.getMonth() + 1);
		fetchMonthAvailability(next);
		const prev = new Date(currentMonth);
		prev.setMonth(prev.getMonth() - 1);
		fetchMonthAvailability(prev);
	}, [currentMonth, fetchMonthAvailability]);

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
		entries.forEach((e) => { ocupados[e.shift] = e; });
		return ocupados;
	}, [availabilityCache]);

	// ── Cargar taller existente ──
	useEffect(() => {
		if (!isEditing) return;
		const fetchTaller = async () => {
			setLoading(true);
			try {
				const res = await getTallerById(id);
				const t = res.data;
				const fechaObj = t.fecha ? new Date(t.fecha) : null;
				setForm({
					nombre: t.nombre || '', descripcion: t.descripcion || '', precio: t.precio ?? 10,
					aforo: t.aforo ?? 15, fecha: fechaObj ? fechaObj.toISOString().split('T')[0] : '',
					turnos: t.turnos || [], horario: t.horario || { inicio: '17:00', fin: '18:30' },
					portada: t.portada || '', galeria: t.galeria || [],
				});
				if (fechaObj) setCurrentMonth(fechaObj);
			} catch (err) {
				toast.error('Error al cargar el taller');
				navigate('/admin/talleres');
			} finally { setLoading(false); }
		};
		fetchTaller();
	}, [id, isEditing, navigate]);

	// ── Handlers ──
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
		updateField('turnos',
			form.turnos.includes(turno)
				? form.turnos.filter((t) => t !== turno)
				: [...form.turnos, turno]
		);
	};

	const handlePortadaUpload = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith('image/')) { toast.error('Debe ser una imagen'); return; }
		if (file.size > 20 * 1024 * 1024) { toast.error('Máx 20MB'); return; }
		setUploadingPortada(true);
		try {
			const res = await uploadTallerImage(file);
			if (res.data.imageUrl) {
				updateField('portada', res.data.imageUrl);
				toast.success('Portada subida');
			}
		} catch (err) { toast.error('Error al subir portada'); } finally { setUploadingPortada(false); }
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
		} catch (err) { toast.error('Error al subir imágenes'); } finally { setUploadingGaleria(false); }
	};

	const handleDeleteGaleriaImage = async (url) => {
		try {
			await deleteTallerImage(url);
			setForm((prev) => ({ ...prev, galeria: prev.galeria.filter((u) => u !== url) }));
			toast.success('Imagen eliminada');
		} catch (err) {
			toast.error('Error al eliminar imagen');
		}
	};

	const validate = () => {
		const errs = {};
		if (!form.nombre.trim()) errs.nombre = 'Obligatorio';
		if (!form.fecha) errs.fecha = 'Selecciona una fecha';
		if (!form.horario?.inicio) errs.horarioInicio = 'Requerido';
		if (!form.horario?.fin) errs.horarioFin = 'Requerido';
		if (form.horario?.inicio && form.horario?.fin && form.horario.inicio >= form.horario.fin)
			errs.horarioFin = 'Debe ser posterior a inicio';
		if (form.turnos.length === 0) errs.turnos = 'Selecciona al menos un turno';
		if (!form.precio || form.precio <= 0) errs.precio = 'Debe ser > 0';
		if (!form.aforo || form.aforo < 1) errs.aforo = 'Mínimo 1';
		setErrors(errs);
		return Object.keys(errs).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validate()) return;
		setSaving(true);
		try {
			const payload = {
				nombre: form.nombre.trim(), descripcion: form.descripcion.trim(),
				precio: Number(form.precio), aforo: Number(form.aforo),
				fecha: form.fecha, turnos: form.turnos, horario: form.horario,
				portada: form.portada, galeria: form.galeria,
			};
			const res = isEditing ? await updateTaller(id, payload) : await createTaller(payload);
			toast.success(isEditing ? 'Taller actualizado' : 'Taller creado');
			const savedId = res.data?.id || res.data?._id || id;
			navigate(`/admin/talleres/${savedId}`);
		} catch (err) {
			const msg = err.response?.data?.error || err.response?.data?.message || 'Error al guardar';
			toast.error(msg);
		} finally { setSaving(false); }
	};

	// ── Render calendario ──
	const renderCalendar = () => {
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();
		const startDay = (new Date(year, month, 1).getDay() + 6) % 7;
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const days = [];
		let dayNum = 1;
		for (let w = 0; w < 6; w++) {
			const week = [];
			for (let d = 0; d < 7; d++) {
				if (w === 0 && d < startDay) { week.push(null); }
				else if (dayNum > daysInMonth) { week.push(null); }
				else {
					const date = new Date(year, month, dayNum);
					const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
					week.push({ date, dateStr, dayNum });
					dayNum++;
				}
			}
			days.push(week);
		}
		return days;
	};

	// ── Loading ──
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
				<div className="p-4 sm:p-6 max-w-2xl mx-auto">
					<button onClick={() => navigate('/admin/talleres')}
						className="flex items-center gap-2 text-gray-400 hover:text-neverland-green transition-colors font-bold text-[10px] uppercase tracking-wider mb-3">
						<ArrowLeft size={14} /> Volver a talleres
					</button>

					<motion.form
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						onSubmit={handleSubmit}
						className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4"
					>
						<h2 className="text-xl font-display font-black text-text-black">
							{isEditing ? 'Editar Taller' : 'Nuevo Taller'}
						</h2>

						{/* ── Nombre ── */}
						<div>
							<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nombre <span className="text-red-400">*</span></label>
							<input type="text" value={form.nombre} onChange={(e) => updateField('nombre', e.target.value)}
								placeholder="Ej: Taller de Slime"
								className={`w-full bg-white p-3 rounded-xl text-sm font-bold text-text-black border outline-none transition-all min-text-[16px] ${errors.nombre ? 'border-red-200' : 'border-gray-200 focus:border-neverland-green'}`} />
							{errors.nombre && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.nombre}</p>}
						</div>

						{/* ── Descripción ── */}
						<div>
							<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Descripción</label>
							<div className="relative">
								<textarea value={form.descripcion} rows={2}
									onChange={(e) => { if (e.target.value.length <= 150) updateField('descripcion', e.target.value); }}
									placeholder="Describe el taller (máx 150)..."
									className="w-full bg-white p-3 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 focus:border-neverland-green outline-none resize-none transition-all min-text-[16px]" />
								<div className={`absolute bottom-2 right-3 text-[8px] font-black ${form.descripcion.length >= 140 ? 'text-energy-orange' : 'text-gray-300'}`}>
									{form.descripcion.length}/150
								</div>
							</div>
						</div>

						{/* ── Precio y Aforo ── */}
						<div className="flex gap-3">
							<NumberInput label="Precio (€)" value={form.precio} onChange={(v) => updateField('precio', v)} min={0} step={1} allowDecimals error={errors.precio} />
							<NumberInput label="Aforo" value={form.aforo} onChange={(v) => updateField('aforo', v)} min={1} max={50} error={errors.aforo} />
						</div>

						{/* ── Calendario ── */}
						<div>
							<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Fecha y Turnos <span className="text-red-400">*</span></label>

							{/* Navegación mes */}
							<div className="flex justify-between items-center mb-2">
								<button type="button" onClick={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth() - 1); setCurrentMonth(d); }}
									className="p-1 hover:bg-green-50 rounded-lg text-neverland-green transition-colors"><ChevronLeft size={18} /></button>
								<span className="font-display font-bold capitalize text-neverland-green text-xs">
									{currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
								</span>
								<button type="button" onClick={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth() + 1); setCurrentMonth(d); }}
									className="p-1 hover:bg-green-50 rounded-lg text-neverland-green transition-colors"><ChevronRight size={18} /></button>
							</div>

							{/* Cabecera días */}
							<div className="grid grid-cols-7 mb-1">
								{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
									<span key={d} className="text-[9px] font-bold text-center text-gray-400">{d}</span>
								))}
							</div>

							{/* Grid */}
							<div className="relative">
								{availabilityLoading && (
									<div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
										<div className="w-6 h-6 border-3 border-neverland-green/20 border-t-neverland-green rounded-full animate-spin" />
									</div>
								)}
								<div className="grid grid-cols-7 gap-1">
									{renderCalendar().flat().map((cell, i) => {
										if (!cell) return <div key={i} />;
										const { date, dateStr, dayNum } = cell;
										const today = new Date(); today.setHours(0, 0, 0, 0);
										const isPast = date < today;
										const isSelected = form.fecha === dateStr;
										const occupied = getOccupiedForDate(date);
										return (
											<button key={i} type="button" disabled={isPast}
												onClick={() => handleDateSelect(dateStr, date)}
												className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all border text-xs ${
													isSelected
														? 'bg-neverland-green text-white border-neverland-green scale-105'
														: isPast
															? 'text-gray-300 cursor-not-allowed'
															: 'bg-white text-gray-700 border-gray-100 hover:border-green-200 cursor-pointer'
												}`}>
												<span className={`text-xs ${isSelected ? 'font-black' : 'font-bold'}`}>{dayNum}</span>
												{!isPast && !isSelected && (
													<div className="flex gap-[1px] mt-px">
														{SHIFT_ORDER.map((t) => {
															const tipo = occupied[t]?.tipo;
															let bg = 'bg-green-100';
															if (tipo === 'bloqueo') bg = 'bg-blue-300';
															else if (tipo === 'taller') bg = 'bg-purple-300';
															else if (tipo === 'reserva') bg = 'bg-red-200';
															return <div key={t} className={`h-1 w-2 rounded-full ${bg}`} />;
														})}
													</div>
												)}
											</button>
										);
									})}
								</div>
							</div>

							{/* Leyenda */}
							<div className="flex flex-wrap items-center gap-3 mt-2 text-[8px] font-bold text-gray-400">
								<span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-green-100 inline-block" /> Libre</span>
								<span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-300 inline-block" /> Bloqueo</span>
								<span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-200 inline-block" /> Reserva</span>
								<span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-purple-300 inline-block" /> Taller</span>
							</div>
							{errors.fecha && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.fecha}</p>}
						</div>

						{/* ── Selector de turnos ── */}
						{form.fecha && (
							<div className="space-y-1.5">
								<p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
									Turnos <span className="text-red-400">*</span>
									<span className="ml-2 text-neverland-green font-sans normal-case tracking-normal font-bold">
										— {safeParseDate(form.fecha)?.toLocaleDateString?.('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) || form.fecha}
									</span>
								</p>
								{SHIFT_ORDER.map((turnId) => {
									const shift = SHIFTS[turnId];
									const occupied = getOccupiedForDate(selectedDateObj || (form.fecha ? safeParseDate(form.fecha) : new Date()));
									const entry = occupied[turnId];
									const tipo = entry?.tipo;
									const esReserva = tipo === 'reserva';
									const esBloqueo = tipo === 'bloqueo';
									const esTaller = tipo === 'taller';
									const isSelected = form.turnos.includes(turnId);
									const seleccionable = !esReserva;

									return (
										<button key={turnId} type="button" disabled={!seleccionable}
											onClick={() => handleTurnoToggle(turnId)}
											className={`w-full p-3 rounded-xl border-2 flex items-center justify-between transition-all ${
												isSelected
													? 'border-neverland-green bg-neverland-green text-white'
													: esReserva
														? 'bg-red-50/30 border-red-100 cursor-not-allowed opacity-60'
														: esBloqueo
															? 'bg-blue-50/50 border-blue-200 hover:border-green-300 cursor-pointer'
															: esTaller
																? 'bg-purple-50/50 border-purple-200'
																: 'bg-white border-gray-100 hover:border-green-200 cursor-pointer'
											}`}>
											<div className="text-left">
												<p className={`text-[10px] font-bold uppercase ${isSelected ? 'opacity-80' : esReserva ? 'text-red-400' : 'text-gray-500'}`}>{shift.label}</p>
												<p className={`text-sm font-black ${isSelected ? '' : esReserva ? 'text-red-400' : ''}`}>{shift.time}</p>
											</div>
										<div className="flex items-center gap-2">
											{esReserva && <span className="text-[9px] font-bold text-red-500 bg-red-100 px-2 py-1 rounded-lg flex items-center gap-1"><Lock size={10} /> OCUPADO</span>}
											{esBloqueo && (
												<div className="flex flex-col items-end gap-0.5">
													<span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg">BLOQUEO</span>
													{entry.motivo && <span className="text-[8px] text-blue-500 italic max-w-[140px] truncate">{entry.motivo}</span>}
												</div>
											)}
											{esTaller && (
												<div className="flex flex-col items-end gap-0.5">
													<span className="text-[9px] font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-lg flex items-center gap-1"><AlertCircle size={10} /> TALLER</span>
													{entry.nombre && <span className="text-[8px] text-purple-500 max-w-[140px] truncate">{entry.nombre}</span>}
												</div>
											)}
											{!tipo && isSelected && <CheckCircle size={16} />}
											{!tipo && !isSelected && <span className="text-[9px] font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">DISPONIBLE</span>}
										</div>
										</button>
									);
								})}
								{errors.turnos && <p className="text-[10px] text-red-500 font-medium">{errors.turnos}</p>}
							</div>
						)}

						{/* ── Horario (misma línea) ── */}
						<div className="flex gap-3">
							<div className="flex-1">
								<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Inicio <span className="text-red-400">*</span></label>
								<input type="time" value={form.horario.inicio}
									onChange={(e) => setForm((prev) => ({ ...prev, horario: { ...prev.horario, inicio: e.target.value } }))}
									className={`w-full bg-white p-3 rounded-xl text-sm font-bold border outline-none transition-all min-text-[16px] ${errors.horarioInicio ? 'border-red-200' : 'border-gray-200 focus:border-neverland-green'}`} />
							</div>
							<div className="flex-1">
								<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Fin <span className="text-red-400">*</span></label>
								<input type="time" value={form.horario.fin}
									onChange={(e) => setForm((prev) => ({ ...prev, horario: { ...prev.horario, fin: e.target.value } }))}
									className={`w-full bg-white p-3 rounded-xl text-sm font-bold border outline-none transition-all min-text-[16px] ${errors.horarioFin ? 'border-red-200' : 'border-gray-200 focus:border-neverland-green'}`} />
                                {errors.horarioFin && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.horarioFin}</p>}
							</div>
						</div>

						{/* ── Portada + Galería (mismo bloque) ── */}
						<div>
							<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Imágenes</label>
							<div className="flex gap-3">
								{/* Portada 3:4 vertical */}
								<div className="w-36 shrink-0">
									{form.portada ? (
										<div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-[3/4]">
											<img src={form.portada} alt="Portada" className="w-full h-full object-cover" />
											<div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
											<div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-white/80 backdrop-blur-sm rounded text-[7px] font-black uppercase text-gray-500">Portada</div>
											<div className="absolute bottom-1.5 left-1.5 right-1.5 flex gap-1">
												<label className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-lg transition-all cursor-pointer border border-white/30 text-[7px] font-black uppercase">
													<input type="file" className="hidden" accept="image/*" onChange={handlePortadaUpload} disabled={uploadingPortada} />
													<Upload size={10} /> Cambiar
												</label>
												<button type="button" onClick={() => updateField('portada', '')}
													className="p-1 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-lg transition-all"><Trash2 size={10} /></button>
											</div>
											{uploadingPortada && <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center"><Loader2 className="animate-spin text-neverland-green" size={16} /></div>}
										</div>
									) : (
										<label className="flex flex-col items-center justify-center aspect-[3/4] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-neverland-green/30 hover:bg-neverland-green/5 transition-all group">
											<input type="file" className="hidden" accept="image/*" onChange={handlePortadaUpload} disabled={uploadingPortada} />
											{uploadingPortada ? (
												<><Loader2 className="animate-spin text-neverland-green mb-1" size={16} /><p className="text-[8px] font-black text-neverland-green">Subiendo...</p></>
											) : (
												<><ImageIcon size={16} className="text-gray-300 group-hover:text-neverland-green mb-1" /><p className="text-[8px] font-black text-gray-400 text-center px-2">Portada 3:4</p></>
											)}
										</label>
									)}
								</div>

								{/* Galería — grid sin restricción de altura, scroll en wrapper */}
								<div className="flex-1 min-w-0">
									<div className="h-[192px] overflow-y-auto pr-1">
										<div className="grid grid-cols-2 gap-2">
											<label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-neverland-green/30 transition-all">
												<input type="file" className="hidden" accept="image/*" multiple onChange={handleGaleriaUpload} disabled={uploadingGaleria} />
												{uploadingGaleria ? <Loader2 className="animate-spin text-neverland-green" size={16} /> : <><Plus size={16} className="text-gray-300" /><span className="text-[7px] font-black text-gray-300">Añadir</span></>}
											</label>
											{form.galeria.map((url, idx) => (
												<div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
													<img src={url} alt="" className="w-full h-full object-cover" />
													<button type="button" onClick={() => handleDeleteGaleriaImage(url)}
														className="absolute top-1 right-1 p-1 bg-black/30 hover:bg-red-500 text-white rounded-full transition-all"><X size={10} /></button>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* ── Submit ── */}
						<div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
							<button type="button" onClick={() => navigate('/admin/talleres')}
								className="px-4 py-2 text-gray-400 hover:text-gray-600 font-black text-[9px] uppercase tracking-wider transition-colors">Cancelar</button>
							<button type="submit" disabled={saving}
								className="flex items-center gap-2 px-5 py-2.5 bg-neverland-green text-white rounded-xl font-black text-[9px] uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
								{saving ? <><Loader2 size={14} className="animate-spin" />Guardando...</> : <><Save size={14} />{isEditing ? 'Guardar' : 'Crear'}</>}
							</button>
						</div>
					</motion.form>
				</div>
			</div>
		</div>
	);
};

export default TallerForm;