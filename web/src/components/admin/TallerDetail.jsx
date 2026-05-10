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
	Image as ImageIcon,
	ChevronDown,
	ChevronUp,
	Palette,
	ExternalLink,
	Calendar as CalendarIcon,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getTallerById, deleteTaller, eliminarInscripcion } from '../../services/api';
import { safeParseDate, formatLongSafeDate } from '../../utils/safeDate';
import InscripcionesList from './InscripcionesList';

const Badge = ({ children, color }) => {
	const colorMap = {
		green: 'bg-neverland-green/10 text-neverland-green border-neverland-green/20',
		orange: 'bg-energy-orange/10 text-energy-orange border-energy-orange/20',
		red: 'bg-red-50 text-red-500 border-red-100',
		gray: 'bg-gray-100 text-gray-500 border-gray-200',
	};
	return (
		<span
			className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${colorMap[color] || colorMap.gray}`}
		>
			{children}
		</span>
	);
};

const InfoCard = ({ icon: Icon, label, value, color }) => (
	<div className="flex items-start gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
		<div
			className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
				color === 'orange'
					? 'bg-energy-orange/10 text-energy-orange'
					: color === 'green'
						? 'bg-neverland-green/10 text-neverland-green'
						: 'bg-gray-100 text-gray-400'
			}`}
		>
			<Icon size={18} />
		</div>
		<div className="min-w-0">
			<p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
				{label}
			</p>
			<p className="font-display font-black text-sm text-text-black break-words">
				{value || '—'}
			</p>
		</div>
	</div>
);

