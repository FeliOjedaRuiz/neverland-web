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
} from 'lucide-react';
import { updateReservation, deleteReservation } from '../../services/api';

const ReservationDetailView = ({ reservation: initialReservation, onBack }) => {
	const [reservation, setReservation] = useState(initialReservation);
	const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	if (!reservation) return null;

	const handleStatusChange = async (newStatus) => {
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

	const formatDate = (dateString) => {
		const options = {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		};
		return new Date(dateString).toLocaleDateString('es-ES', options);
	};

	const getTurnoLabel = (t) => {
		if (t === 'T1') return '17:00 - 19:00';
		if (t === 'T2') return '18:00 - 20:00';
		if (t === 'T3') return '19:15 - 21:15';
		return t;
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
			<div className="flex items-center gap-4 p-6 bg-neverland-green text-white shrink-0 shadow-md relative z-20">
				<button
					onClick={onBack}
					className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
				>
					<ChevronLeft size={24} />
				</button>
				<div>
					<h2 className="text-xl font-display font-black">
						Detalles de la Reserva
					</h2>
					<p className="text-white/70 text-[10px] font-black uppercase tracking-wider">
						ID: {reservation.id?.substring(0, 8)}...
					</p>
				</div>
				<div className="ml-auto relative">
					<button
						onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
						disabled={isUpdating}
						className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 transition-all active:scale-95 ${
							reservation.estado === 'confirmado' ||
							reservation.estado === 'confirmada'
								? 'bg-white/20 text-white border border-white/30'
								: reservation.estado === 'pendiente' ||
									  reservation.estado === 'solicitado'
									? 'bg-yellow-400 text-yellow-900 shadow-sm'
									: 'bg-white/10 text-white'
						}`}
					>
						{isUpdating ? (
							<Loader2 size={12} className="animate-spin" />
						) : (
							reservation.estado
						)}
						<ChevronDown
							size={14}
							className={`transition-transform duration-200 ${isStatusMenuOpen ? 'rotate-180' : ''}`}
						/>
					</button>

					{isStatusMenuOpen && (
						<div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden z-30">
							<p className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
								Cambiar Estado
							</p>
							<button
								onClick={() => handleStatusChange('confirmado')}
								className="w-full text-left px-4 py-3 text-sm font-bold text-neverland-green hover:bg-neverland-green/5 flex items-center justify-between group"
							>
								Confirmar
								<Check
									size={16}
									className="opacity-0 group-hover:opacity-100 transition-opacity"
								/>
							</button>
							<button
								onClick={() => handleStatusChange('pendiente')}
								className="w-full text-left px-4 py-3 text-sm font-bold text-yellow-600 hover:bg-yellow-50 flex items-center justify-between group"
							>
								Pendiente
								<Clock
									size={16}
									className="opacity-0 group-hover:opacity-100 transition-opacity"
								/>
							</button>
							<button
								onClick={() => handleStatusChange('cancelado')}
								className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 flex items-center justify-between group"
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

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/30">
				{/* Client Info */}
				<section className="space-y-4 max-w-3xl mx-auto">
					<h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
						<User size={14} /> Información del Cliente
					</h4>
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
						</div>
					</div>
				</section>

				{/* Date & Time */}
				<section className="space-y-4 max-w-3xl mx-auto">
					<h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
						<Calendar size={14} /> Fecha y Horario
					</h4>
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
									{reservation.turno} ({getTurnoLabel(reservation.turno)})
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
					<h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
						<Utensils size={14} /> Menús y Asistencia
					</h4>
					<div className="space-y-3">
						<div className="flex justify-between items-center p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
							<div className="flex items-center gap-3">
								<Smile className="text-neverland-green" size={20} />
								<span className="font-bold text-text-black">
									Niños ({reservation.detalles?.niños?.cantidad})
								</span>
							</div>
							<span className="bg-neverland-green/10 text-neverland-green px-4 py-1.5 rounded-full text-xs font-black uppercase">
								Menú {reservation.detalles?.niños?.menuId}
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
								{reservation.detalles?.adultos?.comida?.length > 0 ? (
									reservation.detalles.adultos.comida.map((item, idx) => (
										<div
											key={idx}
											className="flex justify-between p-2 bg-gray-50 rounded-xl text-sm text-gray-600 font-medium"
										>
											<span>{item.item}</span>
											<span className="font-black text-text-black">
												x{item.cantidad}
											</span>
										</div>
									))
								) : (
									<p className="text-xs text-gray-400 italic">
										No se solicitó comida de adultos
									</p>
								)}
							</div>
						</div>
					</div>
				</section>

				{/* Extras */}
				<section className="space-y-4 max-w-3xl mx-auto">
					<h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
						<Sparkles size={14} /> Extras y Talleres
					</h4>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div
							className={`p-4 rounded-3xl border flex flex-col items-center gap-1 transition-all ${reservation.detalles?.extras?.taller !== 'ninguno' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-300 opacity-60'}`}
						>
							<Sparkles size={20} />
							<span className="text-[10px] font-black uppercase">Taller</span>
							<span className="text-xs font-bold text-center capitalize">
								{reservation.detalles?.extras?.taller === 'ninguno'
									? 'Sin taller'
									: reservation.detalles?.extras?.taller}
							</span>
						</div>
						<div
							className={`p-4 rounded-3xl border flex flex-col items-center gap-1 transition-all ${reservation.detalles?.extras?.personaje !== 'ninguno' ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-gray-50 border-gray-100 text-gray-300 opacity-60'}`}
						>
							<Smile size={20} />
							<span className="text-[10px] font-black uppercase">
								Personaje
							</span>
							<span className="text-xs font-bold text-center capitalize">
								{reservation.detalles?.extras?.personaje === 'ninguno'
									? 'Sin personaje'
									: reservation.detalles?.extras?.personaje}
							</span>
						</div>
						<div
							className={`p-4 rounded-3xl border flex flex-col items-center gap-1 transition-all ${reservation.detalles?.extras?.pinata ? 'bg-energy-orange/5 border-energy-orange/20 text-energy-orange shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-300 opacity-60'}`}
						>
							<Package size={20} />
							<span className="text-[10px] font-black uppercase">Piñata</span>
							<span className="text-xs font-bold text-center">
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
				<div className="flex gap-2">
					<button
						onClick={() => window.print()}
						className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-text-black rounded-2xl font-black text-sm transition-all active:scale-95"
					>
						Imprimir
					</button>
				</div>
			</div>
		</div>
	);
};

export default ReservationDetailView;
