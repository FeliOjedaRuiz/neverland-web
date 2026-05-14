import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
	Loader2,
	ArrowLeft,
	Edit3,
	Trash2,
	Eye,
	EyeOff,
	Calendar,
	Clock,
	Euro,
	Users,
	ChevronDown,
	ChevronUp,
	Palette,
	Link2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getTallerById, deleteTaller, updateTaller } from '../../services/api';
import { safeParseDate } from '../../utils/safeDate';
import InscripcionesList from './InscripcionesList';
import ConfirmModal from './ConfirmModal';

// ── Toggle Switch ──
const ToggleSwitch = ({ active, onChange, disabled }) => (
	<button onClick={onChange} disabled={disabled} type="button"
		className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
			disabled ? 'opacity-50 cursor-not-allowed' : ''
		} ${active ? 'bg-neverland-green' : 'bg-gray-200'}`}>
		<span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
			active ? 'translate-x-4' : 'translate-x-0'
		}`} />
	</button>
);

// ── Badge reutilizable ──
const Badge = ({ children, color = 'gray' }) => {
	const colorMap = {
		green: 'bg-neverland-green/10 text-neverland-green border-neverland-green/20',
		orange: 'bg-energy-orange/10 text-energy-orange border-energy-orange/20',
		red: 'bg-red-50 text-red-500 border-red-100',
		gray: 'bg-gray-100 text-gray-500 border-gray-200',
		purple: 'bg-purple-50 text-purple-500 border-purple-100',
	};
	return (
		<span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${colorMap[color] || colorMap.gray}`}>
			{children}
		</span>
	);
};

const TallerDetail = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [taller, setTaller] = useState(null);
	const [loading, setLoading] = useState(true);
	const [inscripcionesOpen, setInscripcionesOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [togglingPublico, setTogglingPublico] = useState(false);

	const fetchTaller = useCallback(async () => {
		setLoading(true);
		try {
			const res = await getTallerById(id);
			setTaller(res.data);
		} catch (err) {
			console.error('Error fetching taller:', err);
			toast.error('Error al cargar el taller');
			navigate('/admin/talleres');
		} finally {
			setLoading(false);
		}
	}, [id, navigate]);

	useEffect(() => { fetchTaller(); }, [fetchTaller]);

	const handleDelete = async () => {
		setDeleting(true);
		try {
			await deleteTaller(id);
			toast.success('Taller eliminado');
			navigate('/admin/talleres');
		} catch (err) {
			console.error('Error deleting taller:', err);
			toast.error('Error al eliminar el taller');
		} finally { setDeleting(false); setShowDeleteModal(false); }
	};

	const handleToggleVisibilidad = async () => {
		setTogglingPublico(true);
		try {
			const nuevoEstado = !taller.publico;
			await updateTaller(id, { publico: nuevoEstado });
			setTaller((prev) => ({ ...prev, publico: nuevoEstado }));
			toast.success(nuevoEstado ? 'Taller visible en la web' : 'Taller oculto de la web');
		} catch (err) {
			toast.error('Error al cambiar visibilidad');
		} finally { setTogglingPublico(false); }
	};

	const handleCopyLink = async () => {
		const url = `${window.location.origin}/talleres/${id}`;
		try {
			await navigator.clipboard.writeText(url);
			toast.success('Enlace copiado — pégalo en WhatsApp');
		} catch {
			toast.error('No se pudo copiar el enlace');
		}
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

	if (!taller) return null;

	// ── Datos derivados ──
	const date = safeParseDate(taller.fecha);
	const fechaFormateada = date
		? `${date.toLocaleDateString('es-ES', { weekday: 'long' }).replace(/^\w/, (c) => c.toUpperCase())}, ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`
		: '';
	const numInscripciones = taller.numInscripciones || taller.inscripciones?.length || 0;
	const aforoCompleto = numInscripciones >= taller.aforo;
	const inscripcionesList = taller.inscripciones || [];
	const galeriaImgs = taller.galeria || [];
	const tieneGaleria = galeriaImgs.length > 0;

	return (
		<div className="flex flex-col h-full animate-in fade-in duration-300">
			<div className="flex-1 overflow-y-auto pb-8">
				<div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">

					{/* ── Back button ── */}
					<button
						onClick={() => navigate('/admin/talleres')}
						className="flex items-center gap-2 text-gray-400 hover:text-neverland-green transition-colors font-bold text-[10px] uppercase tracking-wider"
					>
						<ArrowLeft size={14} /> Volver a talleres
					</button>

					{/* ── Hero Card ── */}
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden flex flex-col sm:flex-row"
					>
						{/* Portada */}
						<div className="w-full sm:w-44 shrink-0 relative bg-gray-50">
							{taller.portada ? (
								<img
									src={taller.portada}
									alt={taller.nombre}
									className="w-full aspect-[16/9] sm:aspect-[3/4] object-cover"
								/>
							) : (
								<div className="w-full aspect-[16/9] sm:aspect-[3/4] flex flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-gray-50 to-gray-100">
									<Palette size={28} className="text-gray-200" />
									<span className="text-[8px] font-black text-gray-300 uppercase tracking-wider">Sin portada</span>
								</div>
							)}
						</div>

						{/* Info panel */}
						<div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between gap-3">
							<div className="space-y-3">
								{/* Row 1: Nombre */}
								<div className="flex flex-wrap items-center gap-2">
									<h2 className="text-xl sm:text-2xl font-display font-black text-text-black">
										{taller.nombre}
									</h2>
								</div>

								{/* Descripción */}
								{taller.descripcion && (
									<p className="text-sm text-gray-500 leading-relaxed">{taller.descripcion}</p>
								)}

								{/* Info pills — compact row */}
								<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold text-gray-600">
									{/* Fecha */}
									{fechaFormateada && (
										<>
											<div className="flex items-center gap-1.5">
												<Calendar size={13} className="text-neverland-green" />
												<span>{fechaFormateada}</span>
											</div>
											<span className="text-gray-200 select-none">·</span>
										</>
									)}

									{/* Turnos */}
									{taller.turnos?.length > 0 && (
										<>
											<div className="flex items-center gap-1">
												{taller.turnos.map((t) => (
													<Badge key={t} color="purple">{t}</Badge>
												))}
											</div>
											<span className="text-gray-200 select-none">·</span>
										</>
									)}

									{/* Horario */}
									{taller.horario?.inicio && (
										<>
											<div className="flex items-center gap-1.5">
												<Clock size={13} className="text-gray-300" />
												<span>{taller.horario.inicio} – {taller.horario.fin}</span>
											</div>
											<span className="text-gray-200 select-none">·</span>
										</>
									)}

									{/* Precio */}
									<div className="flex items-center gap-1.5">
										<Euro size={13} className="text-energy-orange" />
										<span>{taller.precio}€/niño</span>
									</div>

									<span className="text-gray-200 select-none">·</span>

									{/* Aforo */}
									<div className="flex items-center gap-1.5">
										<Users size={13} className="text-gray-300" />
										<span className={aforoCompleto ? 'text-energy-orange' : ''}>
											{numInscripciones}/{taller.aforo}
										</span>
										{aforoCompleto && (
											<span className="text-[9px] font-black text-energy-orange bg-energy-orange/10 px-1.5 py-0.5 rounded-md">LLENO</span>
										)}
									</div>
								</div>
							</div>

							{/* ── Acciones (2 filas) ── */}
							<div className="pt-2 border-t border-gray-50 space-y-2">
								{/* Fila 1: Visibilidad + Compartir */}
								<div className="flex items-center justify-between gap-2">
									<div className="flex items-center gap-1.5">
										<ToggleSwitch active={taller.publico} onChange={handleToggleVisibilidad} disabled={togglingPublico} />
										<span className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-wider ${taller.publico ? 'text-neverland-green' : 'text-gray-300'}`}>
											{taller.publico ? <Eye size={10} /> : <EyeOff size={10} />}
											{taller.publico ? 'Público' : 'Oculto'}
										</span>
									</div>
									<button
										onClick={handleCopyLink}
										disabled={!taller.publico}
										className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all ${
											taller.publico
												? 'bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white'
												: 'bg-gray-50 text-gray-300 cursor-not-allowed'
										}`}
										title={taller.publico ? 'Copiar enlace para compartir por WhatsApp' : 'Haz el taller público para poder compartirlo'}
									>
										<Link2 size={14} /> Enlace
									</button>
								</div>
								{/* Fila 2: Editar + Eliminar */}
								<div className="flex items-center gap-1.5">
									<button
										onClick={() => navigate(`/admin/talleres/${id}/editar`)}
										className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-neverland-green/10 text-neverland-green rounded-xl font-black text-[9px] uppercase tracking-wider hover:bg-neverland-green hover:text-white transition-all"
									>
										<Edit3 size={14} /> Editar
									</button>
									<button
										onClick={() => setShowDeleteModal(true)}
										disabled={deleting}
										className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 rounded-xl font-black text-[9px] uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
									>
										{deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
										Eliminar
									</button>
								</div>
							</div>
						</div>
					</motion.div>

					{/* ── Inscripciones (colapsable compacto) ── */}
					<div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
						<button
							onClick={() => setInscripcionesOpen(!inscripcionesOpen)}
							className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
						>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-neverland-green/10 rounded-xl flex items-center justify-center text-neverland-green">
									<Users size={20} />
								</div>
								<div className="text-left">
									<h3 className="font-display font-black text-sm text-text-black">Inscripciones</h3>
									<p className="text-[10px] text-gray-400 font-medium">
										{numInscripciones} de {taller.aforo} plazas
										{aforoCompleto ? ' — Completas' : ` — ${taller.aforo - numInscripciones} libre${taller.aforo - numInscripciones !== 1 ? 's' : ''}`}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								{numInscripciones > 0 && (
									<span className="text-[10px] font-black text-neverland-green bg-neverland-green/10 px-2 py-1 rounded-lg">
										{numInscripciones}
									</span>
								)}
								{inscripcionesOpen ? (
									<ChevronUp size={18} className="text-gray-300" />
								) : (
									<ChevronDown size={18} className="text-gray-300" />
								)}
							</div>
						</button>

						{inscripcionesOpen && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: 'auto', opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.25 }}
								className="overflow-hidden"
							>
								<div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-50 pt-4">
									<InscripcionesList
										inscripciones={inscripcionesList}
										aforo={taller.aforo}
										tallerId={id}
										onRefresh={fetchTaller}
									/>
								</div>
							</motion.div>
						)}
					</div>

					{/* ── Galería (scroll horizontal) ── */}
					{tieneGaleria && (
						<div>
							<h3 className="font-display font-black text-xs text-gray-400 uppercase tracking-widest mb-2 px-1">
								Galería
							</h3>
							<div className="flex gap-3 overflow-x-auto pb-1 snap-x no-scrollbar">
								{galeriaImgs.map((url, idx) => (
									<div
										key={idx}
										className="shrink-0 w-28 sm:w-32 aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 snap-start group cursor-pointer"
									>
										<img
											src={url}
											alt={`Galería ${idx + 1}`}
											className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
										/>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
			{/* Confirmación de eliminación */}
			<ConfirmModal
				isOpen={showDeleteModal}
				onClose={() => setShowDeleteModal(false)}
				onConfirm={handleDelete}
				title="Eliminar taller"
				message={`¿Estás seguro de que quieres eliminar "${taller?.nombre}"? Esta acción no se puede deshacer.`}
				confirmText={deleting ? 'Eliminando...' : 'Eliminar'}
				isLoading={deleting}
			/>
		</div>
	);
};

export default TallerDetail;
