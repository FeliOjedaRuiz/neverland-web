import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Image as ImageIcon, X, ZoomIn, Plus } from 'lucide-react';

const Step5Workshops = ({ formData, setFormData, WORKSHOPS }) => {
	const [selectedWorkshopForModal, setSelectedWorkshopForModal] = useState(null);

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

	const openModal = (workshop) => setSelectedWorkshopForModal(workshop);
	const closeModal = () => {
		if (selectedWorkshopForModal) {
			setSelectedWorkshopForModal(null);
			window.history.back();
		}
	};

	const selectWorkshop = (name) => {
		setFormData({
			...formData,
			extras: { ...formData.extras, taller: name },
		});
		if (selectedWorkshopForModal) closeModal();
	};

	return (
		<div className="relative">
			<h2 className="text-xl font-display font-bold text-text-black text-center mb-4">
				Actividades
			</h2>

			<div className="mb-6">
				{/* "No Activity" Card - Separated at the top */}
				<motion.div
					whileHover={{ y: -2 }}
					whileTap={{ scale: 0.98 }}
					onClick={() => selectWorkshop('ninguno')}
					className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between px-6 ${
						formData.extras.taller === 'ninguno'
							? 'border-gray-400 bg-gray-100 shadow-inner'
							: 'border-white bg-white shadow-sm hover:border-gray-200'
					}`}
				>
					<div className="flex items-center gap-4">
						<div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.extras.taller === 'ninguno' ? 'bg-gray-200 text-gray-400' : 'bg-gray-50 text-gray-300'}`}>
							<X size={20} />
						</div>
						<span className="font-black text-sm text-gray-600 uppercase tracking-wider">Sin actividad</span>
					</div>
					{formData.extras.taller === 'ninguno' && (
						<CheckCircle className="text-gray-500" size={24} fill="currentColor" stroke="white" />
					)}
				</motion.div>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
				{/* Actual Workshops */}
				{[...WORKSHOPS].reverse().filter((ws) => !ws.suspended).map((workshop) => {
					const isSelected = formData.extras.taller === workshop.name;
					const price = formData.niños.cantidad >= 15 ? workshop.pricePlus : workshop.priceBase;

					return (
						<motion.div
							key={workshop.id}
							whileHover={{ y: -4 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => openModal(workshop)}
							className={`group relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer flex flex-col ${
								isSelected
									? 'border-rec-blue bg-blue-50/30 shadow-lg shadow-blue-500/10'
									: 'border-white bg-white shadow-sm hover:shadow-md'
							}`}
						>
							{/* Square Image Container */}
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
								
								{/* Selection Overlay */}
								{isSelected && (
									<div className="absolute inset-0 bg-rec-blue/20 backdrop-blur-[1px] flex items-center justify-center">
										<CheckCircle size={32} className="text-white drop-shadow-md" fill="currentColor" stroke="#4b8cc8" />
									</div>
								)}

								{/* Zoom hint on hover */}
								<div className="absolute bottom-2 right-2 bg-white/90 p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
									<ZoomIn size={14} className="text-rec-blue" />
								</div>
							</div>

							<div className="p-3 flex flex-col justify-between flex-1">
								<h3 className={`font-black text-xs sm:text-sm leading-tight mb-1 line-clamp-2 ${isSelected ? 'text-rec-blue' : 'text-gray-800'}`}>
									{workshop.name}
								</h3>
								<p className="font-black text-sm text-rec-blue">
									{price}€
								</p>
							</div>
						</motion.div>
					);
				})}
			</div>

			{/* Modal Detail */}
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
							className="bg-white rounded-[32px] overflow-hidden w-full max-w-lg shadow-2xl relative max-h-[90dvh] flex flex-col"
							onClick={(e) => e.stopPropagation()}
						>
							<button 
								onClick={closeModal}
								className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/90 text-gray-900 shadow-xl flex items-center justify-center active:scale-90 border border-gray-100"
							>
								<X size={20} strokeWidth={3} />
							</button>

							<div className="overflow-y-auto no-scrollbar">
								<div className="aspect-[16/10] sm:aspect-video max-h-[35dvh] w-full bg-gray-100 relative overflow-hidden shrink-0">
									{selectedWorkshopForModal.imageUrl ? (
										<img 
											src={selectedWorkshopForModal.imageUrl} 
											alt={selectedWorkshopForModal.name} 
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center text-gray-200">
											<ImageIcon size={48} strokeWidth={1} />
										</div>
									)}
									<div className="absolute bottom-4 right-4 bg-rec-blue text-white px-4 py-2 rounded-2xl font-black text-lg shadow-lg">
										{formData.niños.cantidad >= 15 ? selectedWorkshopForModal.pricePlus : selectedWorkshopForModal.priceBase}€
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

									{formData.niños.cantidad >= 15 && (
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
										className="w-full py-3 sm:py-3.5 bg-rec-blue hover:bg-rec-blue/90 text-white rounded-2xl font-black shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-base"
									>
										{formData.extras.taller === selectedWorkshopForModal.name ? (
											<>
												<CheckCircle size={20} strokeWidth={3} />
												ACTIVIDAD SELECCIONADA
											</>
										) : (
											'SELECCIONAR ESTE TALLER'
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