const TallerDetail = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [taller, setTaller] = useState(null);
	const [loading, setLoading] = useState(true);
	const [inscripcionesOpen, setInscripcionesOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

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

	useEffect(() => {
		fetchTaller();
	}, [fetchTaller]);

	const isPasado = () => {
		if (!taller?.fecha) return false;
		const fecha = safeParseDate(taller.fecha);
		if (!fecha) return false;
		const hoy = new Date();
		hoy.setHours(23, 59, 59, 999);
		return fecha < hoy;
	};

	const handleDelete = async () => {
		if (!window.confirm(`¿Eliminar el taller "${taller.nombre}"? Esta acción no se puede deshacer.`)) return;
		setDeleting(true);
		try {
			await deleteTaller(id);
			toast.success('Taller eliminado');
			navigate('/admin/talleres');
		} catch (err) {
			console.error('Error deleting taller:', err);
			toast.error('Error al eliminar el taller');
		} finally {
			setDeleting(false);
		}
	};

	const handleEliminarInscripcion = async (inscripcionId) => {
		try {
			await eliminarInscripcion(id, inscripcionId);
			toast.success('Inscripción eliminada');
			fetchTaller();
		} catch (err) {
			console.error('Error deleting inscripcion:', err);
			toast.error('Error al eliminar la inscripción');
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

	if (!taller) return null;

	const fechaFormateada = taller.fecha ? formatLongSafeDate(taller.fecha) : '';
	const numInscripciones = taller.numInscripciones || taller.inscripciones?.length || 0;
	const pasado = isPasado();
	const inscripcionesList = taller.inscripciones || [];

	return (
		<div className="flex flex-col h-full animate-in fade-in duration-300">
			<div className="flex-1 overflow-y-auto pb-8">
				<div className="p-6 max-w-4xl mx-auto space-y-6">
					{/* Back button */}
					<button
						onClick={() => navigate('/admin/talleres')}
						className="flex items-center gap-2 text-gray-400 hover:text-neverland-green transition-colors font-display font-bold text-[10px] uppercase tracking-wider"
					>
						<ArrowLeft size={14} />
						Volver a talleres
					</button>

					{/* Header */}
					<div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
						<div className="flex items-start justify-between mb-4">
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-2">
									<h2 className="text-2xl font-display font-black text-text-black truncate">
										{taller.nombre}
									</h2>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									{taller.publico ? (
										<Badge color="green">
											<div className="flex items-center gap-1">
												<Eye size={10} /> Público
											</div>
										</Badge>
									) : (
										<Badge color="gray">
											<div className="flex items-center gap-1">
												<EyeOff size={10} /> Oculto
											</div>
										</Badge>
									)}
									{pasado ? (
										<Badge color="red">Pasado</Badge>
									) : (
										<Badge color="green">Activo</Badge>
									)}
								</div>
							</div>
							<div className="flex items-center gap-2 shrink-0">
								<button
									onClick={() => navigate(`/admin/talleres/${id}/editar`)}
									className="flex items-center gap-2 px-4 py-2 bg-neverland-green/10 text-neverland-green rounded-2xl font-display font-black text-[9px] uppercase tracking-wider hover:bg-neverland-green hover:text-white transition-all"
								>
									<Edit3 size={14} />
									Editar
								</button>
								<button
									onClick={handleDelete}
									disabled={deleting}
									className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-2xl font-display font-black text-[9px] uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
								>
									{deleting ? (
										<Loader2 size={14} className="animate-spin" />
									) : (
										<Trash2 size={14} />
									)}
									Eliminar
								</button>
							</div>
						</div>

						{/* Descripción */}
						{taller.descripcion && (
							<p className="text-sm text-gray-500 leading-relaxed mt-2 max-w-2xl">
								{taller.descripcion}
							</p>
						)}
					</div>

					{/* Info Cards Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						<InfoCard
							icon={Calendar}
							label="Fecha"
							value={fechaFormateada}
							color="green"
						/>
						<InfoCard
							icon={Clock}
							label="Horario"
							value={
								taller.horario?.inicio
									? `${taller.horario.inicio} - ${taller.horario.fin}`
									: '—'
							}
							color="orange"
						/>
						<InfoCard
							icon={Euro}
							label="Precio"
							value={`${taller.precio}€/niño`}
							color="green"
						/>
						<InfoCard
							icon={Users}
							label="Aforo"
							value={`${numInscripciones} / ${taller.aforo}`}
							color="orange"
						/>
						<InfoCard
							icon={Palette}
							label="Turnos"
							value={taller.turnos?.join(', ') || '—'}
						/>
						{taller.googleEventId && (
							<InfoCard
								icon={CalendarIcon}
								label="Google Calendar"
								value="Evento sincronizado"
								color="green"
							/>
						)}
					</div>

					{/* Galería de imágenes */}
					{(taller.portada || (taller.galeria && taller.galeria.length > 0)) && (
						<div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
							<h3 className="font-display font-black text-base text-text-black mb-4">
								Galería
							</h3>
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
								{taller.portada && (
									<div className="relative group rounded-2xl overflow-hidden aspect-square bg-gray-100">
										<img
											src={taller.portada}
											alt="Portada"
											className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
										/>
										<div className="absolute top-2 left-2 px-2 py-0.5 bg-white/80 backdrop-blur-sm rounded-lg text-[7px] font-black uppercase tracking-wider text-gray-500">
											Portada
										</div>
									</div>
								)}
								{(taller.galeria || []).map((url, idx) => (
									<div
										key={idx}
										className="relative group rounded-2xl overflow-hidden aspect-square bg-gray-100"
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

					{/* Sección de inscripciones */}
					<div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
						<button
							onClick={() => setInscripcionesOpen(!inscripcionesOpen)}
							className="w-full p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
						>
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 bg-neverland-green/10 rounded-2xl flex items-center justify-center text-neverland-green">
									<Users size={22} />
								</div>
								<div className="text-left">
									<h3 className="font-display font-black text-base text-text-black">
										Inscripciones
									</h3>
									<p className="text-[10px] text-gray-400 font-medium mt-0.5">
										{numInscripciones} niño{numInscripciones !== 1 ? 's' : ''} inscrito{numInscripciones !== 1 ? 's' : ''}
										{numInscripciones >= taller.aforo ? ' — Aforo completo' : ''}
									</p>
								</div>
							</div>
							{inscripcionesOpen ? (
								<ChevronUp size={20} className="text-gray-300" />
							) : (
								<ChevronDown size={20} className="text-gray-300" />
							)}
						</button>

						{inscripcionesOpen && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: 'auto', opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.3 }}
								className="overflow-hidden"
							>
								<div className="px-6 pb-6 border-t border-gray-50 pt-4">
									<InscripcionesList
										inscripciones={inscripcionesList}
										aforo={taller.aforo}
										tallerId={id}
										onDelete={handleEliminarInscripcion}
									/>
								</div>
							</motion.div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default TallerDetail;
