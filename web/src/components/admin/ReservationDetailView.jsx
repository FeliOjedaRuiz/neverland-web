import React, { useState, useEffect } from 'react';
import { safeParseDate } from '../../utils/safeDate';
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
	MessageSquare,
	TimerReset,
	Receipt,
	Users,
    Copy,
    ExternalLink
} from 'lucide-react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import GoogleCalendarButton from '../common/GoogleCalendarButton';
import {
	getReservationById,
	getPublicReservationById,
	updateReservation,
	deleteReservation,
	getConfig,
	checkAvailability,
} from '../../services/api';
import { formatSafeDate, formatLongSafeDate } from '../../utils/safeDate';


const ReservationDetailView = ({ reservation: propReservation }) => {
	const navigate = useNavigate();
	const { id } = useParams();
	const { config: contextConfig, setConfig: setContextConfig } =
		useOutletContext() || {}; // Handle cases where context is not available
	const [reservation, setReservation] = useState(propReservation);
	const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [activeModal, setActiveModal] = useState(null); // 'client', 'datetime', 'menus', 'extras'
	const [config, setConfig] = useState(contextConfig);
	const [loading, setLoading] = useState(!propReservation);
	const [showConfirmSuccessModal, setShowConfirmSuccessModal] = useState(false);

	const isAdmin = React.useMemo(
		() =>
			!!localStorage.getItem('token') &&
			(window.location.pathname.startsWith('/admin') ||
				window.location.pathname.startsWith('/dashboard')),
		[],
	);

	const onBack = () => {
		if (isAdmin) {
			navigate(-1);
		} else {
			navigate('/');
		}
	};

	// --- Modal Navigation Handling (Back button to close modal) ---
	useEffect(() => {
		const handlePopState = () => {
			if (activeModal || showDeleteConfirm) {
				// Don't call history.back() here as we are ALREADY going back
				setActiveModal(null);
				setShowDeleteConfirm(false);
			}
		};

		if (activeModal || showDeleteConfirm) {
			window.history.pushState({ isModal: true }, '');
			window.addEventListener('popstate', handlePopState);
		}

		return () => window.removeEventListener('popstate', handlePopState);
	}, [activeModal, showDeleteConfirm]);

	const closeModals = () => {
		if (activeModal || showDeleteConfirm || showConfirmSuccessModal) {
			setActiveModal(null);
			setShowDeleteConfirm(false);
			setShowConfirmSuccessModal(false);
			// If we manually close and the current state is the modal state, go back to clean up history
			if (window.history.state?.isModal) {
				window.history.back();
			}
		}
	};

	// Transformation logic to ensure stable IDs and fields for list items
	const transformConfig = (data) => {
		const normalizeList = (list) =>
			(list || []).map((item) => {
				if (typeof item === 'string') {
					return {
						id: Date.now().toString() + Math.random(),
						nombre: item,
						name: item,
						suspended: false,
						imageUrl: '',
					};
				}
				return {
					...item,
					id: String(item.id || item._id || ''),
					nombre: item.nombre || item.name || '',
					name: item.nombre || item.name || '',
					precio: item.precio || item.price || 0,
					price: item.precio || item.price || 0,
					suspended: item.suspended || false,
				};
			});

		if (data.menusNiños) data.menusNiños = normalizeList(data.menusNiños);
		if (data.preciosAdultos) data.preciosAdultos = normalizeList(data.preciosAdultos);
		if (data.workshops) data.workshops = normalizeList(data.workshops);
		if (data.characters) data.characters = normalizeList(data.characters);

		return data;
	};

	useEffect(() => {
		if (contextConfig) {
			setConfig(transformConfig(JSON.parse(JSON.stringify(contextConfig))));
		}
	}, [contextConfig]);

	useEffect(() => {
		let isMounted = true;
		const fetchInitialData = async () => {
			try {
				if (!reservation && id) {
					const res = isAdmin
						? await getReservationById(id)
						: await getPublicReservationById(id);
					if (isMounted) setReservation(res.data);
				}

				if (!config && !contextConfig) {
					const res = await getConfig();
					const data = transformConfig(res.data);
					if (isMounted) {
						setConfig(data);
						if (setContextConfig) setContextConfig(data);
					}
				}
			} catch (err) {
				console.error('Error fetching data:', err);
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		fetchInitialData();
		return () => {
			isMounted = false;
		};
	}, [id, isAdmin, reservation, config, contextConfig, setContextConfig]); // Added back necessary dependencies safely

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-full py-20 text-gray-300 gap-4">
				<Loader2 className="animate-spin text-neverland-green/40" size={48} />
				<p className="font-display font-black uppercase tracking-widest text-[10px]">
					Cargando detalle de reserva...
				</p>
			</div>
		);
	}

	if (!reservation) return null;

	const handleStatusChange = async (newStatus) => {
		if (newStatus === reservation.estado) {
			setIsStatusMenuOpen(false);
			return;
		}
		if (newStatus === 'cancelado' || newStatus === 'cancelada') {
			setShowDeleteConfirm(true);
			setIsStatusMenuOpen(false);
			return;
		}

		setIsUpdating(true);
		setIsStatusMenuOpen(false);
		try {
			const res = await updateReservation(reservation.id, { estado: newStatus });
			if (res.data) {
				setReservation(res.data);
				toast.success(`Estado actualizado a ${newStatus}`);
				
				// Abrir modal de éxito si el estado es confirmado
				if (newStatus === 'confirmado' || newStatus === 'confirmada') {
					setShowConfirmSuccessModal(true);
				}
			}
		} catch (err) {
			console.error('Error updating status:', err);
			toast.error('Error al actualizar el estado');
		} finally {
			setIsUpdating(false);
		}
	};

	const handleDelete = async () => {
		setIsUpdating(true);
		try {
			await deleteReservation(reservation.id);
			toast.success('Reserva eliminada correctamente');
			
			// Clean up modal history entry if present
			if (window.history.state?.isModal) {
				window.history.back();
				// Small delay to allow history to pop before navigating main view
				setTimeout(() => onBack(), 100);
			} else {
				onBack();
			}
		} catch (err) {
			console.error('Error deleting reservation:', err);
			toast.error('Error al eliminar la reserva');
			setShowDeleteConfirm(false);
			setIsUpdating(false);
		}
	};

	const formatDate = (dateString, format = 'long') => {
		if (!dateString) return '';
		if (format === 'short') {
			return formatSafeDate(dateString);
		}
		return formatLongSafeDate(dateString);
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

		return base;
	};

	const getExtendedTimeLabel = (base, ext, type) => {
		if (!ext || ext === 0) return getTurnoLabel(base);
		if (base === 'T1') return ext === 30 ? '16:30 - 19:00' : '16:00 - 19:00';
		if (base === 'T2') {
			if (ext === 30)
				return type === 'before' ? '17:30 - 20:00' : '18:00 - 20:30';
			if (type === 'before') return '17:00 - 20:00';
			if (type === 'both') return '17:30 - 20:30';
			return '18:00 - 21:00';
		}
		if (base === 'T3') return ext === 30 ? '19:15 - 21:45' : '19:15 - 22:15';
		return getTurnoLabel(base);
	};

	const isEditable = () => {
		if (isAdmin) return true;
		if (!reservation?.fecha || !reservation?.turno) return false;

		const eventDate = safeParseDate(reservation.fecha);
		if (!eventDate || isNaN(eventDate.getTime())) return false;

		// Sincronizar con los horarios base para precisión de 72h
		const baseTimes = {
			T1: [17, 0],
			T2: [18, 0],
			T3: [19, 15],
		};

		const [h, m] = baseTimes[reservation.turno] || [0, 0];
		eventDate.setHours(h, m, 0, 0);

		const now = new Date();
		const diffHours = (eventDate - now) / (1000 * 60 * 60);
		
		return diffHours >= 72;
	};

	return (
		<div className="min-h-full bg-cream-bg">
			<div
				className={`flex flex-col h-full animate-in slide-in-from-right duration-300 relative ${
					!isAdmin
						? 'bg-white mt-16 md:mt-20 max-w-xl mx-auto shadow-2xl md:my-8 md:rounded-[40px] overflow-hidden min-h-[calc(100dvh-150px)]'
						: 'bg-cream-bg'
				}`}
			>
				{/* Barra de título opcional para el visitante */}
				{!isAdmin && (
					<div className="bg-calendar-bg px-6 py-4 border-b border-gray-100 flex items-center justify-between">
						<div>
							<h1 className="text-xl font-display font-black text-text-black leading-tight">
								Mi Reserva
							</h1>
							<p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
								Estado y Detalles
							</p>
						</div>
						<div className="p-2 bg-neverland-green/5 text-neverland-green rounded-2xl">
							<Package size={24} />
						</div>
					</div>
				)}

				{/* Modal de Confirmación de Borrado */}
				{showDeleteConfirm && (
					<div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all animate-in fade-in duration-200">
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
									{(
										safeParseDate(reservation.fecha) || new Date()
									).toLocaleDateString('es-ES')}
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
									onClick={closeModals}
									className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black text-sm transition-all active:scale-95"
								>
									No, mantenerla
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Modal de Éxito al Confirmar Reserva */}
				{showConfirmSuccessModal && (
					<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all animate-in fade-in duration-300">
						<div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
							
							<div className="relative z-10">
								<div className="w-20 h-20 bg-neverland-green/10 text-neverland-green rounded-3xl flex items-center justify-center mx-auto mb-6 animate-bounce-subtle">
									<CheckCircle size={40} />
								</div>
								
								<h3 className="text-2xl font-display font-black text-text-black text-center mb-2">
									¡Reserva confirmada!
								</h3>
								<p className="text-gray-500 text-sm text-center mb-8 px-2 leading-relaxed">
									Los detalles se han guardado correctamente y el turno ya está bloqueado para <span className="font-bold text-neverland-green">{reservation.cliente?.nombreNiño}</span>.
								</p>

								<div className="flex flex-col gap-3">
									<button
										onClick={() => {
											const phone = String(reservation.cliente?.telefono || '').replace(/\D/g, '');
											const date = (safeParseDate(reservation.fecha) || new Date()).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
											
											// Para el mensaje de WhatsApp, queremos que el cliente siempre reciba la URL real de producción
											const baseUrl = 'https://neverlandcullarvega.es';
											const detalleUrl = `${baseUrl}/mi-reserva/${reservation.id}`;
											const invitacionUrl = reservation.invitationId ? `${baseUrl}/invitacion/${reservation.invitationId}` : null;
											
											const startTime = reservation.horario?.inicio;

											let message = `¡Hola! 👋 tu solicitud de reserva en Neverland ha sido confirmada. ✨\n\n📝 *En este enlace puedes ver todos los detalles y hacer modificaciones hasta 3 días antes:*\n🔗 ${detalleUrl}\n`;
											
											if (invitacionUrl) {
												message += `\n💌 *Y en este otro puedes ver la invitación personalizada:*\n🔗 ${invitacionUrl}\n`;
											}
											
											message += `\n¡Nos vemos el ${date} a las 🕒 ${startTime}! 🥳\nMuchas gracias. ❤️`;
											
											window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
											setShowConfirmSuccessModal(false);
										}}
										className="w-full py-4 bg-neverland-green hover:bg-neverland-green/90 text-white rounded-2xl font-black text-sm shadow-xl shadow-neverland-green/20 transition-all active:scale-95 flex items-center justify-center gap-2"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="18"
											height="18"
											viewBox="0 0 24 24"
											fill="currentColor"
											className="shrink-0"
										>
											<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
										</svg>
										Enviar WhatsApp de confirmación
									</button>
									<button
										onClick={() => setShowConfirmSuccessModal(false)}
										className="w-full py-4 text-gray-400 hover:text-gray-600 font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
									>
										Cerrar
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Header con fondo verde */}
				<div className="flex items-center gap-3 p-4 bg-neverland-green text-white shrink-0 relative z-20">
					<div className="flex-1 min-w-0">
						{/* Fila 1: Nombre y Edad */}
						<h2 className="text-xl font-display font-black leading-tight wrap-break-word">
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
								{isAdmin ? (
									<>
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
													onClick={() => handleStatusChange('cancelada')}
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
									</>
								) : (
									<div
										className={`px-4 py-2 rounded-2xl text-[10px] sm:text-xs font-black uppercase shadow-lg border-2 ${
											reservation.estado === 'confirmado' ||
											reservation.estado === 'confirmada'
												? 'bg-neverland-green/20 text-white border-neverland-green/40'
												: reservation.estado === 'pendiente' ||
													  reservation.estado === 'solicitado'
													? 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-yellow-500/10'
													: 'bg-white/10 text-white border-white/20'
										}`}
									>
										Estado: {reservation.estado}
									</div>
								)}
							</div>
						</div>

						{/* Google Calendar for Customer Only */}
						{!isAdmin && (
							<div className="mt-6 flex justify-center">
								<GoogleCalendarButton
									reservation={reservation}
									className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
								/>
							</div>
						)}
					</div>
				</div>

				{/* Invitation Buttons Row - Centered and visible for both Admin and Visitor if confirmed */}
				{(reservation.estado === 'confirmado' || reservation.estado === 'confirmada') && reservation.invitationId && (
					<div className="bg-neverland-green text-white pb-4 px-4 -mt-1 relative z-10">
						<div className="flex items-center justify-center gap-3 pt-1">
							<a 
								href={`/invitacion/${reservation.invitationId}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1.5 px-4 py-2 bg-energy-orange hover:bg-energy-orange/90 text-white rounded-2xl text-[9px] font-black uppercase transition-all active:scale-95 shadow-lg shadow-black/10"
							>
								<ExternalLink size={12} /> Ver invitación
							</a>
							<button 
								onClick={() => {
									const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
									const baseUrl = isLocal ? window.location.origin : 'https://neverlandcullarvega.es';
									const link = `${baseUrl}/invitacion/${reservation.invitationId}`;
									
									const handleSuccess = () => toast.success('Enlace copiado');
									const handleError = () => toast.error('Error al copiar el enlace');

									if (navigator.clipboard && navigator.clipboard.writeText) {
										navigator.clipboard.writeText(link).then(handleSuccess).catch(() => {
											try {
												const el = document.createElement('textarea');
												el.value = link;
												document.body.appendChild(el);
												el.select();
												document.execCommand('copy');
												document.body.removeChild(el);
												handleSuccess();
											} catch {
												handleError();
											}
										});
									} else {
										try {
											const el = document.createElement('textarea');
											el.value = link;
											document.body.appendChild(el);
											el.select();
											document.execCommand('copy');
											document.body.removeChild(el);
											handleSuccess();
										} catch {
											handleError();
										}
									}
								}}
								className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 rounded-2xl text-[9px] font-black uppercase transition-all active:scale-95 shadow-lg shadow-black/10"
							>
								<Copy size={12} /> Copiar enlace
							</button>
						</div>
					</div>
				)}

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6 space-y-8 bg-cream-bg">
					{/* Client Info */}
					<section className="max-w-3xl mx-auto">
						<div className="bg-surface p-6 sm:p-8 rounded-[32px] border border-gray-100 shadow-sm relative">
							<div className="flex justify-between items-center mb-6">
								<h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
									<User size={14} /> Información del Cliente
								</h4>
								{isEditable() && (
									<button
										onClick={() => setActiveModal('client')}
										className="group flex items-center gap-1.5 px-3 py-1.5 bg-neverland-green/5 hover:bg-neverland-green/10 text-neverland-green rounded-xl transition-all border border-neverland-green/10"
									>
										<span className="text-[10px] font-black uppercase tracking-tight">
											Editar
										</span>
										<Pencil
											size={12}
											className="transition-transform group-hover:scale-110"
										/>
									</button>
								)}
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
								<div>
									<p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
										Niño/a del cumple
									</p>
									<p className="font-display font-black text-2xl text-text-black mb-1">
										{reservation.cliente?.nombreNiño}
									</p>
									<span className="text-sm font-bold text-neverland-green bg-neverland-green/5 px-3 py-1 rounded-full">
										{reservation.cliente?.edadNiño} años
									</span>
								</div>
								<div>
									<p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
										Responsable
									</p>
									<p className="font-bold text-lg text-text-black mb-2">
										{reservation.cliente?.nombrePadre}
									</p>
									<div className="flex flex-wrap gap-2">
										<a
											href={`https://wa.me/${String(reservation.cliente?.telefono || '').replace(/\D/g, '')}`}
											target="_blank"
											rel="noreferrer"
											className="text-neverland-green hover:bg-neverland-green/10 flex items-center gap-2 text-sm font-bold bg-neverland-green/5 px-4 py-2 rounded-2xl transition-colors"
										>
											<Phone size={14} /> {reservation.cliente?.telefono}
										</a>
										{reservation.cliente?.email && (
											<div className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 overflow-hidden max-w-full">
												<Mail size={14} className="shrink-0" /> <span className="truncate lowercase">{reservation.cliente.email}</span>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</section>

					{/* Date & Time */}
					<section className="max-w-3xl mx-auto">
						<div className="bg-surface p-6 sm:p-8 rounded-[32px] border border-gray-100 shadow-sm relative">
							<div className="flex justify-between items-center mb-6">
								<h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
									<Calendar size={14} /> Fecha y Horario
								</h4>
								{(isAdmin || (isEditable() && false)) && (
									<button
										onClick={() => setActiveModal('datetime')}
										className="group flex items-center gap-1.5 px-3 py-1.5 bg-neverland-green/5 hover:bg-neverland-green/10 text-neverland-green rounded-xl transition-all border border-neverland-green/10"
									>
										<span className="text-[10px] font-black uppercase tracking-tight">
											Editar
										</span>
										<Pencil
											size={12}
											className="transition-transform group-hover:scale-110"
										/>
									</button>
								)}
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
								<div className="flex items-center gap-4 p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50">
									<div className="w-10 h-10 bg-energy-orange/10 text-energy-orange rounded-xl flex items-center justify-center shrink-0">
										<Calendar size={20} />
									</div>
									<div className="min-w-0">
										<p className="text-[9px] text-gray-400 font-black uppercase mb-0.5 tracking-tight">
											Fecha
										</p>
										<p className="font-display font-black text-lg text-text-black capitalize truncate">
											{formatDate(reservation.fecha)}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-4 p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50">
									<div className="w-10 h-10 bg-blue-400/10 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
										<Clock size={20} />
									</div>
									<div className="min-w-0">
										<p className="text-[9px] text-gray-400 font-black uppercase mb-0.5 tracking-tight">
											Turno / Horario
										</p>
										<p className="font-display font-black text-lg text-text-black truncate">
											{reservation.turno} (
											{getTurnoLabel(reservation.turno, reservation.horario)})
										</p>
									</div>
								</div>
							</div>

							{/* Extension de tiempo */}
							<div
								className={`mt-4 flex items-center gap-4 p-3 rounded-2xl border transition-all ${reservation.horario?.extensionMinutos > 0 ? 'bg-purple-50/50 border-purple-100' : 'bg-gray-50/50 border-gray-100/50 opacity-60'}`}
							>
								<div
									className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${reservation.horario?.extensionMinutos > 0 ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}
								>
									<TimerReset size={20} />
								</div>
								<div className="min-w-0 flex flex-1 justify-between items-center">
									<div>
										<p className="text-[9px] text-gray-400 font-black uppercase mb-0.5 tracking-tight">
											Tiempo Extra
										</p>
										<p className="text-sm font-black text-gray-800">
											{reservation.horario?.extensionMinutos > 0
												? `+${reservation.horario.extensionMinutos} min (+${reservation.horario.costoExtension || 0}€)`
												: 'Sin extensión'}
										</p>
									</div>
								</div>
							</div>
						</div>
					</section>

					{/* Menus */}
					<section className="max-w-3xl mx-auto">
						<div className="bg-surface p-6 sm:p-8 rounded-[32px] border border-gray-100 shadow-sm relative">
							<div className="flex justify-between items-center mb-6">
								<h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
									<Utensils size={14} /> Menús y Asistencia
								</h4>
								{isEditable() && (
									<button
										onClick={() => setActiveModal('menus')}
										className="group flex items-center gap-1.5 px-3 py-1.5 bg-neverland-green/5 hover:bg-neverland-green/10 text-neverland-green rounded-xl transition-all border border-neverland-green/10"
									>
										<span className="text-[10px] font-black uppercase tracking-tight">
											Editar
										</span>
										<Pencil
											size={12}
											className="transition-transform group-hover:scale-110"
										/>
									</button>
								)}
							</div>

							<div className="space-y-4">
								{/* Niños */}
								<div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 gap-3">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-neverland-green/10 text-neverland-green rounded-xl flex items-center justify-center shrink-0">
											<Smile size={20} />
										</div>
										<div>
											<p className="text-[9px] text-gray-400 font-black uppercase mb-0.5 tracking-tight">
												Niños
											</p>
											<p className="font-display font-black text-lg text-text-black">
												{reservation.detalles?.niños?.cantidad} invitados
											</p>
										</div>
									</div>
									<span className="bg-neverland-green text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-center">
										{reservation.detalles?.niños?.menuNombre ||
											(() => {
												if (!config) return 'Cargando...';
												const currentMenuId = String(
													reservation.detalles?.niños?.menuId || '',
												);
												const menu = config.menusNiños?.find(
													(m) => String(m.id || m._id) === currentMenuId,
												);
												return menu
													? `${menu.nombre}`
													: `${reservation.detalles?.niños?.menuId}`;
											})()}
									</span>
								</div>

								{/* Alergenos */}
								<div
									className={`p-4 rounded-2xl border flex items-center gap-3 ${reservation.detalles?.extras?.alergenos ? 'bg-red-50/50 border-red-100' : 'bg-gray-50/50 border-gray-100/50'}`}
								>
									<div
										className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${reservation.detalles?.extras?.alergenos ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-300'}`}
									>
										<AlertTriangle size={20} />
									</div>
									<div className="min-w-0">
										<p className="text-[9px] text-gray-400 font-black uppercase mb-0.5 tracking-widest">
											Alérgenos e Intolerancias
										</p>
										<p
											className={`text-xs font-bold truncate ${reservation.detalles?.extras?.alergenos ? 'text-red-700' : 'text-gray-400 italic'}`}
										>
											{reservation.detalles?.extras?.alergenos ||
												'Ninguna reportada'}
										</p>
									</div>
								</div>

								{/* Adultos */}
								<div className="p-5 bg-gray-50/30 rounded-2xl border border-gray-100/50">
									<div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100/50">
										<div className="w-10 h-10 bg-energy-orange/10 text-energy-orange rounded-xl flex items-center justify-center shrink-0">
											<Utensils size={20} />
										</div>
										<div>
											<p className="text-[9px] text-gray-400 font-black uppercase mb-0.5 tracking-tight">
												Adultos
											</p>
											<p className="font-display font-black text-lg text-text-black">
												{reservation.detalles?.adultos?.cantidad || 0}{' '}
												asistentes
											</p>
										</div>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
										{(() => {
											const adultos = reservation.detalles?.adultos;
											let normalized = [];
											if (Array.isArray(adultos)) normalized = adultos;
											else if (adultos && typeof adultos === 'object') {
												if (Array.isArray(adultos.comida))
													normalized = adultos.comida;
												else if (
													adultos.comida &&
													typeof adultos.comida === 'object'
												) {
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
														className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100 text-sm shadow-sm"
													>
														<span className="font-bold text-gray-700 truncate mr-2">
															{item.item}
														</span>
														<span className="bg-energy-orange/10 text-energy-orange px-2 py-0.5 rounded-lg font-black text-xs">
															x{item.cantidad}
														</span>
													</div>
												));
											}
											return (
												<p className="text-xs text-gray-400 italic py-2">
													Sin comida seleccionada para adultos
												</p>
											);
										})()}
									</div>
								</div>
							</div>
						</div>
					</section>

					{/* Extras */}
					<section className="max-w-3xl mx-auto">
						<div className="bg-surface p-6 sm:p-8 rounded-[32px] border border-gray-100 shadow-sm relative">
							<div className="flex justify-between items-center mb-6">
								<h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
									<Sparkles size={14} /> Extras y Actividades
								</h4>
								{isEditable() && (
									<button
										onClick={() => setActiveModal('extras')}
										className="group flex items-center gap-1.5 px-3 py-1.5 bg-neverland-green/5 hover:bg-neverland-green/10 text-neverland-green rounded-xl transition-all border border-neverland-green/10"
									>
										<span className="text-[10px] font-black uppercase tracking-tight">
											Editar
										</span>
										<Pencil
											size={12}
											className="transition-transform group-hover:scale-110"
										/>
									</button>
								)}
							</div>
							<div className="grid grid-cols-1 gap-3">
								{/* Actividad */}
								<div
									className={`p-3 rounded-2xl border flex items-center gap-4 transition-all ${reservation.detalles?.extras?.taller !== 'ninguno' ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50/50 border-gray-100/50 opacity-60'}`}
								>
									<div
										className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${reservation.detalles?.extras?.taller !== 'ninguno' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
									>
										<Sparkles size={18} />
									</div>
									<div className="min-w-0 flex flex-1 justify-between items-center">
										<p className="text-[9px] text-gray-400 font-black uppercase tracking-tight">
											Actividad
										</p>
										<p className="text-sm font-black text-gray-800 truncate">
											{reservation.detalles?.extras?.taller === 'ninguno'
												? 'Sin actividad'
												: reservation.detalles?.extras?.taller}
										</p>
									</div>
								</div>

								{/* Personajes */}
								<div
									className={`p-3 rounded-[24px] border flex items-center gap-3 transition-all ${(reservation.detalles?.extras?.personajes?.length || 0) > 0 ? 'bg-purple-50/50 border-purple-100 shadow-sm' : 'bg-gray-50/50 border-gray-100/50 opacity-60'}`}
								>
									{/* Avatar chips for each character */}
									<div className="flex shrink-0">
										{(reservation.detalles?.extras?.personajes?.length || 0) === 0 ? (
											<div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
												<Smile size={20} className="text-gray-400" />
											</div>
										) : (
											reservation.detalles.extras.personajes.map((charName, idx) => {
												const characterData = config?.characters?.find(c => (c.nombre || c.name) === charName);
											 const isLast = idx === reservation.detalles.extras.personajes.length - 1;
												return (
													<div
														key={idx}
														className={`w-12 h-12 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-white ${
															!isLast ? '-ml-3' : ''
														}`}
														style={{ zIndex: reservation.detalles.extras.personajes.length - idx }}
													>
														{characterData?.imageUrl ? (
															<img src={characterData.imageUrl} className="w-full h-full object-cover" alt={charName} />
														) : (
															<Smile size={20} className="text-purple-600" />
														)}
													</div>
												);
											})
										)}
									</div>
									<div className="min-w-0 flex flex-1 justify-between items-center">
										<div>
											<p className="text-[9px] text-gray-400 font-black uppercase tracking-tight mb-0.5">
												Personaje{(reservation.detalles?.extras?.personajes?.length || 0) > 1 ? 's' : ''}
											</p>
											{(reservation.detalles?.extras?.personajes?.length || 0) === 0 ? (
												<p className="text-sm font-black text-gray-400 truncate">Sin personaje</p>
											) : (
												<div className="flex flex-wrap gap-1">
													{reservation.detalles.extras.personajes.map((charName, idx) => (
														<span key={idx} className="text-sm font-black text-gray-800 truncate">
															{idx > 0 && ', '}
															{charName}
														</span>
													))}
												</div>
											)}
										</div>
										{(reservation.detalles?.extras?.personajes?.length || 0) > 0 && (
											<div className="flex flex-col items-end gap-1">
												<span className="text-[10px] font-black text-purple-600 bg-purple-100 px-2 py-1 rounded-lg">
													+{config?.preciosExtras?.precioPersonajeApplied || 0}€
												</span>
												{(reservation.detalles?.extras?.personajes?.length || 0) === 3 && (
													<span className="text-[9px] font-black text-white bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 rounded-full">
														Pack 3
													</span>
												)}
											</div>
										)}
									</div>
								</div>

								{/* Piñata */}
								<div
									className={`p-3 rounded-2xl border flex items-center gap-4 transition-all ${reservation.detalles?.extras?.pinata ? 'bg-energy-orange/5 border-energy-orange/20 shadow-sm' : 'bg-gray-50/50 border-gray-100/50 opacity-60'}`}
								>
									<div
										className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${reservation.detalles?.extras?.pinata ? 'bg-energy-orange/10 text-energy-orange' : 'bg-gray-100 text-gray-400'}`}
									>
										<Package size={18} />
									</div>
									<div className="min-w-0 flex flex-1 justify-between items-center">
										<p className="text-[9px] text-gray-400 font-black uppercase tracking-tight">
											Piñata
										</p>
										<p className="text-sm font-black text-gray-800">
											{reservation.detalles?.extras?.pinata
												? 'Incluida'
												: 'No incluida'}
										</p>
									</div>
								</div>
							</div>
						</div>
					</section>

					{/* Observaciones */}
					<section className="max-w-3xl mx-auto">
						<div className="bg-surface p-6 sm:p-8 rounded-[32px] border border-gray-100 shadow-sm relative">
							<div className="flex justify-between items-center mb-6">
								<h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
									<MessageSquare size={14} /> Observaciones
								</h4>
								{isEditable() && (
									<button
										onClick={() => setActiveModal('observations')}
										className="group flex items-center gap-1.5 px-3 py-1.5 bg-neverland-green/5 hover:bg-neverland-green/10 text-neverland-green rounded-xl transition-all border border-neverland-green/10"
									>
										<span className="text-[10px] font-black uppercase tracking-tight">
											Editar
										</span>
										<Pencil
											size={12}
											className="transition-transform group-hover:scale-110"
										/>
									</button>
								)}
							</div>
							<div className="p-6 bg-blue-50/30 rounded-2xl border border-blue-100/50 relative overflow-hidden group mb-4">
								<div className="absolute top-0 left-0 w-1.5 h-full bg-blue-400 opacity-20"></div>
								{reservation.detalles?.extras?.observaciones ? (
									<p className="text-sm font-medium text-gray-700 italic leading-relaxed">
										"{reservation.detalles.extras.observaciones}"
									</p>
								) : (
									<p className="text-xs text-gray-400 italic">
										No hay observaciones para esta reserva
									</p>
								)}
							</div>

							{/* Costo Extra Manual / Descuento - Ultra Minimalist */}
							{reservation.detalles?.extras?.costoExtra && reservation.detalles.extras.costoExtra !== 0 ? (
								<div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Receipt size={12} className="text-gray-400" />
										<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
											{reservation.detalles.extras.costoExtra < 0 ? 'Descuento' : 'Costo Extra'}
										</span>
									</div>
									<span className={`text-sm font-black ${reservation.detalles.extras.costoExtra < 0 ? 'text-green-600' : 'text-orange-500'}`}>
										{reservation.detalles.extras.costoExtra > 0 ? '+' : ''}{reservation.detalles.extras.costoExtra}€
									</span>
								</div>
							) : null}
						</div>
					</section>

					{/* Resumen de Precios (Card) */}
					<section className="max-w-3xl mx-auto pb-8">
						<div className="bg-surface p-6 sm:p-8 rounded-[32px] border border-gray-100 shadow-sm relative">
							<h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-5">
								<Receipt size={14} />{' '}
								{isAdmin ? 'Ingreso Previsto' : 'Resumen de Precios'}
							</h4>

							<div className="space-y-3">
								{/* Niños */}
								{(() => {
									const cantidad = reservation.detalles?.niños?.cantidad || 0;
									let precioUnitario = reservation.detalles?.niños?.precioApplied;
									if (precioUnitario == null || precioUnitario === 0) {
										const currentMenuId = String(reservation.detalles?.niños?.menuId || '');
										const menu = config?.menusNiños?.find((m) => String(m.id || m._id) === currentMenuId);
										precioUnitario = menu ? (menu.precio || menu.price || 0) : 0;
									}
									const totalNinos = cantidad * precioUnitario;
									
									return (
										<div className="flex justify-between items-center text-sm">
											<span className="text-gray-600 font-medium">
												{cantidad} Niños × {precioUnitario.toFixed(2)}€
											</span>
											<span className="font-black text-text-black">
												{totalNinos.toFixed(2)}€
											</span>
										</div>
									);
								})()}

								{/* Plus Fin de Semana */}
								{(() => {
									if (!reservation.fecha) return null;
									const day = new Date(reservation.fecha).getDay();
									if (day !== 0 && day !== 5 && day !== 6) return null;
									const plus = config?.plusFinDeSemana || 1.5;
									const cant = reservation.detalles?.niños?.cantidad || 0;
									const totalPlus = plus * cant;
									if (totalPlus <= 0) return null;
									return (
										<div className="flex justify-between items-center text-sm">
											<span className="text-gray-600 font-medium">
												Plus Fin de Semana ({cant} × {plus.toFixed(2)}€)
											</span>
											<span className="font-black text-text-black">
												{totalPlus.toFixed(2)}€
											</span>
										</div>
									);
								})()}

								{/* Adultos */}
								{(() => {
									const adultos = reservation.detalles?.adultos;
									let items = [];
									if (Array.isArray(adultos)) items = adultos;
									else if (adultos?.comida && Array.isArray(adultos.comida))
										items = adultos.comida;
									const total = items.reduce(
										(s, i) => s + (i.cantidad || 0) * (i.precioUnitario || 0),
										0,
									);
									if (total > 0)
										return (
											<div className="flex justify-between items-center text-sm">
												<span className="text-gray-600 font-medium">
													Comida Adultos
												</span>
												<span className="font-black text-text-black">
													{total.toFixed(2)}€
												</span>
											</div>
										);
									return null;
								})()}

								{/* Taller */}
								{reservation.detalles?.extras?.taller && reservation.detalles.extras.taller !== 'ninguno' && (() => {
									let pTaller = reservation.detalles.extras.precioTallerApplied;
									if (pTaller == null || pTaller === 0) {
										const tallerInfo = config?.workshops?.find(w => w.nombre === reservation.detalles.extras.taller);
										if (tallerInfo) {
											const cant = reservation.detalles?.niños?.cantidad || 0;
											pTaller = cant > 15 ? (tallerInfo.precioPlus || tallerInfo.pricePlus || 0) : (tallerInfo.precioBase || tallerInfo.priceBase || 0);
										} else {
											pTaller = 0;
										}
									}
									if (pTaller > 0) {
										return (
											<div className="flex justify-between items-center text-sm">
												<span className="text-gray-600 font-medium">
													Actividad ({reservation.detalles.extras.taller})
												</span>
												<span className="font-black text-text-black">
													{pTaller.toFixed(2)}€
												</span>
											</div>
										);
									}
									return null;
								})()}

								{/* Personajes */}
								{(reservation.detalles?.extras?.personajes?.length || 0) > 0 && (() => {
									let pPersonaje = reservation.detalles.extras.precioPersonajeApplied;
									if (pPersonaje == null || pPersonaje === 0) {
										const count = reservation.detalles.extras.personajes.length;
										const unit = config?.preciosExtras?.personaje || 40;
										const pack = config?.preciosExtras?.precioPack3Personajes || 100;
										pPersonaje = count === 3 ? pack : unit * count;
									}
									if (pPersonaje > 0) {
										return (
											<div className="flex justify-between items-center text-sm">
												<span className="text-gray-600 font-medium">
													Personajes ({reservation.detalles.extras.personajes.join(', ')})
												</span>
												<span className="font-black text-text-black">
													{pPersonaje.toFixed(2)}€
												</span>
											</div>
										);
									}
									return null;
								})()}

								{/* Piñata */}
								{reservation.detalles?.extras?.pinata && (() => {
									let pPinata = reservation.detalles.extras.precioPinataApplied;
									if (pPinata == null || pPinata === 0) {
										pPinata = config?.preciosExtras?.pinata || 0;
									}
									if (pPinata > 0) {
										return (
											<div className="flex justify-between items-center text-sm">
												<span className="text-gray-600 font-medium">Piñata</span>
												<span className="font-black text-text-black">
													{pPinata.toFixed(2)}€
												</span>
											</div>
										);
									}
									return null;
								})()}

								{/* Extensión */}
								{reservation.horario?.extensionMinutos > 0 &&
									reservation.horario?.costoExtension > 0 && (
										<div className="flex justify-between items-center text-sm">
											<span className="text-gray-600 font-medium">
												Extensión (+{reservation.horario.extensionMinutos} min)
											</span>
											<span className="font-black text-text-black">
												{reservation.horario.costoExtension.toFixed(2)}€
											</span>
										</div>
									)}

								{/* Costo Extra / Descuento */}
								{reservation.detalles?.extras?.costoExtra !== 0 && (
									<div className="flex justify-between items-center text-sm italic">
										<span className="text-energy-orange font-bold">
											{reservation.detalles.extras.costoExtra > 0
												? 'Costo Extra Manual'
												: 'Descuento Aplicado'}
										</span>
										<span className="font-black text-energy-orange">
											{reservation.detalles.extras.costoExtra > 0 ? '+' : ''}
											{reservation.detalles.extras.costoExtra.toFixed(2)}€
										</span>
									</div>
								)}

								{/* Divider */}
								<div className="border-t-2 border-dashed border-gray-200 my-2"></div>

								{/* Total */}
								<div className="flex justify-between items-center">
									<span className="text-lg font-display font-black text-text-black">
										Total
									</span>
									<span className="text-3xl font-display font-black text-neverland-green">
										{reservation.precioTotal.toFixed(2)}€
									</span>
								</div>
							</div>

							{!isAdmin && !isEditable() && (
								<div className="mt-4 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3">
									<AlertTriangle className="text-red-500 shrink-0" size={20} />
									<p className="text-[10px] font-bold text-red-600 leading-tight">
										Reserva cerrada para edición.
										<br />
										Contáctanos para cambios urgentes.
									</p>
								</div>
							)}
						</div>
					</section>
				</div>

				{/* Modal Overlay System */}
				{activeModal && (
					<div className="fixed inset-0 z-110 bg-cream-bg flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden">
						<div className="w-full h-full flex flex-col">
							<div className="px-6 py-5 border-b border-orange-100/50 flex justify-between items-center bg-calendar-bg sticky top-0 z-20">
								<h3 className="text-lg font-display font-black text-text-black uppercase tracking-tight">
									{activeModal === 'client' && 'Editar Información Cliente'}
									{activeModal === 'datetime' && 'Editar Fecha y Horario'}
									{activeModal === 'menus' && 'Editar Menús y Asistencia'}
									{activeModal === 'extras' && 'Editar Extras y Actividades'}
									{activeModal === 'observations' && 'Editar Observaciones'}
								</h3>
								<button
									onClick={closeModals}
									className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 transition-all active:scale-95"
								>
									<X size={20} />
								</button>
							</div>

							<div
								className={`flex-1 overflow-y-auto ${activeModal === 'datetime' ? 'p-2' : 'p-6 sm:p-8'}`}
							>
								{activeModal === 'client' && (
									<ClientInfoEdit
										current={reservation.cliente}
										onCancel={closeModals}
										onSave={async (newData) => {
											setIsUpdating(true);
											try {
												const res = await updateReservation(reservation.id, {
													cliente: newData,
												});
												setReservation(res.data); // Use server response
												closeModals();
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
										onCancel={closeModals}
										onSave={async (newDetalles) => {
											setIsUpdating(true);
											try {
												const res = await updateReservation(reservation.id, {
													detalles: newDetalles,
												});
												setReservation(res.data); // Update with returned reservation (includes price)
												closeModals();
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
										onCancel={closeModals}
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
												closeModals();
											} catch (err) {
												console.error(err);
												alert('Error al guardar');
											} finally {
												setIsUpdating(false);
											}
										}}
									/>
								)}

								{activeModal === 'observations' && (
									<ObservationsEdit
										current={reservation.detalles?.extras?.observaciones}
										currentCostoExtra={reservation.detalles?.extras?.costoExtra ?? 0}
										isAdmin={isAdmin}
										onCancel={closeModals}
										onSave={async (newObs, newCostoExtra) => {
											setIsUpdating(true);
											try {
												const payload = {
													detalles: {
														...reservation.detalles,
														extras: {
															...(reservation.detalles?.extras || {}),
															observaciones: newObs,
															...(isAdmin && { costoExtra: newCostoExtra }),
														},
													},
												};
												const res = await updateReservation(reservation.id, payload);
												setReservation(res.data);
												closeModals();
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
										config={config}
										onCancel={closeModals}
										onSave={async (
											newDate,
											newTurno,
											newExtension,
											newExtType,
										) => {
											setIsUpdating(true);
											try {
												const updatePayload = {
													fecha: newDate,
													turno: newTurno,
												};
												// Include extension update (reset cost so backend recalculates)
												if (newExtension !== undefined) {
													const finalTime = getExtendedTimeLabel(
														newTurno,
														newExtension,
														newExtType,
													);
													updatePayload.horario = {
														...reservation.horario,
														inicio: finalTime.split(' - ')[0],
														fin: finalTime.split(' - ')[1],
														extensionMinutos: newExtension,
														extensionType:
															newExtType ||
															(newExtension > 0 ? 'after' : 'default'),
														costoExtension: undefined, // force backend recalc
													};
												}
												const res = await updateReservation(
													reservation.id,
													updatePayload,
												);
												setReservation(res.data);
												closeModals();
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
		</div>
	);
};

// Sub-component for Date and Time Edit
const DateTimeEdit = ({ reservation, config, onCancel, onSave }) => {
	const [view, setView] = useState('calendar'); // 'calendar' | 'shifts'
	const [currentMonth, setCurrentMonth] = useState(
		safeParseDate(reservation.fecha) || new Date(),
	);
	const [selectedDate, setSelectedDate] = useState(
		reservation.fecha.split('T')[0],
	);
	const [selectedTurno, setSelectedTurno] = useState(reservation.turno);
	const [selectedExtension, setSelectedExtension] = useState(
		reservation.horario?.extensionMinutos || 0,
	);
	const [selectedExtensionType, setSelectedExtensionType] = useState(
		reservation.horario?.extensionType ||
			(reservation.horario?.extensionMinutos > 0 ? 'after' : 'default'),
	);
	const [occupied, setOccupied] = useState([]);
	const [loading, setLoading] = useState(true);

	// Reset extension when date or turn changes
	const originalDate = reservation.fecha.split('T')[0];
	const originalTurno = reservation.turno;

	const handleDateSelect = (dateStr) => {
		setSelectedDate(dateStr);
		if (dateStr !== originalDate) {
			setSelectedExtension(0);
			setSelectedExtensionType('default');
		}
		setView('shifts');
	};

	const handleTurnoSelect = (turnoId) => {
		setSelectedTurno(turnoId);
		if (turnoId !== originalTurno || selectedDate !== originalDate) {
			setSelectedExtension(0);
			setSelectedExtensionType('default');
		} else {
			// Restore original extension type if returning to original settings
			setSelectedExtension(reservation.horario?.extensionMinutos || 0);
			setSelectedExtensionType(reservation.horario?.extensionType || 'after');
		}
	};

	const fetchAvailability = React.useCallback(async () => {
		setLoading(true);
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
		} finally {
			setLoading(false);
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
				<div className="flex flex-col h-full relative">
					{loading && (
						<div className="absolute inset-0 z-10 bg-cream-bg/80 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-3xl animate-in fade-in duration-300">
							<div className="w-10 h-10 border-4 border-neverland-green/20 border-t-neverland-green rounded-full animate-spin mb-4"></div>
							<p className="font-display font-black text-neverland-green/60 text-sm uppercase tracking-widest">
								Cargando disponibilidad...
							</p>
						</div>
					)}
					<div className="flex justify-between items-center mb-4 px-2">
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

					<div className="grid grid-cols-7 mb-2 border-b border-orange-100/30 pb-2">
						{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
							<span
								key={d}
								className="text-[10px] font-black text-center text-neverland-green/60 uppercase tracking-widest"
							>
								{d}
							</span>
						))}
					</div>

					<div className="grid grid-cols-7 gap-1.5 grow">
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

							return (
								<button
									key={i}
									disabled={!isCur || isPast}
									onClick={() => {
										handleDateSelect(dateStr);
									}}
									className={`min-h-[60px] rounded-lg flex flex-col items-center justify-center relative transition-all border ${
										isSel
											? 'bg-neverland-green text-white shadow-lg border-neverland-green'
											: isPast
												? 'bg-gray-50 text-gray-200 border-transparent opacity-40 cursor-not-allowed'
												: isCur
													? 'bg-white text-text-black border-gray-100 hover:border-neverland-green/50 hover:shadow-soft'
													: 'bg-surface/50 text-gray-300 border-transparent'
									}`}
								>
									<span
										className={`text-[11px] font-black ${isSel ? '' : 'text-gray-700'}`}
									>
										{date.getDate()}
									</span>
									{!isPast && (
										<div className="w-full mt-1.5 flex flex-col gap-0.5 px-0.5 pb-0.5">
											{[1, 2, 3].map((s) => {
												const isOcc = dayOccupied.includes(`T${s}`);
												return (
													<div
														key={s}
														className={`h-[9px] w-full rounded-sm flex items-center justify-center transition-all ${
															isOcc
																? isSel
																	? 'bg-white/20'
																	: 'bg-gray-100'
																: isSel
																	? 'bg-white/40 shadow-sm'
																	: 'bg-green-100 shadow-[inset_0_1px_rgba(255,255,255,0.4)]'
														}`}
													>
														{!isOcc && (
															<span
																className={`text-[6.5px] font-black tracking-tighter leading-none ${
																	isSel
																		? 'text-white'
																		: 'text-neverland-green/80'
																}`}
															>
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

					<div className="mt-8 flex gap-3">
						<button
							onClick={onCancel}
							className="flex-1 py-4 bg-surface border border-gray-100 text-gray-500 rounded-2xl font-black text-sm transition-all hover:bg-cream-bg"
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
								{(safeParseDate(selectedDate) || new Date()).toLocaleDateString(
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
									onClick={() => handleTurnoSelect(turn.id)}
									className={`w-full p-5 rounded-[24px] border-2 flex justify-between items-center transition-all ${
										isSelected
											? 'border-neverland-green bg-neverland-green text-white shadow-xl scale-[1.02]'
											: isOcc
												? 'bg-gray-50 border-gray-100 opacity-40 cursor-not-allowed grayscale'
												: 'bg-surface border-gray-100 hover:border-neverland-green/30 hover:bg-calendar-bg'
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

					{/* Extension Selector */}
					<div className="space-y-4">
						<div>
							<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2">
								Tiempo Extra
							</p>
							<div className="grid grid-cols-3 gap-2">
								{[
									{ value: 0, label: 'Sin extra', price: null },
									{
										value: 30,
										label: '+30 min',
										price: config?.preciosExtras?.extension30 || 30,
									},
									{
										value: 60,
										label: '+60 min',
										price: config?.preciosExtras?.extension60 || 50,
									},
								].map((ext) => {
									const isSelected = selectedExtension === ext.value;
									return (
										<button
											key={ext.value}
											onClick={() => {
												setSelectedExtension(ext.value);
												if (ext.value === 0) {
													setSelectedExtensionType('default');
												} else if (selectedExtensionType === 'default') {
													// Set a sane default type based on turn
													if (selectedTurno === 'T1')
														setSelectedExtensionType('before');
													else setSelectedExtensionType('after');
												}
											}}
											className={`p-3 rounded-2xl border-2 text-center transition-all ${
												isSelected
													? 'border-purple-400 bg-purple-50 shadow-md'
													: 'border-gray-100 bg-surface hover:border-purple-200 hover:bg-purple-50/30'
											}`}
										>
											<p
												className={`text-sm font-black ${isSelected ? 'text-purple-700' : 'text-text-black'}`}
											>
												{ext.label}
											</p>
											{ext.price !== null && (
												<p
													className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'text-purple-500' : 'text-gray-400'}`}
												>
													+{ext.price}€
												</p>
											)}
										</button>
									);
								})}
							</div>
						</div>

						{/* Type Selector (Conditional based on Turn) */}
						{selectedExtension > 0 && (
							<div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-top-2">
								<p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center mb-3">
									¿Cómo aplicar el tiempo extra?
								</p>
								<div className="space-y-2">
									{selectedTurno === 'T1' && (
										<div className="flex justify-between items-center p-3 bg-white border-2 border-purple-400 rounded-xl shadow-sm">
											<span className="text-xs font-black text-purple-700">
												Empezar antes (Adelanto)
											</span>
											<span className="text-[10px] font-bold text-gray-400">
												{selectedExtension === 30
													? '16:30 - 19:00'
													: '16:00 - 19:00'}
											</span>
										</div>
									)}
									{selectedTurno === 'T3' && (
										<div className="flex justify-between items-center p-3 bg-white border-2 border-purple-400 rounded-xl shadow-sm">
											<span className="text-xs font-black text-purple-700">
												Terminar después (Alargue)
											</span>
											<span className="text-[10px] font-bold text-gray-400">
												{selectedExtension === 30
													? '19:15 - 21:45'
													: '19:15 - 22:15'}
											</span>
										</div>
									)}
									{selectedTurno === 'T2' && (
										<div className="grid grid-cols-1 gap-2">
											<button
												onClick={() => setSelectedExtensionType('before')}
												className={`flex justify-between items-center p-3 rounded-xl border-2 transition-all ${selectedExtensionType === 'before' ? 'border-purple-400 bg-white shadow-sm' : 'border-transparent bg-white/50 hover:border-purple-200'}`}
											>
												<span
													className={`text-xs font-black ${selectedExtensionType === 'before' ? 'text-purple-700' : 'text-gray-500'}`}
												>
													Empezar antes
												</span>
												<span className="text-[10px] font-bold text-gray-400">
													{selectedExtension === 30
														? '17:30 - 20:00'
														: '17:00 - 20:00'}
												</span>
											</button>
											<button
												onClick={() => setSelectedExtensionType('after')}
												className={`flex justify-between items-center p-3 rounded-xl border-2 transition-all ${selectedExtensionType === 'after' ? 'border-purple-400 bg-white shadow-sm' : 'border-transparent bg-white/50 hover:border-purple-200'}`}
											>
												<span
													className={`text-xs font-black ${selectedExtensionType === 'after' ? 'text-purple-700' : 'text-gray-500'}`}
												>
													Terminar después
												</span>
												<span className="text-[10px] font-bold text-gray-400">
													{selectedExtension === 30
														? '18:00 - 20:30'
														: '18:00 - 21:00'}
												</span>
											</button>
											{selectedExtension === 60 && (
												<button
													onClick={() => setSelectedExtensionType('both')}
													className={`flex justify-between items-center p-3 rounded-xl border-2 transition-all ${selectedExtensionType === 'both' ? 'border-purple-400 bg-white shadow-sm' : 'border-transparent bg-white/50 hover:border-purple-200'}`}
												>
													<span
														className={`text-xs font-black ${selectedExtensionType === 'both' ? 'text-purple-700' : 'text-gray-500'}`}
													>
														30m antes y 30m después
													</span>
													<span className="text-[10px] font-bold text-gray-400">
														17:30 - 20:30
													</span>
												</button>
											)}
										</div>
									)}
								</div>
							</div>
						)}
					</div>

					<div className="flex gap-3 pt-4 border-t border-gray-100">
						<button
							onClick={() =>
								onSave(
									selectedDate,
									selectedTurno,
									selectedExtension,
									selectedExtensionType,
								)
							}
							className="flex-1 py-4 bg-neverland-green text-white rounded-2xl font-black text-sm shadow-lg shadow-neverland-green/20 transition-all active:scale-95"
						>
							Guardar
						</button>
						<button
							onClick={() => setView('calendar')}
							className="px-8 py-4 bg-surface border border-gray-100 text-gray-500 rounded-2xl font-black text-sm transition-all active:scale-95 hover:bg-cream-bg"
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
	const [alergenos, setAlergenos] = useState(current.extras?.alergenos || '');
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
		const existingIdx = adultosList.findIndex((a) => a.item === item.nombre);
		if (existingIdx >= 0) {
			if (adultosList[existingIdx].cantidad >= 20) return; // Limit reached
			const newList = [...adultosList];
			newList[existingIdx] = {
				...newList[existingIdx],
				cantidad: newList[existingIdx].cantidad + 1,
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
		newList[idx].cantidad = Math.max(1, Math.min(20, qty));
		setAdultosList(newList);
	};

	return (
		<div className="space-y-8 pb-4">
			<div className="space-y-6">
				<h5 className="text-[10px] font-black text-neverland-green uppercase tracking-[0.2em] border-b border-neverland-green/10 pb-3 flex items-center gap-2">
					<div className="w-1.5 h-1.5 rounded-full bg-neverland-green animate-pulse" />
					Asistencia Infantil
				</h5>
				
				<div className="space-y-4">
					<div className="flex flex-col gap-4">
						<div className="space-y-2">
							<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
								¿Cuántos piratas vienen?
							</label>
							<div className="flex items-center bg-surface border-2 border-gray-100 rounded-[28px] p-1.5 shadow-sm focus-within:ring-4 focus-within:ring-neverland-green/5 focus-within:border-neverland-green/30 transition-all max-w-[180px]">
								<button
									onClick={() =>
										setNiñosExt({
											...niñosExt,
											cantidad: Math.max(12, niñosExt.cantidad - 1),
										})
									}
									className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-neverland-green/10 hover:text-neverland-green transition-colors active:scale-90"
								>
									<span className="text-xl font-black leading-none">-</span>
								</button>
								<input
									type="number"
									min="12"
									max="50"
									value={niñosExt.cantidad}
									onChange={(e) => {
										const val = Math.max(0, Math.min(50, parseInt(e.target.value) || 0));
										setNiñosExt({ ...niñosExt, cantidad: val });
									}}
									className="w-full bg-transparent text-center font-display font-black text-xl text-text-black outline-none"
								/>
								<button
									onClick={() =>
										setNiñosExt({
											...niñosExt,
											cantidad: Math.min(50, niñosExt.cantidad + 1),
										})
									}
									disabled={niñosExt.cantidad >= 50}
									className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-neverland-green/10 hover:text-neverland-green transition-colors disabled:opacity-30 active:scale-90"
								>
									<span className="text-xl font-black leading-none">+</span>
								</button>
							</div>
						</div>

						{/* Visual Menu Selector for Kids */}
						<div className="space-y-3">
							<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
								Selecciona el Banquete
							</label>
							<div className="grid grid-cols-1 gap-3">
								{(config?.menusNiños || []).map((m) => {
									const isSelected = String(m.id || m._id) === String(niñosExt.menuId);
									const imageUrl = m.imageUrl || m.image;
									return (
										<div
											key={m.id || m._id}
											onClick={() => setNiñosExt({ ...niñosExt, menuId: m.id || m._id })}
											className={`group flex items-center gap-4 p-3 rounded-[32px] border-2 transition-all cursor-pointer relative overflow-hidden ${
												isSelected
													? 'border-neverland-green bg-neverland-green/5 shadow-md shadow-neverland-green/5'
													: 'border-gray-50 bg-gray-50 hover:bg-white hover:border-neverland-green/20'
											}`}
										>
											<div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-white border border-gray-100 shadow-sm">
												{imageUrl ? (
													<img src={imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={m.nombre || m.name} />
												) : (
													<div className="w-full h-full flex items-center justify-center text-gray-200">
														<Pizza size={32} />
													</div>
												)}
											</div>
											<div className="flex-1 min-w-0 pr-8">
												<h6 className={`font-display font-black text-base truncate mb-0.5 ${isSelected ? 'text-neverland-green' : 'text-text-black'}`}>
													{m.nombre || m.name}
												</h6>
												<p className="text-[10px] font-bold text-gray-400 leading-tight line-clamp-2 italic pr-2">
													"{m.descripcion || 'Menú tradicional Neverland'}"
												</p>
												<div className="mt-1.5 flex items-center gap-2">
													<span className="text-[10px] font-black uppercase text-neverland-green bg-neverland-green/10 px-2.5 py-1 rounded-full border border-neverland-green/5">
														{m.precio || m.price}€ / niño
													</span>
												</div>
											</div>
											<div className={`absolute right-4 transition-all duration-300 ${isSelected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
												<CheckCircle size={28} className="text-neverland-green" fill="currentColor" stroke="white" />
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>

					{/* Alérgenos con diseño mejorado */}
					<div className="pt-2">
						<div className="flex items-center gap-2 mb-2 pl-1">
							<AlertTriangle size={14} className="text-red-400" />
							<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
								Notas de Alérgenos
							</label>
						</div>
						<textarea
							value={alergenos}
							onChange={(e) => setAlergenos(e.target.value.substring(0, 500))}
							maxLength={500}
							className="w-full bg-red-50/30 border-2 border-red-100/30 rounded-[28px] p-5 text-sm font-bold text-text-black placeholder:text-red-200 focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-200 focus:bg-white transition-all resize-none min-h-[120px]"
							placeholder="¿Alguna alergia que debamos vigilar, Capitán?"
						/>
					</div>
				</div>
			</div>

			<div className="space-y-6 pt-2">
				<h5 className="text-[10px] font-black text-energy-orange uppercase tracking-[0.2em] border-b border-orange-100 pb-3 flex items-center gap-2">
					<div className="w-1.5 h-1.5 rounded-full bg-energy-orange animate-pulse" />
					Adultos y Picoteo
				</h5>
				
				<div className="space-y-5">
					<div className="bg-orange-50/50 p-5 rounded-[32px] border-2 border-orange-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="flex items-center gap-4">
							<div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-energy-orange border border-orange-100/50">
								<User size={28} />
							</div>
							<div>
								<p className="font-display font-black text-lg text-text-black">Invitados Adultos</p>
								<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acompañantes en el evento</p>
							</div>
						</div>
						
						<div className="flex items-center bg-white border-2 border-orange-200/50 rounded-2xl p-1.5 shadow-sm">
							<button onClick={() => setAdultosQty(Math.max(1, adultosQty - 1))} className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-50/50 text-energy-orange hover:bg-energy-orange hover:text-white transition-all active:scale-90 font-black text-lg">-</button>
							<span className="w-12 text-center font-display font-black text-xl text-text-black">{adultosQty}</span>
							<button onClick={() => setAdultosQty(Math.min(40, adultosQty + 1))} className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-50/50 text-energy-orange hover:bg-energy-orange hover:text-white transition-all active:scale-90 font-black text-lg">+</button>
						</div>
					</div>

					<div className="space-y-3">
						<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
							Comida Seleccionada ({adultosList.length})
						</label>
						<div className="space-y-2.5">
							{adultosList.map((item, idx) => {
								const configItem = config?.preciosAdultos?.find(p => p.nombre === item.item);
								return (
									<div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-[24px] border-2 border-gray-100/50 shadow-sm animate-in slide-in-from-left-2 duration-300">
										<div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-gray-50 bg-gray-50">
											{configItem?.imageUrl ? (
												<img src={configItem.imageUrl} className="w-full h-full object-cover" alt={item.item} />
											) : (
												<div className="w-full h-full flex items-center justify-center text-gray-200">
													<Pizza size={24} />
												</div>
											)}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-black text-text-black truncate">{item.item}</p>
											<p className="text-[10px] font-bold text-gray-400">{item.precioUnitario}€ / unidad</p>
										</div>
										<div className="flex items-center border border-gray-100 rounded-xl bg-gray-50/50 overflow-hidden shadow-sm">
											<button onClick={() => updateAdultQty(idx, item.cantidad - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white text-gray-400 font-black">-</button>
											<span className="w-9 text-center text-xs font-black text-text-black">{item.cantidad}</span>
											<button onClick={() => updateAdultQty(idx, item.cantidad + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white text-gray-400 font-black">+</button>
										</div>
										<button onClick={() => removeAdultItem(idx)} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-300 hover:text-red-500 hover:bg-red-100 rounded-xl transition-all active:scale-90">
											<Trash2 size={18} />
										</button>
									</div>
								);
							})}
							{adultosList.length === 0 && (
								<div className="text-center py-6 bg-gray-50/30 rounded-3xl border-2 border-dashed border-gray-100">
									<p className="text-xs font-bold text-gray-300 italic">No hay comida de adultos seleccionada</p>
								</div>
							)}
						</div>
					</div>

						<div className="space-y-3">
							<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mt-6">
								Añadir al Banquete
							</p>
							<div className="grid grid-cols-2 xs:grid-cols-3 gap-2.5">
								{config.preciosAdultos
									.filter((opt) => !adultosList.some((a) => a.item === opt.nombre || a.item === opt.name))
									.map((opt) => (
										<button
											key={opt.id || opt.nombre || opt.name}
											onClick={() => addAdultItem(opt)}
											className="group flex flex-col p-2.5 bg-white border-2 border-gray-100 rounded-[28px] hover:border-energy-orange hover:shadow-lg hover:shadow-orange-500/5 transition-all active:scale-95 text-left"
										>
											<div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-2 bg-gray-50">
												{(opt.imageUrl || opt.image) ? (
													<img src={opt.imageUrl || opt.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={opt.nombre || opt.name} />
												) : (
													<div className="w-full h-full flex items-center justify-center text-gray-200">
														<Plus size={20} />
													</div>
												)}
												<div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
													<div className="bg-energy-orange text-white p-1 rounded-full shadow-lg">
														<Plus size={12} strokeWidth={3} />
													</div>
												</div>
											</div>
											<div className="px-1 line-clamp-1">
												<span className="text-[11px] font-black text-text-black group-hover:text-energy-orange transition-colors">{opt.nombre || opt.name}</span>
												<div className="text-[9px] font-bold text-gray-400">{opt.precio || opt.price}€</div>
											</div>
										</button>
									))}
							</div>
						</div>
				</div>
			</div>

			<div className="flex gap-3 pt-6 border-t border-gray-100">
				<button
					onClick={() => {
						const { precioApplied, menuNombre: _staleMenuNombre, ...cleanNiños } = niñosExt;
						onSave({
							...current,
							niños: {
								...cleanNiños,
								menuNombre: config?.menusNiños?.find(
									(m) => String(m.id || m._id) === String(niñosExt.menuId),
								)?.nombre,
							},
							adultos: {
								cantidad: adultosQty,
								comida: adultosList,
							},
							extras: {
								...current.extras,
								alergenos: alergenos,
							},
						});
					}}
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
	// Initialize with personajes array (handle legacy personaje string conversion)
	const initialFormData = { ...current };
	if (!initialFormData.personajes && initialFormData.personaje) {
		// Legacy: convert single personaje string to personajes array
		if (initialFormData.personaje === 'ninguno' || !initialFormData.personaje) {
			initialFormData.personajes = [];
		} else {
			initialFormData.personajes = [initialFormData.personaje];
		}
	} else if (!initialFormData.personajes) {
		initialFormData.personajes = [];
	}

	const [formData, setFormData] = useState(initialFormData);
	const [isTallerOpen, setIsTallerOpen] = useState(false);
	const [isPersonajeOpen, setIsPersonajeOpen] = useState(false);

	const selectedWs = config?.workshops?.find(ws => ws.name === formData.taller);

	return (
		<div className="space-y-8 pb-4">
			<div className="space-y-6">
				{/* ACTIVIDAD / TALLER */}
				<div className="space-y-3">
					<h5 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2 pl-1">
						<Sparkles size={14} />
						Actividad Seleccionada
					</h5>
					
					{/* Selected Card / Trigger */}
					<div 
						onClick={() => setIsTallerOpen(!isTallerOpen)}
						className={`p-4 rounded-[32px] border-2 transition-all cursor-pointer flex items-center justify-between group ${
							isTallerOpen ? 'border-blue-500 bg-white shadow-lg' : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-blue-200'
						}`}
					>
						<div className="flex items-center gap-4">
							<div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-gray-100 shrink-0">
								{selectedWs?.imageUrl || selectedWs?.image ? (
									<img src={selectedWs.imageUrl || selectedWs.image} className="w-full h-full object-cover" alt="" />
								) : (
									<div className="w-full h-full flex items-center justify-center text-gray-200">
										{formData.taller === 'ninguno' ? <X size={24} /> : <Sparkles size={24} />}
									</div>
								)}
							</div>
							<div>
								<p className="font-display font-black text-lg text-text-black">
									{formData.taller === 'ninguno' ? 'Sin actividad especial' : formData.taller}
								</p>
								<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
									{isTallerOpen ? 'Cerrar selector' : 'Pulsa para cambiar actividad'}
								</p>
							</div>
						</div>
						<div className={`p-2 rounded-full transition-transform duration-300 ${isTallerOpen ? 'rotate-180 bg-blue-500 text-white' : 'bg-white text-gray-300'}`}>
							<ChevronDown size={20} />
						</div>
					</div>

					{/* Collapsible Picker */}
					{isTallerOpen && (
						<div className="p-5 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in slide-in-from-top-4 duration-300">
							{/* Opción Ninguno */}
							<div
								onClick={() => {
									setFormData({ ...formData, taller: 'ninguno' });
									setIsTallerOpen(false);
								}}
								className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer bg-white ${
									formData.taller === 'ninguno' ? 'border-blue-500' : 'border-transparent hover:border-blue-200'
								}`}
							>
								<div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300">
									<X size={18} />
								</div>
								<span className="text-xs font-black text-text-black">Ninguna</span>
							</div>
							{config?.workshops?.map((ws) => (
								<div
									key={ws.id || ws._id}
									onClick={() => {
										setFormData({ ...formData, taller: ws.name });
										setIsTallerOpen(false);
									}}
									className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer bg-white ${
										formData.taller === ws.name ? 'border-blue-500' : 'border-transparent hover:border-blue-200'
									}`}
								>
									<div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-gray-100">
										{ws.imageUrl || ws.image ? (
											<img src={ws.imageUrl || ws.image} className="w-full h-full object-cover" alt="" />
										) : (
											<div className="w-full h-full flex items-center justify-center text-gray-100">
												<Sparkles size={16} />
											</div>
										)}
									</div>
									<span className="text-xs font-black text-text-black truncate">{ws.name}</span>
								</div>
							))}
						</div>
					)}
				</div>

				{/* PERSONAJES */}
				<div className="space-y-3">
					<h5 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] flex items-center gap-2 pl-1">
						<Users size={14} />
						Personajes Seleccionados
					</h5>
					
					{/* Selected Card / Trigger */}
					<div 
						onClick={() => setIsPersonajeOpen(!isPersonajeOpen)}
						className={`p-4 rounded-[32px] border-2 transition-all cursor-pointer flex items-center justify-between group ${
							isPersonajeOpen ? 'border-purple-500 bg-white shadow-lg' : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-purple-200'
						}`}
					>
						<div className="flex items-center gap-4">
							<div className="flex shrink-0">
								{(formData.personajes?.length || 0) === 0 ? (
									<div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-200">
										<X size={24} />
									</div>
								) : (
									formData.personajes.map((charName, idx) => {
										const charData = config?.characters?.find(c => (c.nombre || c.name) === charName);
										const isLast = idx === formData.personajes.length - 1;
										return (
											<div
												key={idx}
												className={`w-16 h-16 rounded-2xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center ${
													!isLast ? '-mr-3' : ''
												}`}
											>
												{charData?.imageUrl || charData?.image ? (
													<img src={charData.imageUrl || charData.image} className="w-full h-full object-cover" alt={charName} />
												) : (
													<Smile size={24} className="text-purple-400" />
												)}
											</div>
										);
									})
								)}
							</div>
							<div>
								<p className="font-display font-black text-lg text-text-black">
									{(formData.personajes?.length || 0) === 0
										? 'Sin personaje'
										: (formData.personajes?.length || 0) === 1
										? formData.personajes[0]
										: `${formData.personajes?.length} personajes`}
								</p>
								<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
									{isPersonajeOpen ? 'Cerrar selector' : 'Pulsa para cambiar personajes'}
								</p>
							</div>
						</div>
						<div className={`p-2 rounded-full transition-transform duration-300 ${isPersonajeOpen ? 'rotate-180 bg-purple-500 text-white' : 'bg-white text-gray-300'}`}>
							<ChevronDown size={20} />
						</div>
					</div>

					{/* Selected character chips (removable) */}
					{(formData.personajes?.length || 0) > 0 && (
						<div className="flex flex-wrap gap-2 animate-in fade-in duration-200">
							{formData.personajes.map((charName, idx) => (
								<div
									key={idx}
									className="flex items-center gap-1.5 pl-2 pr-1 py-1 bg-purple-100 rounded-full border border-purple-200"
								>
									<span className="text-xs font-black text-purple-700">{charName}</span>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											setFormData({
												...formData,
												personajes: formData.personajes.filter((_, i) => i !== idx),
											});
										}}
										className="w-5 h-5 rounded-full bg-purple-200 hover:bg-purple-300 flex items-center justify-center transition-colors"
									>
										<X size={12} className="text-purple-600" />
									</button>
								</div>
							))}
						</div>
					)}

					{/* Collapsible Picker */}
					{isPersonajeOpen && (
						<div className="p-5 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in slide-in-from-top-4 duration-300">
							{/* Opción Ninguno (clear all) */}
							<div
								onClick={() => {
									setFormData({ ...formData, personajes: [] });
									setIsPersonajeOpen(false);
								}}
								className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer bg-white ${
									(formData.personajes?.length || 0) === 0 ? 'border-purple-500' : 'border-transparent hover:border-purple-200'
								}`}
							>
								<div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300">
									<X size={18} />
								</div>
								<span className="text-xs font-black text-text-black">Ninguno</span>
							</div>
							{config?.characters?.map((char, idx) => {
								const name = char.nombre || char.name;
								const isSelected = (formData.personajes || []).includes(name);
								return (
									<div
										key={idx}
										onClick={() => {
											const current = formData.personajes || [];
											if (isSelected) {
												// Remove
												setFormData({
													...formData,
													personajes: current.filter(n => n !== name),
												});
											} else {
												// Add (max 3)
												if (current.length >= 3) {
													toast('Máximo 3 personajes');
													return;
												}
												setFormData({
													...formData,
													personajes: [...current, name],
												});
											}
											// Keep picker open on selection
										}}
										className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer bg-white ${
											isSelected ? 'border-purple-500' : 'border-transparent hover:border-purple-200'
										}`}
									>
										<div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-gray-100">
											{char.imageUrl || char.image ? (
												<img src={char.imageUrl || char.image} className="w-full h-full object-cover" alt="" />
											) : (
												<div className="w-full h-full flex items-center justify-center text-gray-100">
													<Smile size={16} />
												</div>
											)}
										</div>
										<span className="text-xs font-black text-text-black truncate">{name}</span>
										{isSelected && (
											<div className="ml-auto w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
												<Check size={12} className="text-white" />
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}

					{/* Dynamic price display */}
					{(formData.personajes?.length || 0) > 0 && (
						<div className="flex justify-end animate-in fade-in duration-200">
							{formData.personajes.length === 3 ? (
								<span className="text-sm font-black text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100">
									Pack 3: {config?.preciosExtras?.precioPack3Personajes || 100}€
								</span>
							) : (
								<span className="text-sm font-black text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100">
									{(formData.personajes.length || 0)}×{config?.preciosExtras?.personaje || 40}€ = {(formData.personajes.length || 0) * (config?.preciosExtras?.personaje || 40)}€
								</span>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Piñata */}
			<div className="pt-2">
				<div
					onClick={() => setFormData({ ...formData, pinata: !formData.pinata })}
					className={`p-6 rounded-[32px] border-2 transition-all cursor-pointer flex items-center justify-between group overflow-hidden relative ${
						formData.pinata
							? 'bg-energy-orange/5 border-energy-orange shadow-md'
							: 'bg-gray-50 border-gray-100 grayscale hover:grayscale-0 hover:bg-white hover:border-energy-orange/30'
					}`}
				>
					<div className="flex items-center gap-5 relative z-10">
						<div
							className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${formData.pinata ? 'bg-energy-orange text-white shadow-lg' : 'bg-gray-200 text-gray-400 group-hover:bg-energy-orange/10 group-hover:text-energy-orange'}`}
						>
							<Package size={28} />
						</div>
						<div>
							<p className={`font-display font-black text-xl ${formData.pinata ? 'text-text-black' : 'text-gray-400'}`}>Piñata de Neverland</p>
							<p className="text-xs font-bold text-gray-400">
								{formData.pinata ? 'Servicio especial incluido' : 'Toca para añadir al banquete'}
							</p>
						</div>
					</div>
					<div
						className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all relative z-10 ${formData.pinata ? 'border-energy-orange bg-energy-orange text-white' : 'border-gray-200 bg-white text-transparent'}`}
					>
						<Check size={20} strokeWidth={3} />
					</div>
				</div>
			</div>

			<div className="flex gap-3 pt-6 border-t border-gray-100">
				<button
					onClick={() => {
						const { precioTallerApplied, precioPersonajeApplied, precioPinataApplied, ...cleanExtras } = formData;
						onSave(cleanExtras);
					}}
					className="flex-1 py-4 bg-neverland-green text-white rounded-2xl font-black text-sm shadow-lg shadow-neverland-green/20 transition-all active:scale-95"
				>
					Guardar Cambios
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

// Sub-component for Observations Edit
const ObservationsEdit = ({ current, currentCostoExtra, isAdmin, onCancel, onSave }) => {
	const [obs, setObs] = useState(current || '');
	const [costoExtraStr, setCostoExtraStr] = useState(
		currentCostoExtra !== undefined && currentCostoExtra !== null
			? String(currentCostoExtra)
			: '0'
	);

	return (
		<div className="space-y-8 pb-4">
			<div className="space-y-6">
				<div className="space-y-3">
					<h5 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] border-b border-blue-50 pb-3 flex items-center gap-2">
						<MessageSquare size={14} />
						Observaciones
					</h5>
					<div className="relative group">
						<textarea
							value={obs}
							onChange={(e) => setObs(e.target.value.substring(0, 500))}
							maxLength={500}
							className="w-full bg-gray-50 border-2 border-gray-100 rounded-[32px] p-6 text-sm font-bold text-text-black placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-100 focus:bg-white transition-all resize-none min-h-[180px]"
							placeholder="Decoración, peticiones especiales, etc..."
						/>
						<div className="absolute bottom-4 right-6">
							<span className={`text-[10px] font-black uppercase tracking-widest ${obs.length > 450 ? 'text-red-400' : 'text-gray-300'}`}>
								{obs.length}/500
							</span>
						</div>
					</div>
				</div>

				{/* Costo Extra / Descuento — solo admins */}
				{isAdmin && (
					<div className="space-y-4">
						<h5 className="text-[10px] font-black text-energy-orange uppercase tracking-[0.2em] border-b border-orange-50 pb-3 flex items-center gap-2">
							<Receipt size={14} />
							Costo Extra / Descuento
						</h5>
						<div className="p-6 bg-orange-50/30 border-2 border-orange-100/50 rounded-[32px] space-y-4">
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-energy-orange border border-orange-100">
									<Receipt size={24} />
								</div>
								<div>
									<p className="font-display font-black text-base text-text-black">Extra / Descuento</p>
									<p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Solo visible para administración</p>
								</div>
							</div>

							<div className="flex items-center gap-4">
								<div className="relative flex-1 max-w-[200px]">
									<span className="absolute left-6 top-1/2 -translate-y-1/2 text-energy-orange font-black text-2xl">€</span>
									<input
										type="text"
										inputMode="decimal"
										value={costoExtraStr}
										onChange={(e) => {
											const raw = e.target.value;
											if (raw === '' || raw === '-' || /^-?\d{0,3}$/.test(raw)) {
												setCostoExtraStr(raw);
											}
										}}
										onBlur={() => {
											if (costoExtraStr === '' || costoExtraStr === '-') setCostoExtraStr('0');
										}}
										className="w-full pl-12 pr-6 py-5 bg-white border-2 border-orange-100 focus:border-energy-orange rounded-2xl font-black text-2xl text-energy-orange outline-none transition-all shadow-sm focus:shadow-md"
									/>
								</div>
								<div className="flex-1">
									<p className="text-[10px] font-bold text-gray-400 italic leading-snug">
										Usa el signo <span className="text-energy-orange font-black">-</span> para aplicar descuentos. 
										Este valor se suma o resta directamente al total final.
									</p>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			<div className="flex gap-3 pt-6 border-t border-gray-100">
				<button
					onClick={() => {
						const parsed = parseInt(costoExtraStr) || 0;
						const clamped = Math.max(-999, Math.min(999, parsed));
						onSave(obs, clamped);
					}}
					className="flex-1 py-4 bg-neverland-green text-white rounded-2xl font-black text-sm shadow-lg shadow-neverland-green/20 transition-all active:scale-95"
				>
					Guardar Cambios
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

const getInitialPhoneData = (fullPhone) => {
	if (!fullPhone) return { prefix: '+34', phone: '' };
	const PREFIXES = ['+34', '+1', '+44', '+33', '+49', '+39', '+351', '+41'];
	const foundPrefix = PREFIXES.find((p) => fullPhone.startsWith(p));
	if (foundPrefix) {
		return {
			prefix: foundPrefix,
			phone: fullPhone.slice(foundPrefix.length).trim(),
		};
	}
	return { prefix: '+34', phone: fullPhone };
};

// Sub-component for Client Info Edit
const ClientInfoEdit = ({ current, onCancel, onSave }) => {
	const [formData, setFormData] = useState({ ...current });
	const [phoneState, setPhoneState] = useState(() =>
		getInitialPhoneData(current?.telefono),
	);

	const isSaveDisabled = 
		!String(formData.nombreNiño || '').trim() || 
		!String(formData.nombrePadre || '').trim() || 
		!String(formData.telefono || '').trim() || 
		!String(formData.email || '').trim();

	const handlePrefixChange = (newPrefix) => {
		setPhoneState((prev) => ({ ...prev, prefix: newPrefix }));
		setFormData({
			...formData,
			telefono: `${newPrefix} ${phoneState.phone}`,
		});
	};

	const handlePhoneChange = (newPhone) => {
		setPhoneState((prev) => ({ ...prev, phone: newPhone }));
		setFormData({
			...formData,
			telefono: `${phoneState.prefix} ${newPhone}`,
		});
	};

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
						maxLength={100}
						onChange={(e) =>
							setFormData({
								...formData,
								nombreNiño: e.target.value.substring(0, 100),
							})
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
						max="99"
						onChange={(e) => {
							const val = Math.min(99, parseInt(e.target.value) || 0);
							setFormData({ ...formData, edadNiño: val });
						}}
						className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-neverland-green/10 focus:border-neverland-green outline-none transition-all"
					/>
				</div>
				<div className="space-y-2 sm:col-span-2">
					<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
						Nombre del Padre/Madre
					</label>
					<input
						type="text"
						value={formData.nombrePadre}
						maxLength={100}
						onChange={(e) =>
							setFormData({
								...formData,
								nombrePadre: e.target.value.substring(0, 100),
							})
						}
						className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-neverland-green/10 focus:border-neverland-green outline-none transition-all"
					/>
				</div>
				<div className="space-y-2">
					<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
						Teléfono
					</label>
					<div className="flex items-center gap-2 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus-within:ring-4 focus-within:ring-neverland-green/10 focus-within:border-neverland-green transition-all">
						<input
							type="text"
							value={phoneState.prefix}
							onChange={(e) => {
								let val = e.target.value;
								if (!val.startsWith('+')) val = '+' + val.replace(/^\+/, '');
								if (val.length > 5) return;
								if (!/^\+[\d]*$/.test(val)) return;
								handlePrefixChange(val);
							}}
							className="w-14 bg-transparent font-bold text-gray-700 outline-none text-center border-r border-gray-200 pr-2"
						/>
						<input
							type="tel"
							value={phoneState.phone}
							onChange={(e) => {
								const val = e.target.value;
								if (/^[\d\s]*$/.test(val)) {
									if (val.replace(/\s/g, '').length > 15) return;
									handlePhoneChange(val);
								}
							}}
							className="flex-1 w-full bg-transparent font-bold outline-none"
							placeholder="600 000 000"
						/>
					</div>
				</div>
				<div className="space-y-2">
					<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
						Email de contacto
					</label>
					<input
						type="email"
						value={formData.email || ''}
						maxLength={100}
						onChange={(e) =>
							setFormData({
								...formData,
								email: e.target.value.substring(0, 100),
							})
						}
						className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-neverland-green/10 focus:border-neverland-green outline-none transition-all"
						placeholder="ejemplo@email.com"
					/>
				</div>
			</div>

			<div className="flex gap-3 pt-4 border-t border-gray-100">
				<button
					disabled={isSaveDisabled}
					onClick={() => onSave(formData)}
					className={`flex-1 py-4 text-white rounded-2xl font-black text-sm transition-all active:scale-95 ${isSaveDisabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-neverland-green shadow-lg shadow-neverland-green/20'}`}
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
