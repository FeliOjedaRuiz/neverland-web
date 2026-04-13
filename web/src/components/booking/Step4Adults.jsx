import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Image as ImageIcon, X, ZoomIn } from 'lucide-react';

const Step4Adults = ({ formData, setFormData, ADULT_MENU_OPTIONS }) => {
	const [selectedItemForModal, setSelectedItemForModal] = useState(null);

	// Sync with browser history for mobile "back" button
	useEffect(() => {
		const handlePopState = () => {
			if (selectedItemForModal) {
				setSelectedItemForModal(null);
			}
		};

		if (selectedItemForModal) {
			window.history.pushState(null, '', '');
			window.addEventListener('popstate', handlePopState);
		}

		return () => {
			window.removeEventListener('popstate', handlePopState);
		};
	}, [selectedItemForModal]);

	const openModal = (item) => setSelectedItemForModal(item);
	const closeModal = () => {
		if (selectedItemForModal) {
			setSelectedItemForModal(null);
			// Only go back if we pushed state
			window.history.back();
		}
	};

	return (
		<div className="relative">
			<h2 className="text-xl font-display font-bold text-text-black text-center mb-4">
				Para los Mayores
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
						Adultos Estimados
					</p>
					<p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
						Aproximado (Mín. 1)
					</p>
				</div>

				<div className="flex items-center gap-3 bg-gray-50 rounded-full p-1 relative z-10 border border-neverland-green/10">
					<button
						onClick={() =>
							setFormData({
								...formData,
								adultos: {
									...formData.adultos,
									cantidad: Math.max(1, formData.adultos.cantidad - 1),
								},
							})
						}
						className="w-8 h-8 rounded-full bg-white text-neverland-green font-black shadow-sm hover:bg-neverland-green hover:text-white active:scale-90 transition-all border border-gray-100 flex items-center justify-center text-base"
					>
						<Minus size={14} />
					</button>
					<span className="text-2xl font-black w-8 text-center text-neverland-green leading-none">
						{formData.adultos.cantidad}
					</span>
					<button
						onClick={() =>
							setFormData({
								...formData,
								adultos: {
									...formData.adultos,
									cantidad: Math.min(40, formData.adultos.cantidad + 1),
								},
							})
						}
						disabled={formData.adultos.cantidad >= 40}
						className={`w-8 h-8 rounded-full font-black shadow-md hover:scale-105 active:scale-90 transition-all flex items-center justify-center text-base ${formData.adultos.cantidad >= 40 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-neverland-green text-white'}`}
					>
						<Plus size={14} />
					</button>
				</div>
			</motion.div>

			{formData.adultos.cantidad === 0 && (
				<p className="text-[10px] text-red-500 font-bold ml-2 -mt-1 mb-2 animate-pulse">
					⚠️ Es necesario al menos 1 adulto responsable
				</p>
			)}

			<p className="text-xs font-bold text-gray-400 mb-1.5 px-2">
				Añadir Comida (Opcional):
			</p>
			<div className="space-y-2">
				{ADULT_MENU_OPTIONS.filter((item) => !item.suspended).map((item) => {
					const existingItem = formData.adultos.comida.find(
						(c) => c.item === item.nombre,
					);
					const qty = existingItem ? existingItem.cantidad : 0;

					const updateQty = (delta) => {
						let newComida = [...formData.adultos.comida];
						const idx = newComida.findIndex((c) => c.item === item.nombre);

						if (delta > 0) {
							if (idx >= 0) {
								newComida[idx] = {
									...newComida[idx],
									cantidad: newComida[idx].cantidad + delta,
								};
							} else {
								newComida.push({
									item: item.nombre,
									cantidad: 1,
									precioUnitario: item.precio,
								});
							}
						} else {
							if (idx >= 0) {
								if (newComida[idx].cantidad > 1) {
									newComida[idx] = {
										...newComida[idx],
										cantidad: newComida[idx].cantidad + delta,
									};
								} else {
									newComida.splice(idx, 1);
								}
							}
						}

						setFormData({
							...formData,
							adultos: { ...formData.adultos, comida: newComida },
						});
					};

					return (
						<div
							key={item.id}
							className={`p-3 rounded-2xl border-2 transition-all ${
								qty > 0
									? 'border-energy-orange bg-orange-50/30'
									: 'border-white bg-white shadow-sm'
							}`}
						>
							<div className="flex gap-4">
								<div 
									onClick={() => openModal(item)}
									className="group w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100/50 shadow-sm relative cursor-pointer active:scale-95 transition-transform"
								>
									{item.imageUrl ? (
										<img src={item.imageUrl} alt={item.nombre} className="w-full h-full object-cover" />
									) : (
										<div className="w-full h-full flex items-center justify-center text-gray-200">
											<ImageIcon size={24} />
										</div>
									)}
									<div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
										<div className="bg-white/90 p-1.5 rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-transform">
											<ZoomIn size={14} className="text-energy-orange" />
										</div>
									</div>
								</div>
								<div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
									<div className="flex justify-between items-start">
										<div className="min-w-0">
											<p className="font-bold text-sm sm:text-base text-gray-800 leading-snug truncate">
												{item.nombre}
											</p>
											<p className="text-[11px] text-gray-400 font-medium mt-0.5">{item.unidades}</p>
										</div>
										<span
											className={`font-black text-base shrink-0 ml-2 ${qty > 0 ? 'text-energy-orange' : 'text-gray-800'}`}
										>
											{item.precio}€
										</span>
									</div>
									
									<div className="flex justify-end">
										<div className="flex items-center gap-2 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
											<button
												onClick={() => updateQty(-1)}
												className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${qty > 0 ? 'bg-orange-100 text-energy-orange' : 'bg-gray-50 text-gray-300'}`}
												disabled={qty === 0}
											>
												<Minus size={12} />
											</button>
											<span
												className={`text-base font-bold w-5 text-center ${qty > 0 ? 'text-energy-orange' : 'text-gray-300'}`}
											>
												{qty}
											</span>
											<button
												onClick={() => updateQty(1)}
												disabled={qty >= 20}
												className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${qty >= 20 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-energy-orange text-white hover:bg-orange-600'}`}
											>
												<Plus size={12} />
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Modal de Imagen Ampliada (Simplificado) */}
			<AnimatePresence>
				{selectedItemForModal && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed top-16 md:top-20 inset-x-0 bottom-0 z-[1000] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md"
						onClick={closeModal}
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							className="bg-white rounded-3xl overflow-hidden w-full max-w-sm shadow-2xl relative"
							onClick={(e) => e.stopPropagation()}
						>
							<button 
								onClick={closeModal}
								className="absolute top-3 right-3 z-50 w-8 h-8 rounded-full bg-white/90 text-gray-900 shadow-lg flex items-center justify-center transition-all active:scale-90 border border-gray-100"
							>
								<X size={16} strokeWidth={3} />
							</button>

							{/* Square Image Section */}
							<div className="aspect-square w-full bg-gray-100 overflow-hidden">
								{selectedItemForModal.imageUrl ? (
									<img 
										src={selectedItemForModal.imageUrl} 
										alt={selectedItemForModal.nombre} 
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-gray-200">
										<ImageIcon size={48} strokeWidth={1} />
									</div>
								)}
							</div>

							{/* Text Content */}
							<div className="p-6 text-center">
								<h3 className="text-xl font-display font-black text-text-black mb-1">
									{selectedItemForModal.nombre}
								</h3>
								<p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
									{selectedItemForModal.unidades}
								</p>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default Step4Adults;
