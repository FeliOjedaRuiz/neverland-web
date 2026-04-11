import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Image as ImageIcon, X, ZoomIn } from 'lucide-react';
import { safeParseDate } from '../../utils/safeDate';

const Step3Kids = ({ formData, setFormData, CHILDREN_MENUS }) => {
	const [selectedMenuForModal, setSelectedMenuForModal] = useState(null);

	// Manejo del botón atrás del móvil para cerrar el modal
	const closeModal = useCallback(() => {
		setSelectedMenuForModal(null);
		if (window.history.state?.modalOpen) {
			window.history.back();
		}
	}, []);

	const openModal = (menu) => {
		setSelectedMenuForModal(menu);
		// Empujamos un estado al historial para que el botón de atrás cierre el modal
		window.history.pushState({ modalOpen: true }, '');
	};

	useEffect(() => {
		const handlePopState = () => {
			if (selectedMenuForModal) {
				setSelectedMenuForModal(null);
			}
		};

		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	}, [selectedMenuForModal]);

	return (
		<div className="relative">
			<h2 className="text-xl font-display font-bold text-text-black text-center mb-4">
				Los Protagonistas
			</h2>

			{/* Counter - Compact & Focused */}
			<motion.div
				initial={{ y: 5, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.3 }}
				className="bg-white p-4 rounded-2xl border-2 border-neverland-green shadow-lg shadow-neverland-green/5 flex justify-between items-center mb-6 shrink-0 relative overflow-hidden transition-all"
			>
				<div className="relative z-10">
					<p className="text-lg font-black text-gray-900 leading-tight">
						¿Cuántos niños?
					</p>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
						Mínimo 12 invitados
					</p>
				</div>

				<div className="flex items-center gap-3 bg-gray-50 rounded-full p-1 relative z-10 border border-neverland-green/10">
					<button
						onClick={() =>
							setFormData({
								...formData,
								niños: {
									...formData.niños,
									cantidad: Math.max(12, formData.niños.cantidad - 1),
								},
							})
						}
						className="w-8 h-8 rounded-full bg-white text-neverland-green font-black shadow-sm hover:bg-neverland-green hover:text-white active:scale-90 transition-all border border-gray-100 flex items-center justify-center text-base"
					>
						-
					</button>
					<span className="text-2xl font-black w-8 text-center text-neverland-green leading-none">
						{formData.niños.cantidad}
					</span>
					<button
						onClick={() =>
							setFormData({
								...formData,
								niños: {
									...formData.niños,
									cantidad: Math.min(50, formData.niños.cantidad + 1),
								},
							})
						}
						disabled={formData.niños.cantidad >= 50}
						className={`w-8 h-8 rounded-full font-black shadow-md hover:scale-105 active:scale-90 transition-all flex items-center justify-center text-base ${formData.niños.cantidad >= 50 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-neverland-green text-white'}`}
					>
						+
					</button>
				</div>
			</motion.div>

			{/* Alérgenos - NUEVO CAMPO */}
			<motion.div
				initial={{ y: 5, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.1 }}
				className="mb-6 px-1"
			>
				<label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 pl-1">
					<span className="flex items-center justify-center w-5 h-5 bg-orange-100 text-energy-orange rounded-full text-[10px]">
						⚠️
					</span>
					Alergias e intolerancias alimentarias
					<span className="text-[9px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full ml-1">Opcional</span>
				</label>
				<textarea
					value={formData.extras?.alergenos || ''}
					maxLength={500}
					onChange={(e) =>
						setFormData({
							...formData,
							extras: {
								...formData.extras,
								alergenos: e.target.value.substring(0, 500),
							},
						})
					}
					placeholder="Ej: 3 niños celíacos, 1 alérgico al huevo, 2 intolerantes a la lactosa... Así preparamos el menú adecuado para cada niño."
					className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl text-base font-medium focus:border-energy-orange focus:ring-4 focus:ring-energy-orange/5 outline-none transition-all resize-none min-h-[80px] placeholder:text-gray-300 shadow-sm shadow-black/5"
				/>
			</motion.div>

			<p className="text-sm font-bold text-gray-400 mb-2 px-2 flex justify-between items-center">
				<span>Elige el Menú Infantil:</span>
				{formData.fecha &&
					(() => {
						const d = safeParseDate(formData.fecha);
						return d && !isNaN(d.getTime()) && [0, 5, 6].includes(d.getDay());
					})() && (
						<span className="text-[10px] text-energy-orange bg-orange-50 px-2 py-1 rounded-lg animate-pulse">
							+1.50€ Vie a Dom
						</span>
					)}
			</p>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{CHILDREN_MENUS.map((menu) => (
					<div
						key={menu.id || menu._id}
						onClick={() => openModal(menu)}
						className={`relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer flex flex-col ${
							String(formData.niños.menuId) === String(menu.id || menu._id)
								? 'border-energy-orange bg-orange-50/30'
								: 'border-white bg-white shadow-sm hover:border-orange-100 hover:shadow-md'
						}`}
					>
						{/* Header with Image and Price */}
						<div className="p-3 flex gap-4">
							<div 
								className="group w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100/50 shadow-sm relative"
							>
								{menu.imageUrl ? (
									<img src={menu.imageUrl} alt={menu.nombre} className="w-full h-full object-cover" />
								) : (
									<div className="w-full h-full flex items-center justify-center text-gray-200">
										<ImageIcon size={24} />
									</div>
								)}
								{/* Zoom Overlay */}
								<div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
									<div className="bg-white/90 p-1.5 rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-transform">
										<ZoomIn size={14} className="text-energy-orange" />
									</div>
								</div>
								
								{String(formData.niños.menuId) === String(menu.id || menu._id) && (
									<div className="absolute inset-0 bg-energy-orange/10 flex items-center justify-center backdrop-blur-[1px]">
										<CheckCircle className="text-white" size={28} fill="currentColor" stroke="#ff7d45" />
									</div>
								)}
							</div>
							
							<div className="flex-1 min-w-0 flex flex-col justify-between py-1">
								<div className="flex justify-between items-start">
									<h4 className={`font-display font-black text-sm sm:text-base leading-tight truncate pr-2 ${String(formData.niños.menuId) === String(menu.id || menu._id) ? 'text-energy-orange' : 'text-text-black'}`}>
										{menu.nombre}
									</h4>
									<div className="flex flex-col items-end shrink-0">
										<span className={`font-black text-base ${String(formData.niños.menuId) === String(menu.id || menu._id) ? 'text-energy-orange' : 'text-text-black'}`}>
											{menu.precio}€
										</span>
									</div>
								</div>

								{/* Principal Dish Highlight */}
								<div className="bg-gray-50/80 px-2 py-1 rounded-lg border border-gray-100/50">
									<p className="text-[10px] font-bold text-gray-600 line-clamp-1">
										<span className="text-energy-orange/60 font-black uppercase text-[8px] mr-1">Taller</span>
										{menu.principal}
									</p>
								</div>
							</div>
						</div>

						{/* Bottom Details - Badges */}
						<div className="px-3 pb-3">
							<div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100/50">
								{menu.resto
									?.split('\n')
									.filter((i) => i.trim())
									.map((item, i) => (
										<span
											key={i}
											className="bg-white/60 text-[9px] px-2 py-0.5 rounded-full text-gray-500 font-bold border border-gray-100 shadow-sm flex items-center gap-1"
										>
											<div className="w-1 h-1 rounded-full bg-energy-orange/30" />
											{item.replace(/^-/, '').trim()}
										</span>
									))}
								{formData.fecha &&
									(() => {
										const d = safeParseDate(formData.fecha);
										return d && !isNaN(d.getTime()) && [0, 5, 6].includes(d.getDay());
									})() && (
										<span className="text-[9px] bg-orange-50 text-energy-orange px-2 py-0.5 rounded-full font-black border border-orange-100 uppercase tracking-tighter shadow-sm">
											+1.50€ Finde
										</span>
									)}
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Modal de Imagen Ampliada */}
			<AnimatePresence>
				{selectedMenuForModal && (
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
							transition={{ type: 'spring', damping: 25, stiffness: 300 }}
							className="bg-white rounded-[32px] overflow-hidden w-full max-w-lg shadow-2xl relative max-h-[90dvh] flex flex-col"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Botón Cerrar - Mejorado para contraste */}
							<button 
								onClick={closeModal}
								className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-xl flex items-center justify-center transition-all active:scale-90 border border-gray-100"
							>
								<X size={20} strokeWidth={3} />
							</button>

							<div className="overflow-y-auto no-scrollbar">
								{/* Hero Image Section - Altura reducida para móvil */}
								<div className="relative h-48 sm:h-72 w-full overflow-hidden bg-gray-100">
									{selectedMenuForModal.imageUrl ? (
										<img 
											src={selectedMenuForModal.imageUrl} 
											alt={selectedMenuForModal.nombre} 
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
											<ImageIcon size={48} strokeWidth={1} />
											<span className="text-xs font-bold uppercase tracking-widest">Sin imagen</span>
										</div>
									)}
									{/* Price Badge over image */}
									<div className="absolute bottom-4 right-4 bg-energy-orange text-white px-4 py-2 rounded-2xl font-black text-lg shadow-lg shadow-energy-orange/20">
										{selectedMenuForModal.precio}€
									</div>
								</div>

								{/* Content Section - Paddings reducidos */}
								<div className="p-5 sm:p-7">
									<h3 className="text-xl sm:text-2xl font-display font-black text-text-black mb-1">
										{selectedMenuForModal.nombre}
									</h3>
									<div className="flex items-center gap-2 mb-4">
										<div className="h-1 w-6 rounded-full bg-energy-orange" />
										<span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
											Detalles del Menú
										</span>
									</div>

									{/* Main Dish */}
									<div className="mb-5 p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
										<p className="text-[10px] font-black text-energy-orange uppercase tracking-wider mb-1">
											Plato Principal
										</p>
										<p className="text-sm sm:text-base font-bold text-gray-800 leading-snug">
											{selectedMenuForModal.principal}
										</p>
									</div>

									{/* Menu Items Grid */}
									<div className="space-y-3">
										<p className="text-[10px] font-black text-gray-400 uppercase tracking-wider pl-1">
											Incluye además:
										</p>
										<div className="flex flex-wrap gap-2">
											{selectedMenuForModal.resto
												?.split('\n')
												.filter((i) => i.trim())
												.map((item, i) => (
													<div
														key={i}
														className="bg-gray-50 px-3 py-1.5 rounded-xl text-[13px] font-bold text-gray-600 border border-gray-100 flex items-center gap-2"
													>
														<div className="w-1.5 h-1.5 rounded-full bg-neverland-green" />
														{item.replace(/^-/, '').trim()}
													</div>
												))}
										</div>
									</div>
									
									{/* Selection Action */}
									<button
										onClick={() => {
											setFormData({
												...formData,
												niños: { ...formData.niños, menuId: selectedMenuForModal.id || selectedMenuForModal._id },
											});
											closeModal();
										}}
										className="w-full mt-6 py-4 bg-energy-orange hover:bg-energy-orange/90 text-white rounded-2xl font-black shadow-lg shadow-energy-orange/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
									>
										{String(formData.niños.menuId) === String(selectedMenuForModal.id || selectedMenuForModal._id) ? (
											<>
												<CheckCircle size={20} strokeWidth={3} />
												SELECCIONADO
											</>
										) : (
											'SELECCIONAR ESTE MENÚ'
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

export default Step3Kids;

