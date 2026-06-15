import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, Image as ImageIcon, X, ZoomIn, Stars, Clock } from 'lucide-react';

const Step6Characters = ({
	formData,
	setFormData,
	CHARACTERS,
	charSearch,
	setCharSearch,
	prices,
}) => {
	const [selectedCharForModal, setSelectedCharForModal] = useState(null);
	const [toastMessage, setToastMessage] = useState(null);

	const filteredChars = (CHARACTERS || []).filter((c) =>
		!c.suspended && (c.nombre || c.name || '').toLowerCase().includes(charSearch.toLowerCase()),
	);

	const selectedPersonajes = formData.extras.personajes || [];

	// Sync with browser history for mobile "back" button
	useEffect(() => {
		const handlePopState = () => {
			if (selectedCharForModal) {
				setSelectedCharForModal(null);
			}
		};

		if (selectedCharForModal) {
			window.history.pushState(null, '', '');
			window.addEventListener('popstate', handlePopState);
		}

		return () => {
			window.removeEventListener('popstate', handlePopState);
		};
	}, [selectedCharForModal]);

	// Toast auto-dismiss
	useEffect(() => {
		if (toastMessage) {
			const timer = setTimeout(() => setToastMessage(null), 3000);
			return () => clearTimeout(timer);
		}
	}, [toastMessage]);

	const openModal = (char) => setSelectedCharForModal(char);
	const closeModal = () => {
		if (selectedCharForModal) {
			setSelectedCharForModal(null);
			window.history.back();
		}
	};

	const selectCharacter = (name) => {
		const current = formData.extras.personajes || [];

		if (current.includes(name)) {
			// Deseleccionar: quitar del array
			setFormData({
				...formData,
				extras: { ...formData.extras, personajes: current.filter(p => p !== name) },
			});
		} else {
			// Seleccionar: añadir solo si < 3
			if (current.length >= 3) {
				setToastMessage('El máximo es 3 personajes');
				return;
			}
			setFormData({
				...formData,
				extras: { ...formData.extras, personajes: [...current, name] },
			});
		}

		if (selectedCharForModal) closeModal();
	};

	const clearAllPersonajes = () => {
		setFormData({
			...formData,
			extras: { ...formData.extras, personajes: [] },
		});
	};

	// Dynamic price display is rendered at page level (PackPriceBanner) so it
	// stays fixed above the navigation buttons regardless of scroll position.
	const showQuitarTodos = selectedPersonajes.length >= 2;
	const isPackActive = selectedPersonajes.length === 3;

	return (
		<div className="flex flex-col h-full overflow-hidden relative">
			<h2 className="text-xl font-display font-black text-text-black text-center mb-1">
				Visita Especial
			</h2>
			<p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest mb-6">Un momento mágico con sus personajes favoritos</p>

			<div className="bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-gray-100 flex items-center gap-2 mb-6 shrink-0 shadow-sm focus-within:ring-2 focus-within:ring-purple-200 focus-within:bg-white transition-all">
				<Search className="text-gray-300" size={18} />
				<input
					className="w-full bg-transparent outline-none font-bold text-base text-gray-700 placeholder:text-gray-300"
					placeholder="Buscar personaje..."
					value={charSearch}
					onChange={(e) => setCharSearch(e.target.value)}
				/>
			</div>

			<div className="flex-1 overflow-y-auto no-scrollbar pr-1 pb-4">
				{/* "No Character" Option - Separated at top */}
				<div className="mb-6">
					<motion.div
						whileHover={{ y: -2 }}
						whileTap={{ scale: 0.98 }}
						onClick={clearAllPersonajes}
						className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between px-6 ${
							selectedPersonajes.length === 0
								? 'border-gray-400 bg-gray-100 shadow-inner'
								: 'border-white bg-white shadow-sm hover:border-gray-200'
						}`}
					>
						<div className="flex items-center gap-4">
							<div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedPersonajes.length === 0 ? 'bg-gray-200 text-gray-400' : 'bg-gray-50 text-gray-300'}`}>
								<X size={20} />
							</div>
							<div className="flex flex-col">
								<span className={`font-black text-sm uppercase tracking-wide ${selectedPersonajes.length === 0 ? 'text-gray-600' : 'text-gray-400'}`}>
									{showQuitarTodos ? 'Quitar todos' : 'Sin Visita'}
								</span>
							</div>
						</div>
						{selectedPersonajes.length === 0 && (
							<CheckCircle className="text-gray-500" size={24} fill="currentColor" stroke="white" />
						)}
					</motion.div>
				</div>

				<div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
					{filteredChars.map((char) => {
						const charName = char.nombre || char.name;
						const isSelected = selectedPersonajes.includes(charName);
						const showStrikethrough = isPackActive && isSelected;

						return (
							<motion.div
								key={char.id || charName}
								whileHover={{ y: -4 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => openModal(char)}
								className={`group relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer flex flex-col ${
									isSelected
										? 'border-purple-500 bg-purple-50/30 shadow-lg shadow-purple-500/10'
										: 'border-white bg-white shadow-sm hover:shadow-md'
								}`}
							>
								{/* Square Image Container */}
								<div className="aspect-square w-full bg-gray-50 relative overflow-hidden">
									{char.imageUrl ? (
										<img
											src={char.imageUrl}
											alt={charName}
											className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
										/>
									) : (
										<div className="w-full h-full flex flex-col items-center justify-center text-gray-200 gap-1">
											<ImageIcon size={24} strokeWidth={1.5} />
											<span className="text-[8px] font-black uppercase tracking-widest opacity-50">Personaje</span>
										</div>
									)}

									{/* Selection Overlay */}
									{isSelected && (
										<div className="absolute inset-0 bg-purple-500/20 backdrop-blur-[1px] flex items-center justify-center">
											<CheckCircle size={32} className="text-white drop-shadow-md" fill="currentColor" stroke="#a855f7" />
										</div>
									)}

									{/* Zoom hint on hover */}
									<div className="absolute bottom-2 right-2 bg-white/90 p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
										<ZoomIn size={14} className="text-purple-500" />
									</div>
								</div>

								<div className="p-3 flex flex-col justify-between flex-1">
									<h3 className={`font-black text-xs sm:text-sm leading-tight mb-1 line-clamp-2 ${isSelected ? 'text-purple-600' : 'text-gray-800'}`}>
										{charName}
									</h3>
									<p className={`font-black text-sm ${showStrikethrough ? 'text-gray-400 line-through decoration-2' : 'text-purple-500'}`}>
										{prices?.preciosExtras?.personaje || 40}€
									</p>
								</div>
							</motion.div>
						);
					})}
				</div>

				{filteredChars.length === 0 && charSearch && (
					<div className="text-center py-10">
						<div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-50 text-gray-200 mb-3">
							<Search size={24} />
						</div>
						<p className="text-xs font-bold text-gray-400">No encontramos ningún personaje que coincida con "{charSearch}"</p>
					</div>
				)}
			</div>

			{/* Dynamic Price Display se renderiza en PackPriceBanner a nivel de página */}

			{/* Toast Message */}
			<AnimatePresence>
				{toastMessage && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 20 }}
						className="absolute bottom-4 left-4 right-4 mx-auto max-w-sm bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl z-[1001]"
					>
						<p className="text-sm font-bold text-center">{toastMessage}</p>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Modal Detail */}
			<AnimatePresence>
				{selectedCharForModal && (
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
									{selectedCharForModal.imageUrl ? (
										<img 
											src={selectedCharForModal.imageUrl} 
											alt={selectedCharForModal.nombre || selectedCharForModal.name} 
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center text-gray-200">
											<ImageIcon size={48} strokeWidth={1} />
										</div>
									)}
									<div className={`absolute bottom-4 right-4 px-4 py-2 rounded-2xl font-black text-lg sm:text-xl shadow-lg flex items-center gap-1 ${isPackActive ? 'bg-gray-400 text-white line-through decoration-2' : 'bg-purple-600 text-white'}`}>
										{prices?.preciosExtras?.personaje || 40}€
									</div>
								</div>

								<div className="p-4 sm:p-5">
									<h3 className="text-lg sm:text-xl font-display font-black text-text-black mb-0.5">
										{selectedCharForModal.nombre || selectedCharForModal.name}
									</h3>
									
									<div className="flex items-center gap-2 mb-2 sm:mb-3">
										<div className="h-1 w-4 rounded-full bg-purple-500" />
										<span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
											Detalles de la Visita
										</span>
									</div>

									<div className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-5">
										<div className="flex items-center gap-3 p-2.5 sm:p-3 bg-purple-50 rounded-2xl border border-purple-100">
											<div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
												<Clock size={16} />
											</div>
											<div>
												<p className="text-[9px] font-black text-purple-400 uppercase tracking-widest leading-none mb-1">Duración</p>
												<p className="text-xs sm:text-sm font-black text-purple-700 leading-none">Visita de 30 min</p>
											</div>
										</div>

										<div className="flex items-center gap-3 p-2.5 sm:p-3 bg-purple-50/50 rounded-2xl border border-purple-50">
											<div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 outline outline-2 outline-white">
												<Stars size={16} />
											</div>
											<div>
												<p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Experiencia</p>
												<p className="text-[11px] sm:text-xs font-bold text-gray-600">Incluye música, fotos y baile.</p>
											</div>
										</div>
									</div>

									<button
										onClick={() => selectCharacter(selectedCharForModal.nombre || selectedCharForModal.name)}
										className="w-full py-3 sm:py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-base"
									>
										{selectedPersonajes.includes(selectedCharForModal.nombre || selectedCharForModal.name) ? (
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

export default Step6Characters;