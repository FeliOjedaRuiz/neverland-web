import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit3, User, Phone, Mail, Check, X, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { eliminarInscripcion, editarInscripcion } from '../../services/api';
import ConfirmModal from './ConfirmModal';

const InscripcionesList = ({ inscripciones = [], aforo = 0, tallerId, onRefresh }) => {
	const capacidad = aforo || 1;
	const progress = Math.min((inscripciones.length / capacidad) * 100, 100);
	const progressColor =
		progress >= 100 ? 'bg-red-500' : progress >= 80 ? 'bg-energy-orange' : 'bg-neverland-green';

	const [editingId, setEditingId] = useState(null);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [deleting, setDeleting] = useState(false);
	const [saving, setSaving] = useState(false);
	const [editForm, setEditForm] = useState({});

	// ── Iniciar edición ──
	const startEdit = (insc) => {
		setEditingId(insc._id);
		setEditForm({
			nombreNiño: insc.nombreNiño || '',
			edadNiño: insc.edadNiño || '',
			nombreResponsable: insc.nombreResponsable || '',
			telefonoResponsable: insc.telefonoResponsable || '',
			emailResponsable: insc.emailResponsable || '',
		});
	};

	const cancelEdit = () => { setEditingId(null); setEditForm({}); };

	// ── Guardar edición ──
	const handleSave = async (inscId) => {
		setSaving(true);
		try {
			await editarInscripcion(tallerId, inscId, editForm);
			toast.success('Inscripción actualizada');
			setEditingId(null);
			onRefresh();
		} catch (err) {
			toast.error('Error al guardar cambios');
		} finally { setSaving(false); }
	};

	// ── Eliminar ──
	const handleDeleteConfirm = async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await eliminarInscripcion(tallerId, deleteTarget);
			toast.success('Inscripción eliminada');
			setDeleteTarget(null);
			onRefresh();
		} catch (err) {
			toast.error('Error al eliminar');
		} finally { setDeleting(false); }
	};

	// ── WhatsApp link ──
	const whatsappLink = (phone) => {
		const cleaned = String(phone || '').replace(/\D/g, '');
		return `https://wa.me/${cleaned}`;
	};

	return (
		<div>
			{/* Barra de progreso */}
			{inscripciones.length > 0 && (
				<div className="flex items-center gap-3 mb-5">
					<div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
						<div className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor}`}
							style={{ width: `${Math.min(progress, 100)}%` }} />
					</div>
					<span className="text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">
						{inscripciones.length}/{aforo}
					</span>
				</div>
			)}

			{/* Estado vacío */}
			{inscripciones.length === 0 ? (
				<div className="text-center py-12 bg-gray-50/50 rounded-[24px] border border-dashed border-gray-200">
					<div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
						<User size={20} className="text-gray-300" />
					</div>
					<p className="font-display font-bold text-sm text-gray-400">No hay niños inscritos aún</p>
					<p className="text-[10px] text-gray-300 font-medium mt-1">Los inscritos aparecerán aquí cuando alguien reserve</p>
				</div>
			) : (
				<div className="space-y-2">
					{inscripciones.map((insc, idx) => {
						const isEditing = editingId === insc._id;
						return (
							<motion.div
								key={insc._id || idx}
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: idx * 0.03 }}
								className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all overflow-hidden"
							>
								<AnimatePresence mode="wait">
									{isEditing ? (
										/* ── Modo edición ── */
										<motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
											className="p-3 space-y-2">
											<div className="flex gap-2">
												<input type="text" value={editForm.nombreNiño}
													onChange={(e) => setEditForm((p) => ({ ...p, nombreNiño: e.target.value }))}
													placeholder="Nombre del niño"
													className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:border-neverland-green min-text-[16px]" />
												<input type="number" value={editForm.edadNiño}
													onChange={(e) => setEditForm((p) => ({ ...p, edadNiño: e.target.value }))}
													placeholder="Edad"
													className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:border-neverland-green min-text-[16px]" />
											</div>
											<input type="text" value={editForm.nombreResponsable}
												onChange={(e) => setEditForm((p) => ({ ...p, nombreResponsable: e.target.value }))}
												placeholder="Responsable"
												className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:border-neverland-green min-text-[16px]" />
											<input type="tel" value={editForm.telefonoResponsable}
												onChange={(e) => setEditForm((p) => ({ ...p, telefonoResponsable: e.target.value }))}
												placeholder="Teléfono"
												className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:border-neverland-green min-text-[16px]" />
											<input type="email" value={editForm.emailResponsable}
												onChange={(e) => setEditForm((p) => ({ ...p, emailResponsable: e.target.value }))}
												placeholder="Email"
												className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:border-neverland-green min-text-[16px]" />
											<div className="flex justify-end gap-1.5 pt-1">
												<button onClick={cancelEdit}
													className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
													<X size={14} />
												</button>
												<button onClick={() => handleSave(insc._id)} disabled={saving}
													className="p-1.5 text-neverland-green hover:bg-green-50 rounded-lg transition-all disabled:opacity-50">
													<Check size={14} />
												</button>
											</div>
										</motion.div>
									) : (
										/* ── Modo vista ── */
										<motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
											className="p-3">
											{/* Header: nombre + edad + acciones */}
											<div className="flex items-center justify-between gap-2 mb-1.5">
												<div className="flex items-center gap-1.5 min-w-0">
													<User size={14} className="text-gray-300 shrink-0" />
													<span className="font-display font-black text-sm text-text-black truncate">{insc.nombreNiño}</span>
													{insc.edadNiño && <span className="text-[10px] text-gray-400 font-bold shrink-0">{insc.edadNiño} a.</span>}
												</div>
												<div className="flex items-center gap-0.5 shrink-0">
													<button onClick={() => startEdit(insc)}
														className="p-1.5 text-gray-300 hover:text-neverland-green hover:bg-green-50 rounded-lg transition-all"
														title="Editar inscripción">
														<Edit3 size={13} />
													</button>
													<button onClick={() => setDeleteTarget(insc._id)}
														className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
														title="Eliminar inscripción">
														<Trash2 size={13} />
													</button>
												</div>
											</div>

											{/* Info rows — compactas */}
											<div className="space-y-0.5 pl-5">
												<div className="flex items-center gap-1.5 text-[11px] text-gray-500">
													<User size={10} className="shrink-0 text-gray-300" />
													<span className="font-medium truncate">{insc.nombreResponsable}</span>
													<span className="text-gray-200 select-none">·</span>
													<Mail size={10} className="shrink-0 text-gray-300" />
													<span className="font-medium truncate">{insc.emailResponsable}</span>
												</div>
												<a href={whatsappLink(insc.telefonoResponsable)} target="_blank" rel="noopener noreferrer"
													onClick={(e) => e.stopPropagation()}
													className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-green-600 transition-colors group/wa">
													<Phone size={10} className="shrink-0 text-gray-300 group-hover/wa:text-green-500 transition-colors" />
													<span className="font-medium">{insc.telefonoResponsable}</span>
													<MessageCircle size={10} className="text-green-500 opacity-50 group-hover/wa:opacity-100 transition-opacity" />
												</a>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						);
					})}
				</div>
			)}

			{/* Confirmación de eliminación */}
			<ConfirmModal
				isOpen={deleteTarget !== null}
				onClose={() => setDeleteTarget(null)}
				onConfirm={handleDeleteConfirm}
				title="Eliminar inscripción"
				message="¿Estás seguro de que quieres eliminar esta inscripción? Esta acción no se puede deshacer."
				confirmText={deleting ? 'Eliminando...' : 'Eliminar'}
				isLoading={deleting}
			/>
		</div>
	);
};

export default InscripcionesList;
