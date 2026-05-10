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
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
	getTallerById,
	createTaller,
	updateTaller,
	uploadTallerImage,
} from '../../services/api';
import { safeParseDate } from '../../utils/safeDate';

const TURNS = [
	{ value: 'T1', label: 'Turno 1 (10:00 - 12:00)' },
	{ value: 'T2', label: 'Turno 2 (12:30 - 14:30)' },
	{ value: 'T3', label: 'Turno 3 (17:00 - 19:00)' },
];

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

	// Cargar taller existente si es edición
	useEffect(() => {
		if (!isEditing) return;
		const fetchTaller = async () => {
			setLoading(true);
			try {
				const res = await getTallerById(id);
				const t = res.data;
				const fechaStr = t.fecha ? safeParseDate(t.fecha) : null;
				const fechaLocal =
					fechaStr && !isNaN(fechaStr.getTime())
						? fechaStr.toISOString().split('T')[0]
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

	const updateField = (field, value) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => ({ ...prev, [field]: null }));
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
		if (!file.type.startsWith('image/')) {
			toast.error('El archivo debe ser una imagen');
			return;
		}
		if (file.size > 20 * 1024 * 1024) {
			toast.error('La imagen es demasiado grande (máx 20MB)');
			return;
		}

		setUploadingPortada(true);
		try {
			const res = await uploadTallerImage(file);
			const imageUrl = res.data.imageUrl;
			if (imageUrl) {
				updateField('portada', imageUrl);
				toast.success('Portada subida correctamente');
			}
		} catch (err) {
			console.error('Error uploading portada:', err);
			toast.error('Error al subir la portada');
		} finally {
			setUploadingPortada(false);
			// Reset input
			e.target.value = '';
		}
	};

	const handleGaleriaUpload = async (e) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		setUploadingGaleria(true);
		let uploadedCount = 0;
		try {
			for (const file of files) {
				if (!file.type.startsWith('image/')) continue;
				if (file.size > 20 * 1024 * 1024) continue;

				const res = await uploadTallerImage(file);
				const imageUrl = res.data.imageUrl;
				if (imageUrl) {
					setForm((prev) => ({
						...prev,
						galeria: [...prev.galeria, imageUrl],
					}));
					uploadedCount++;
				}
			}
			if (uploadedCount > 0) {
				toast.success(`${uploadedCount} imagen(es) subida(s) a la galería`);
			}
		} catch (err) {
			console.error('Error uploading galeria:', err);
			toast.error('Error al subir imágenes');
		} finally {
			setUploadingGaleria(false);
			e.target.value = '';
		}
	};

	const removeGaleriaImage = (index) => {
		setForm((prev) => ({
			...prev,
			galeria: prev.galeria.filter((_, i) => i !== index),
		}));
	};

	const validate = () => {
		const newErrors = {};

		if (!form.nombre.trim()) {
			newErrors.nombre = 'El nombre es obligatorio';
		}

		if (!form.fecha) {
			newErrors.fecha = 'La fecha es obligatoria';
		} else {
			const fecha = safeParseDate(form.fecha);
			if (fecha && !isEditing) {
				const hoy = new Date();
				hoy.setHours(0, 0, 0, 0);
				if (fecha < hoy) {
					newErrors.fecha = 'La fecha no puede ser pasada';
				}
			}
		}

		if (!form.horario.inicio) {
			newErrors.horarioInicio = 'La hora de inicio es obligatoria';
		}
		if (!form.horario.fin) {
			newErrors.horarioFin = 'La hora de fin es obligatoria';
		}
		if (
			form.horario.inicio &&
			form.horario.fin &&
			form.horario.inicio >= form.horario.fin
		) {
			newErrors.horarioFin = 'La hora de fin debe ser posterior a la de inicio';
		}

		if (form.turnos.length === 0) {
			newErrors.turnos = 'Selecciona al menos un turno';
		}

		if (!form.precio || form.precio <= 0) {
			newErrors.precio = 'El precio debe ser mayor que 0';
		}

		if (!form.aforo || form.aforo < 1) {
			newErrors.aforo = 'El aforo mínimo es 1';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validate()) {
			try {
				window.scrollTo({ top: 0, behavior: 'smooth' });
			} catch (_) {
				window.scrollTo(0, 0);
			}
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

			let res;
			if (isEditing) {
				res = await updateTaller(id, payload);
				toast.success('Taller actualizado correctamente');
			} else {
				res = await createTaller(payload);
				toast.success('Taller creado correctamente');
			}

			const savedId = res.data?.id || res.data?._id || id;
			navigate(`/admin/talleres/${savedId}`);
		} catch (err) {
			console.error('Error saving taller:', err);
			const msg =
				err.response?.data?.error ||
				err.response?.data?.message ||
				'Error al guardar el taller';
			toast.error(msg);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-full py-20 text-gray-300 gap-4">
				<Loader2 className="animate-spin text-neverland-green/40" size={48} />
				<p className="font-display font-black uppercase tracking-widest text-[10px]">
					Cargando taller...
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full animate-in fade-in duration-300">
			<div className="flex-1 overflow-y-auto pb-8">
				<div className="p-6 max-w-3xl mx-auto">
					{/* Back button */}
					<button
						onClick={() => navigate('/admin/talleres')}
						className="flex items-center gap-2 text-gray-400 hover:text-neverland-green transition-colors font-display font-bold text-[10px] uppercase tracking-wider mb-4"
					>
						<ArrowLeft size={14} />
						Volver a talleres
					</button>

					<motion.form
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						onSubmit={handleSubmit}
						className="bg-white rounded-[40px] p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6"
					>
						{/* Header */}
						<div className="flex items-center justify-between mb-2">
							<h2 className="text-2xl font-display font-black text-text-black">
								{isEditing ? 'Editar Taller' : 'Nuevo Taller'}
							</h2>
						</div>

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
									errors.nombre
										? 'border-red-200 bg-red-50/30'
										: 'border-transparent focus:bg-white focus:border-neverland-green/20'
								}`}
							/>
							{errors.nombre && (
								<p className="text-[10px] text-red-500 font-medium mt-1 ml-1">
									{errors.nombre}
								</p>
							)}
						</div>

						{/* Descripción */}
						<div>
							<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
								Descripción
							</label>
							<div className="relative">
								<textarea
									value={form.descripcion}
									onChange={(e) => {
										if (e.target.value.length <= 150) {
											updateField('descripcion', e.target.value);
										}
									}}
									placeholder="Describe el taller (máx 150 caracteres)..."
									rows={3}
									className="w-full bg-gray-50/50 p-4 rounded-2xl text-sm font-medium text-gray-600 border border-transparent focus:bg-white focus:border-neverland-green/20 outline-none resize-none transition-all leading-relaxed min-text-[16px]"
								/>
								<div
									className={`absolute bottom-3 right-3 text-[8px] font-black ${
										form.descripcion.length >= 140
											? 'text-energy-orange'
											: 'text-gray-200'
									}`}
								>
									{form.descripcion.length}/150
								</div>
							</div>
						</div>

						{/* Precio y Aforo */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
									Precio (€) <span className="text-red-400">*</span>
								</label>
								<input
									type="number"
									min="0"
									step="0.5"
									value={form.precio}
									onChange={(e) =>
										updateField('precio', parseFloat(e.target.value) || 0)
									}
									className={`w-full bg-gray-50/50 p-4 rounded-2xl text-sm font-bold text-text-black border outline-none transition-all min-text-[16px] ${
										errors.precio
											? 'border-red-200 bg-red-50/30'
											: 'border-transparent focus:bg-white focus:border-neverland-green/20'
									}`}
								/>
								{errors.precio && (
									<p className="text-[10px] text-red-500 font-medium mt-1 ml-1">
										{errors.precio}
									</p>
								)}
							</div>
							<div>
								<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
									Aforo <span className="text-red-400">*</span>
								</label>
								<input
									type="number"
									min="1"
									value={form.aforo}
									onChange={(e) =>
										updateField('aforo', parseInt(e.target.value) || 1)
									}
									className={`w-full bg-gray-50/50 p-4 rounded-2xl text-sm font-bold text-text-black border outline-none transition-all min-text-[16px] ${
										errors.aforo
											? 'border-red-200 bg-red-50/30'
											: 'border-transparent focus:bg-white focus:border-neverland-green/20'
									}`}
								/>
								{errors.aforo && (
									<p className="text-[10px] text-red-500 font-medium mt-1 ml-1">
										{errors.aforo}
									</p>
								)}
							</div>
						</div>

						{/* Fecha */}
						<div>
							<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
								Fecha <span className="text-red-400">*</span>
							</label>
							<input
								type="date"
								value={form.fecha}
								onChange={(e) => updateField('fecha', e.target.value)}
								className={`w-full bg-gray-50/50 p-4 rounded-2xl text-sm font-bold text-text-black border outline-none transition-all min-text-[16px] ${
									errors.fecha
										? 'border-red-200 bg-red-50/30'
										: 'border-transparent focus:bg-white focus:border-neverland-green/20'
								}`}
							/>
							{errors.fecha && (
								<p className="text-[10px] text-red-500 font-medium mt-1 ml-1">
									{errors.fecha}
								</p>
							)}
						</div>

						{/* Horario */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
									Hora inicio <span className="text-red-400">*</span>
								</label>
								<input
									type="time"
									value={form.horario.inicio}
									onChange={(e) =>
										setForm((prev) => ({
											...prev,
											horario: { ...prev.horario, inicio: e.target.value },
										}))
									}
									className="w-full bg-gray-50/50 p-4 rounded-2xl text-sm font-bold text-text-black border border-transparent focus:bg-white focus:border-neverland-green/20 outline-none transition-all min-text-[16px]"
								/>
							</div>
							<div>
								<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
									Hora fin <span className="text-red-400">*</span>
								</label>
								<input
									type="time"
									value={form.horario.fin}
									onChange={(e) =>
										setForm((prev) => ({
											...prev,
											horario: { ...prev.horario, fin: e.target.value },
										}))
									}
									className={`w-full bg-gray-50/50 p-4 rounded-2xl text-sm font-bold text-text-black border outline-none transition-all min-text-[16px] ${
										errors.horarioFin
											? 'border-red-200 bg-red-50/30'
											: 'border-transparent focus:bg-white focus:border-neverland-green/20'
									}`}
								/>
								{errors.horarioFin && (
									<p className="text-[10px] text-red-500 font-medium mt-1 ml-1">
										{errors.horarioFin}
									</p>
								)}
							</div>
						</div>

						{/* Turnos */}
						<div>
							<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">
								Turnos <span className="text-red-400">*</span>
							</label>
							<div className="flex flex-wrap gap-2">
								{TURNS.map((turno) => {
									const selected = form.turnos.includes(turno.value);
									return (
										<button
											key={turno.value}
											type="button"
											onClick={() => handleTurnoToggle(turno.value)}
											className={`px-4 py-2.5 rounded-2xl font-display font-black text-[10px] uppercase tracking-wider border-2 transition-all ${
												selected
													? 'bg-neverland-green text-white border-neverland-green shadow-md shadow-neverland-green/20'
													: 'bg-gray-50 text-gray-400 border-gray-100 hover:border-neverland-green/30 hover:text-neverland-green'
											}`}
										>
											{turno.label}
										</button>
									);
								})}
							</div>
							{errors.turnos && (
								<p className="text-[10px] text-red-500 font-medium mt-1 ml-1">
									{errors.turnos}
								</p>
							)}
						</div>

						{/* Portada */}
						<div>
							<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">
								Imagen de portada
							</label>
							<div className="relative">
								{form.portada ? (
									<div className="relative rounded-2xl overflow-hidden bg-gray-100 h-48 sm:h-56">
										<img
											src={form.portada}
											alt="Portada"
											className="w-full h-full object-cover"
										/>
										<div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
										<div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
											<label className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-xl transition-all cursor-pointer border border-white/30">
												<input
													type="file"
													className="hidden"
													accept="image/*"
													onChange={handlePortadaUpload}
													disabled={uploadingPortada}
												/>
												<Upload size={14} />
												<span className="font-display font-black text-[9px] uppercase tracking-wider">
													Cambiar
												</span>
											</label>
											<button
												type="button"
												onClick={() => updateField('portada', '')}
												className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-xl transition-all"
											>
												<Trash2 size={14} />
											</button>
										</div>
										{uploadingPortada && (
											<div className="absolute inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center">
												<Loader2
													className="animate-spin text-neverland-green"
													size={28}
												/>
											</div>
										)}
									</div>
								) : (
									<label className="flex flex-col items-center justify-center h-48 sm:h-56 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-neverland-green/30 hover:bg-neverland-green/5 transition-all group">
										<input
											type="file"
											className="hidden"
											accept="image/*"
											onChange={handlePortadaUpload}
											disabled={uploadingPortada}
										/>
										{uploadingPortada ? (
											<>
												<Loader2
													className="animate-spin text-neverland-green mb-2"
													size={28}
												/>
												<p className="text-[10px] font-black text-neverland-green uppercase tracking-widest">
													Subiendo...
												</p>
											</>
										) : (
											<>
												<div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-300 mb-2 shadow-sm group-hover:scale-110 transition-transform">
													<ImageIcon size={22} />
												</div>
												<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
													Añadir portada
												</p>
												<p className="text-[8px] text-gray-300 font-medium mt-1">
													Recomendado: 1200×800px
												</p>
											</>
										)}
									</label>
								)}
							</div>
						</div>

						{/* Galería */}
						<div>
							<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">
								Galería de imágenes
							</label>
							<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-3">
								{form.galeria.map((url, idx) => (
									<div
										key={idx}
										className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100"
									>
										<img
											src={url}
											alt={`Galería ${idx + 1}`}
											className="w-full h-full object-cover"
										/>
										<button
											type="button"
											onClick={() => removeGaleriaImage(idx)}
											className="absolute top-1 right-1 p-1 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-500"
										>
											<X size={10} />
										</button>
									</div>
								))}

								{/* Botón añadir más */}
								<label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-neverland-green/30 hover:bg-neverland-green/5 transition-all group">
									<input
										type="file"
										className="hidden"
										accept="image/*"
										multiple
										onChange={handleGaleriaUpload}
										disabled={uploadingGaleria}
									/>
									{uploadingGaleria ? (
										<Loader2
											className="animate-spin text-neverland-green"
											size={20}
										/>
									) : (
										<>
											<Plus size={18} className="text-gray-300 group-hover:text-neverland-green transition-colors" />
											<span className="text-[7px] font-black text-gray-300 uppercase tracking-wider mt-1">
												Añadir
											</span>
										</>
									)}
								</label>
							</div>
						</div>

						{/* Submit */}
						<div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50">
							<button
								type="button"
								onClick={() => navigate('/admin/talleres')}
								className="px-6 py-2.5 text-gray-400 hover:text-gray-600 font-display font-black text-[10px] uppercase tracking-wider transition-colors"
							>
								Cancelar
							</button>
							<button
								type="submit"
								disabled={saving}
								className="flex items-center gap-2 px-6 py-2.5 bg-neverland-green text-white rounded-2xl font-display font-black text-[10px] uppercase tracking-wider shadow-lg shadow-neverland-green/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{saving ? (
									<>
										<Loader2 size={14} className="animate-spin" />
										{isEditing ? 'Guardando...' : 'Creando...'}
									</>
								) : (
									<>
										<Save size={14} />
										{isEditing ? 'Guardar Cambios' : 'Crear Taller'}
									</>
								)}
							</button>
						</div>
					</motion.form>
				</div>
			</div>
		</div>
	);
};

export default TallerForm;
