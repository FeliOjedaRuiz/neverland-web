import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
	Plus,
	Loader2,
	Calendar,
	Clock,
	Users,
	Eye,
	EyeOff,
	Palette,
	ChevronRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getTalleres, updateTaller } from '../../services/api';
import { safeParseDate, formatLongSafeDate } from '../../utils/safeDate';

const ToggleSwitch = ({ active, onChange, disabled }) => {
	return (
		<button
			onClick={onChange}
			disabled={disabled}
			type="button"
			className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
				disabled ? 'opacity-50 cursor-not-allowed' : ''
			} ${active ? 'bg-neverland-green' : 'bg-gray-200'}`}
		>
			<span
				className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
					active ? 'translate-x-4' : 'translate-x-0'
				}`}
			/>
		</button>
	);
};

const TalleresList = () => {
	const navigate = useNavigate();
	const [talleres, setTalleres] = useState([]);
	const [loading, setLoading] = useState(true);
	const [togglingIds, setTogglingIds] = useState(new Set());

	const fetchTalleres = useCallback(async () => {
		setLoading(true);
		try {
			const res = await getTalleres();
			setTalleres(res.data || []);
		} catch (err) {
			console.error('Error fetching talleres:', err);
			toast.error('Error al cargar talleres');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchTalleres();
	}, [fetchTalleres]);

	const handleToggleVisibilidad = async (taller) => {
		const id = taller.id || taller._id;
		setTogglingIds((prev) => new Set(prev).add(id));
		try {
			const nuevoEstado = !taller.publico;
			await updateTaller(id, { publico: nuevoEstado });
			setTalleres((prev) =>
				prev.map((t) => {
					const tId = t.id || t._id;
					return tId === id ? { ...t, publico: nuevoEstado } : t;
				}),
			);
			toast.success(
				nuevoEstado
					? 'Taller visible en la web'
					: 'Taller oculto de la web',
			);
		} catch (err) {
			console.error('Error updating visibility:', err);
			toast.error('Error al cambiar visibilidad');
		} finally {
			setTogglingIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
		}
	};

	const isPasado = (taller) => {
		if (!taller.fecha) return false;
		const fecha = safeParseDate(taller.fecha);
		if (!fecha) return false;
		const hoy = new Date();
		hoy.setHours(23, 59, 59, 999);
		return fecha < hoy;
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-full py-20 text-gray-300 gap-4">
				<Loader2 className="animate-spin text-neverland-green/40" size={48} />
				<p className="font-display font-black uppercase tracking-widest text-[10px]">
					Cargando talleres...
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full animate-in fade-in duration-300">
			<div className="flex-1 overflow-y-auto pb-8">
				<div className="p-6 space-y-4 max-w-5xl mx-auto">
					{/* Header */}
					<div className="flex items-center justify-between mb-2">
						<div>
							<h2 className="text-2xl font-display font-black text-text-black">
								Talleres
							</h2>
							<p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
								{talleres.length} taller{talleres.length !== 1 ? 'es' : ''}{' '}
								registrado{talleres.length !== 1 ? 's' : ''}
							</p>
						</div>
						<button
							onClick={() => navigate('/admin/talleres/nuevo')}
							className="flex items-center gap-2 px-5 py-2.5 bg-neverland-green text-white rounded-2xl font-display font-black text-[10px] uppercase tracking-wider shadow-lg shadow-neverland-green/20 hover:scale-105 active:scale-95 transition-all"
						>
							<Plus size={16} />
							Nuevo Taller
						</button>
					</div>

					{/* Lista vacía */}
					{talleres.length === 0 && (
						<div className="text-center py-20 bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
							<div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
								<Palette size={28} className="text-gray-300" />
							</div>
							<p className="font-display font-bold text-gray-400 mb-1">
								No hay talleres aún
							</p>
							<p className="text-[10px] text-gray-300 font-medium mb-4">
								Crea tu primer taller para empezar
							</p>
							<button
								onClick={() => navigate('/admin/talleres/nuevo')}
								className="inline-flex items-center gap-2 px-5 py-2.5 bg-neverland-green text-white rounded-2xl font-display font-black text-[10px] uppercase tracking-wider shadow-lg shadow-neverland-green/20 hover:scale-105 active:scale-95 transition-all"
							>
								<Plus size={16} />
								Crear Taller
							</button>
						</div>
					)}

					{/* Grid de talleres */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{talleres.map((taller, idx) => {
							const id = taller.id || taller._id;
							const pasado = isPasado(taller);
							const fecha = safeParseDate(taller.fecha);
							const fechaFormateada = fecha
								? formatLongSafeDate(taller.fecha)
								: '';

							return (
								<motion.div
									key={id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: idx * 0.03 }}
									className={`group bg-white rounded-3xl border border-gray-100 overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5 cursor-pointer ${
										pasado ? 'opacity-60 hover:opacity-80' : ''
									}`}
									onClick={() => navigate(`/admin/talleres/${id}`)}
								>
									<div className="p-5">
										{/* Header de la card */}
										<div className="flex items-start justify-between mb-3">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<h3 className="font-display font-black text-base text-text-black truncate group-hover:text-neverland-green transition-colors">
														{taller.nombre}
													</h3>
													{pasado && (
														<span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full text-[7px] font-black uppercase tracking-wider whitespace-nowrap shrink-0">
															Pasado
														</span>
													)}
												</div>
												<p className="text-[10px] text-gray-400 font-medium">
													{fechaFormateada}
												</p>
											</div>
											<ChevronRight
												size={16}
												className="text-gray-200 group-hover:text-neverland-green/40 group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
											/>
										</div>

										{/* Info row */}
										<div className="flex flex-wrap gap-3 mb-3 text-[10px] font-medium text-gray-500">
											{taller.horario?.inicio && (
												<div className="flex items-center gap-1">
													<Clock size={12} className="text-gray-300" />
													<span>
														{taller.horario.inicio} - {taller.horario.fin}
													</span>
												</div>
											)}
											<div className="flex items-center gap-1">
												<Users size={12} className="text-gray-300" />
												<span>
													{(taller.numInscripciones || taller.inscripciones?.length || 0)}/
													{taller.aforo}
												</span>
											</div>
										</div>

										{/* Turnos badges */}
										{taller.turnos && taller.turnos.length > 0 && (
											<div className="flex gap-1.5 mb-3">
												{taller.turnos.map((t) => (
													<span
														key={t}
														className="px-2 py-0.5 bg-gray-50 text-gray-400 rounded-md text-[7px] font-black uppercase tracking-wider border border-gray-100"
													>
														{t}
													</span>
												))}
											</div>
										)}

										{/* Visibilidad toggle */}
										<div className="flex items-center justify-between pt-3 border-t border-gray-50">
											<div className="flex items-center gap-2">
												{taller.publico ? (
													<Eye size={12} className="text-neverland-green" />
												) : (
													<EyeOff size={12} className="text-gray-300" />
												)}
												<span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
													{taller.publico ? 'Público' : 'Oculto'}
												</span>
											</div>
											<div
												onClick={(e) => e.stopPropagation()}
												onKeyDown={(e) => {
													if (e.key === 'Enter' || e.key === ' ') {
														e.preventDefault();
														e.stopPropagation();
													}
												}}
											>
												<ToggleSwitch
													active={taller.publico}
													disabled={togglingIds.has(id)}
													onChange={() => handleToggleVisibilidad(taller)}
												/>
											</div>
										</div>
									</div>
								</motion.div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};

export default TalleresList;
