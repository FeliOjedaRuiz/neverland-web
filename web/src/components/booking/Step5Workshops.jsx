import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Image as ImageIcon, X, ZoomIn, Plus } from 'lucide-react';
import { sumarPrecioTalleres, obtenerPrecioTaller, esGrupoGrande } from '../../utils/bookingUtils';

const Step5Workshops = ({
	formData,
	setFormData,
	WORKSHOPS,
	prices = { preciosExtras: { tallerBase: 25, tallerPlus: 30 } },
}) => {
	const [selectedWorkshopForModal, setSelectedWorkshopForModal] = useState(null);
	const [toastMessage, setToastMessage] = useState(null);

	const selectedTalleres = formData.extras?.talleres || [];
	const ninosCount = formData.niños?.cantidad || 0;

	const filteredWorkshops = useMemo(
		() => (WORKSHOPS || []).filter((ws) => !ws.suspended && ws.active !== false),
		[WORKSHOPS]
	);

	// Sync with browser history for mobile "back" button
	useEffect(() => {
		const handlePopState = () => {
			if (selectedWorkshopForModal) {
				setSelectedWorkshopForModal(null);
			}
		};

		if (selectedWorkshopForModal) {
			window.history.pushState(null, '', '');
			window.addEventListener('popstate', handlePopState);
		}

		return () => {
			window.removeEventListener('popstate', handlePopState);
		};
	}, [selectedWorkshopForModal]);

	// El toast se cierra automáticamente
	useEffect(() => {
		if (toastMessage) {
			const timer = setTimeout(() => {
				try {
					setToastMessage(null);
				} catch (err) {
					console.error('Error al cerrar el toast:', err);
				}
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [toastMessage]);

	const openModal = (workshop) => {
		try {
			setSelectedWorkshopForModal(workshop);
		} catch (err) {
			console.error('Error al abrir el modal:', err);
		}
	};
	const closeModal = () => {
		try {
			if (selectedWorkshopForModal) {
				setSelectedWorkshopForModal(null);
				window.history.back();
			}
		} catch (err) {
			console.error('Error al cerrar el modal:', err);
		}
	};

	const selectWorkshop = (name) => {
		try {
			const current = formData.extras?.talleres || [];
			let nextTalleres = current;

			if (current.includes(name)) {
				// Deseleccionar: quitar del array
				nextTalleres = current.filter((t) => t !== name);
			} else {
				// Seleccionar: añadir solo si < 3
				if (current.length >= 3) {
					setToastMessage('El máximo es 3 actividades');
					if (selectedWorkshopForModal) closeModal();
					return;
				}
				nextTalleres = [...current, name];
			}

			setFormData({
				...formData,
				extras: { ...formData.extras, talleres: nextTalleres },
			});

			if (selectedWorkshopForModal) closeModal();
		} catch (err) {
			console.error('Error al actualizar actividades:', err);
		}
	};

	const clearAllWorkshops = () => {
		try {
			setFormData({
				...formData,
				extras: { ...formData.extras, talleres: [] },
			});
		} catch (err) {
			console.error('Error al limpiar actividades:', err);
		}
	};

	const showAccionEliminar = selectedTalleres.length >= 1;
	const etiquetaEliminar = selectedTalleres.length === 1 ? 'Quitar actividad' : 'Quitar todas';
	const totalWorkshopsPrice = sumarPrecioTalleres(
		selectedTalleres,
		filteredWorkshops,
		ninosCount,
		prices.preciosExtras
	);

	return (
		<div className="relative">
			<h2 className="text-xl font-display font-bold text-text-black text-center mb-4">
				Actividades
			</h2>

			<div className="mb-6">
				{/* Tarjeta "Sin actividad" separada en la parte superior */}
				{showAccionEliminar ? (
					<motion.button
						type="button"
						whileHover={{ y: -2 }}
						whileTap={{ scale: 0.98 }}
						onClick={clearAllWorkshops}
						aria-label={selectedTalleres.length === 1 ? 'Quitar actividad seleccionada' : 'Quitar todas las actividades'}
						className="w-full p-4 rounded-3xl border-2 transition-all flex items-center justify-between px-6 border-white bg-white shadow-sm hover:border-gray-200"
					>
						<div className="flex items-center gap-4">
							<div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-gray-300">
								<X size={20} />
							</div>
							<div className="flex flex-col">
								<span className="font-black text-sm uppercase tracking-wide text-gray-400">
									{etiquetaEliminar}
								</span>
							</div>
						</div>
					</motion.button>
				) : (
					<div
						aria-disabled="true"
						className="p-4 rounded-3xl border-2 transition-all flex items-center justify-between px-6 border-gray-400 bg-gray-100 shadow-inner"
					>
						<div className="flex items-center gap-4">
							<div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 text-gray-400">
								<X size={20} />
							</div>
							<div className="flex flex-col">
								<span className="font-black text-sm uppercase tracking-wide text-gray-600">
									Sin actividad
								</span>
							</div>
					</div>
				</div>
				)}
			</div>

			{/* Precio dinámico de las actividades seleccionadas */}
			{selectedTalleres.length > 0 && (
				<div className="mb-4 px-4 py-3 text-center border border-blue-100 rounded-2xl bg-blue-50/50 shadow-sm">
					<div className="flex items-center justify-center gap-2 flex-wrap">
					{selectedTalleres.map((name) => {
						return (
							<span
								key={name}
								className="inline-flex items-center gap-1.5 bg-white text-rec-blue px-2.5 py-1 rounded-xl text-xs font-black shadow-sm border border-blue-100"
							>
								{name}
							</span>
						);
					})}
						<span className="font-black text-rec-blue text-base sm:text-lg">
							{totalWorkshopsPrice}€
						</span>
					</div>
				</div>
			)}

			<div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
				{/* Talleres disponibles */}
				{[...filteredWorkshops].reverse().map((workshop) => {
					const isSelected = selectedTalleres.includes(workshop.name);
					const price = obtenerPrecioTaller(workshop, ninosCount);

					return (
						<motion.div
							key={workshop.id}
							className={`group relative overflow-hidden rounded-2xl border-2 transition-all flex flex-col ${
								isSelected
									? 'border-rec-blue bg-blue-50/30 shadow-lg shadow-blue-500/10'
									: 'border-white bg-white shadow-sm hover:shadow-md'
							}`}
						>
							<motion.button
								type="button"
							whileHover={{ y: -4 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => selectWorkshop(workshop.name)}
							aria-pressed={isSelected}
								aria-label={isSelected ? `Quitar ${workshop.name}` : `Añadir ${workshop.name}`}
								className="w-full text-left flex flex-col"
							>
								{/* Contenedor de imagen cuadrada */}
								<div className="aspect-square w-full bg-gray-50 relative overflow-hidden">
									{workshop.imageUrl ? (
										<img
											src={workshop.imageUrl}
											alt={workshop.name}
											className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
										/>
									) : (
										<div className="w-full h-full flex flex-col items-center justify-center text-gray-200 gap-1">
											<ImageIcon size={24} strokeWidth={1.5} />
											<span className="text-[8px] font-black uppercase tracking-widest opacity-50">Taller</span>
										</div>
									)}

									{/* Capa de selección */}
									{isSelected && (
										<div className="absolute inset-0 bg-rec-blue/20 backdrop-blur-[1px] flex items-center justify-center">
											<CheckCircle size={32} className="text-white drop-shadow-md" fill="currentColor" stroke="#4b8cc8" />
										</div>
									)}
								</div>

								<div className="p-3 flex flex-col justify-between flex-1">
									<h3 className={`font-black text-xs sm:text-sm leading-tight mb-1 line-clamp-2 ${isSelected ? 'text-rec-blue' : 'text-gray-800'}`}>
										{workshop.name}
									</h3>
									<p className="font-black text-sm text-rec-blue">
										{price}€
									</p>
								</div>
							</motion.button>

							{/* Botón de detalle: abre el modal de forma independiente */}
							<button
							type="button"
							onClick={() => openModal(workshop)}
							aria-label={`Ver detalles de ${workshop.name}`}
								className="absolute bottom-2 right-2 bg-white/90 p-1.5 rounded-full shadow-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity transform sm:translate-y-2 sm:group-hover:translate-y-0 z-10"
							>
								<ZoomIn size={14} className="text-rec-blue" />
							</button>
						</motion.div>
					);
				})}
			</div>

			{/* Mensaje de toast */}
			<AnimatePresence>
				{toastMessage && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 20 }}
						className="fixed inset-x-4 bottom-24 sm:bottom-4 mx-auto max-w-sm bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl z-[1001]"
						role="alert"
					>
						<p className="text-sm font-bold text-center">{toastMessage}</p>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Modal de detalle */}
			<AnimatePresence>
				{selectedWorkshopForModal && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed top-16 md:top-20 inset-x-0 bottom-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
						onClick={closeModal}
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0, y: 20 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							exit={{ scale: 0.9, opacity: 0, y: 20 }}
							className="bg-white rounded-[32px] overflow-hidden w-full max-w-sm sm:max-w-md shadow-2xl relative max-h-[90dvh] flex flex-col"
							onClick={(e) => e.stopPropagation()}
						>
							<button 
								onClick={closeModal}
								className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/90 text-gray-900 shadow-xl flex items-center justify-center active:scale-90 border border-gray-100"
							>
								<X size={20} strokeWidth={3} />
							</button>

							<div className="overflow-y-auto no-scrollbar">
								<div className="w-full bg-gray-100 relative flex items-center justify-center overflow-hidden shrink-0 min-h-[200px] max-h-[50dvh]">
									{selectedWorkshopForModal.imageUrl ? (
										<img 
											src={selectedWorkshopForModal.imageUrl} 
											alt={selectedWorkshopForModal.name} 
											className="w-full h-auto max-h-[50dvh] object-contain block mx-auto"
										/>
									) : (
										<div className="w-full h-48 flex items-center justify-center text-gray-300">
											<ImageIcon size={48} strokeWidth={1} />
										</div>
									)}
									<div className="absolute bottom-3 right-3 bg-rec-blue text-white px-3.5 py-1.5 rounded-2xl font-black text-base shadow-lg z-10">
										{obtenerPrecioTaller(selectedWorkshopForModal, ninosCount)}€
									</div>
								</div>

								<div className="p-4 sm:p-5">
									<h3 className="text-lg sm:text-xl font-display font-black text-text-black mb-0.5">
										{selectedWorkshopForModal.name}
									</h3>
									<div className="flex items-center gap-2 mb-2 sm:mb-2.5">
										<div className="h-1 w-4 rounded-full bg-rec-blue" />
										<span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
											Descripción del Taller
										</span>
									</div>

									<p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3 sm:mb-4 font-medium">
										{selectedWorkshopForModal.desc}
									</p>

									{esGrupoGrande(ninosCount) &&
										selectedWorkshopForModal.pricePlus > selectedWorkshopForModal.priceBase && (
										<div className="bg-blue-50/50 p-2.5 sm:p-3 rounded-2xl border border-blue-100 mb-3 sm:mb-4 flex items-center gap-3">
											<div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
												<Plus size={12} className="text-rec-blue" />
											</div>
											<p className="text-[10px] sm:text-[11px] font-bold text-rec-blue leading-tight">
												Este taller incluye un suplemento por grupo de más de 15 niños.
											</p>
										</div>
									)}

									<button
										onClick={() => selectWorkshop(selectedWorkshopForModal.name)}
										aria-label={selectedTalleres.includes(selectedWorkshopForModal.name) ? 'Quitar actividad' : 'Añadir actividad'}
										className="w-full py-3 sm:py-3.5 bg-rec-blue hover:bg-rec-blue/90 text-white rounded-2xl font-black shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-base"
									>
										{selectedTalleres.includes(selectedWorkshopForModal.name) ? (
											<>
												<X size={20} strokeWidth={3} />
												QUITAR
											</>
										) : (
											<>
												<CheckCircle size={20} strokeWidth={3} />
												AÑADIR
											</>
										)}
									</button>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default Step5Workshops;
