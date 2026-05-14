import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
	Plus,
	Loader2,
	Clock,
	Users,
	Eye,
	EyeOff,
	Palette,
	ChevronRight,
	Trash2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getTalleres, updateTaller, deleteTaller } from '../../services/api';
import { safeParseDate } from '../../utils/safeDate';
import ConfirmModal from './ConfirmModal';

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
	const [tab, setTab] = useState('proximos');
	const [deletingTaller, setDeletingTaller] = useState(null);
	const [deleting, setDeleting] = useState(false);

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

	const handleDeleteClick = (e, taller) => {
		e.stopPropagation();
		setDeletingTaller(taller);
	};

	const handleDeleteConfirm = async () => {
		if (!deletingTaller) return;
		const id = deletingTaller.id || deletingTaller._id;
		setDeleting(true);
		try {
			await deleteTaller(id);
			toast.success(`"${deletingTaller.nombre}" eliminado`);
			setTalleres((prev) => prev.filter((t) => (t.id || t._id) !== id));
			setDeletingTaller(null);
		} catch (err) {
			toast.error('Error al eliminar el taller');
		} finally {
			setDeleting(false);
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

	const proximos = talleres
		.filter((t) => !isPasado(t))
		.sort((a, b) => (safeParseDate(a.fecha)?.getTime() || 0) - (safeParseDate(b.fecha)?.getTime() || 0));
	const pasados = talleres
		.filter((t) => isPasado(t))
		.sort((a, b) => (safeParseDate(b.fecha)?.getTime() || 0) - (safeParseDate(a.fecha)?.getTime() || 0));
	const displayList = tab === 'proximos' ? proximos : pasados;

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
					<div className="flex items-center justify-between mb-1">
						<h2 className="text-2xl font-display font-black text-text-black">
							Talleres
						</h2>
						<button
							onClick={() => navigate('/admin/talleres/nuevo')}
							className="flex items-center gap-2 px-5 py-2.5 bg-neverland-green text-white rounded-2xl font-display font-black text-[10px] uppercase tracking-wider shadow-lg shadow-neverland-green/20 hover:scale-105 active:scale-95 transition-all"
						>
							<Plus size={16} />
							Nuevo Taller
						</button>
					</div>

					{/* Tabs */}
					{talleres.length > 0 && (
						<div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full">
							<button onClick={() => setTab('proximos')}
								className={`flex-1 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
									tab === 'proximos'
										? 'bg-white text-neverland-green shadow-sm'
										: 'text-gray-400 hover:text-gray-600'
								}`}>
								Próximos{' '}<span className="text-[9px] font-bold opacity-60">({proximos.length})</span>
							</button>
							<button onClick={() => setTab('pasados')}
								className={`flex-1 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
									tab === 'pasados'
										? 'bg-white text-gray-700 shadow-sm'
										: 'text-gray-400 hover:text-gray-600'
								}`}>
								Pasados{' '}<span className="text-[9px] font-bold opacity-60">({pasados.length})</span>
							</button>
						</div>
					)}

					{/* Lista vacía (sin talleres en absoluto) */}
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

					{/* Tab vacía — próximos */}
					{talleres.length > 0 && displayList.length === 0 && tab === 'proximos' && (
						<div className="text-center py-16 bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
							<div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
								<Palette size={22} className="text-gray-300" />
							</div>
							<p className="font-display font-bold text-gray-400 mb-1">No hay próximos talleres</p>
							<button onClick={() => navigate('/admin/talleres/nuevo')}
								className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-neverland-green text-white rounded-xl font-black text-[9px] uppercase tracking-wider hover:scale-105 transition-all">
								<Plus size={14} /> Crear Taller
							</button>
						</div>
					)}

					{/* Tab vacía — pasados */}
					{talleres.length > 0 && displayList.length === 0 && tab === 'pasados' && (
						<div className="text-center py-16 bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
							<div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
								<Palette size={22} className="text-gray-300" />
							</div>
							<p className="font-display font-bold text-gray-400 mb-1">No hay talleres pasados</p>
							<p className="text-[10px] text-gray-300 font-medium">Los talleres que pasen de fecha aparecerán aquí</p>
						</div>
					)}

					{/* Grid de talleres */}
					{displayList.length > 0 && (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{displayList.map((taller, idx) => {
								const id = taller.id || taller._id;
								const date = safeParseDate(taller.fecha);
								const fechaFormateada = date
									? `${date.toLocaleDateString('es-ES', { weekday: 'long' }).replace(/^\w/, (c) => c.toUpperCase())}, ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`
									: '';
								const inscripciones = taller.numInscripciones || taller.inscripciones?.length || 0;

								return (
									<motion.div
										key={id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: idx * 0.03 }}
										className="group bg-white rounded-3xl border border-gray-100 overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5 cursor-pointer flex"
										onClick={() => navigate(`/admin/talleres/${id}`)}
									>
										{/* ── Portada (izquierda) ── */}
										<div className="w-24 sm:w-28 shrink-0 relative overflow-hidden bg-gray-50">
											{taller.portada ? (
												<img src={taller.portada} alt={taller.nombre}
													className="w-full h-full object-cover aspect-[3/4] group-hover:scale-105 transition-transform duration-500" />
											) : (
												<div className="w-full h-full aspect-[3/4] flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-gray-50 to-gray-100">
													<Palette size={22} className="text-gray-200" />
													<span className="text-[7px] font-black text-gray-300 uppercase tracking-wider">Sin foto</span>
												</div>
											)}
											<div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
										</div>

										{/* ── Contenido (derecha) ── */}
										<div className="flex-1 min-w-0 p-3.5 sm:p-4 flex flex-col justify-between">
											<div>
												{/* Row 1: Nombre */}
												<div className="flex items-start justify-between gap-2">
													<h3 className="font-display font-black text-sm sm:text-base text-text-black truncate group-hover:text-neverland-green transition-colors">
														{taller.nombre}
													</h3>
													<ChevronRight size={16}
														className="text-gray-200 group-hover:text-neverland-green/40 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
												</div>

												{/* Row 2: Fecha */}
												{fechaFormateada && (
													<p className="text-[10px] text-gray-400 font-medium mt-0.5 mb-1.5">{fechaFormateada}</p>
												)}

												{/* Row 3: Turnos + Horario */}
												<div className="flex items-center gap-2 flex-wrap text-[10px] font-medium text-gray-500 mb-2">
													{taller.turnos && taller.turnos.length > 0 &&
														taller.turnos.map((t) => (
															<span key={t}
																className="px-2 py-0.5 bg-purple-50 text-purple-500 rounded-md text-[7px] font-black uppercase tracking-wider border border-purple-100">{t}</span>
														))
													}
													{taller.horario?.inicio && (
														<div className="flex items-center gap-1">
															<Clock size={11} className="text-gray-300" />
															<span>{taller.horario.inicio} - {taller.horario.fin}</span>
														</div>
													)}
												</div>
											</div>

											{/* Bottom section: Eliminar | Aforo | Público+Switch */}
											<div className="flex items-center justify-between pt-2 border-t border-gray-50">
												{/* Eliminar */}
													<button onClick={(e) => handleDeleteClick(e, taller)}
													className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
													title="Eliminar taller">
													<Trash2 size={14} />
												</button>

												{/* Aforo */}
												<div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
													<Users size={11} className="text-gray-300" />
													<span className={inscripciones >= taller.aforo ? 'text-energy-orange' : ''}>
														{inscripciones}/{taller.aforo}
													</span>
												</div>

												{/* Público/Oculto + Switch */}
												<div className="flex flex-col items-center gap-0.5">
													<span className={`flex items-center gap-1 text-[7px] font-black uppercase tracking-widest ${taller.publico ? 'text-neverland-green' : 'text-gray-300'}`}>
														{taller.publico ? <Eye size={9} /> : <EyeOff size={9} />}
														{taller.publico ? 'Público' : 'Oculto'}
													</span>
													<div onClick={(e) => e.stopPropagation()}
														onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); } }}>
														<ToggleSwitch active={taller.publico} disabled={togglingIds.has(id)}
															onChange={() => handleToggleVisibilidad(taller)} />
													</div>
												</div>
											</div>
										</div>
									</motion.div>
								);
							})}
						</div>
					)}
				</div>
			</div>

			{/* Confirmación de eliminación */}
			<ConfirmModal
				isOpen={deletingTaller !== null}
				onClose={() => { setDeletingTaller(null); setDeleting(false); }}
				onConfirm={handleDeleteConfirm}
				title="Eliminar taller"
				message={`¿Estás seguro de que quieres eliminar "${deletingTaller?.nombre}"? Esta acción no se puede deshacer.`}
				confirmText={deleting ? 'Eliminando...' : 'Eliminar'}
				isLoading={deleting}
			/>
		</div>
	);
};

export default TalleresList;
