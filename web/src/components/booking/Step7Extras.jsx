import React, { useState } from 'react';
import { Clock, CheckCircle, MessageSquare, X, Image as ImageIcon, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { filterActiveCatalog } from '../../utils/bookingUtils';

const Step7Extras = ({ formData, setFormData, prices, extrasCatalogo = [] }) => {
	const [selectedItemForModal, setSelectedItemForModal] = useState(null);

	const getPriceForExtension = (mins) => {
		if (mins === 0) return 0;
		return mins === 30
			? prices.preciosExtras.extension30
			: prices.preciosExtras.extension60;
	};

	return (
		<div>
			<h2 className="text-xl font-display font-bold text-text-black text-center mb-4">
				Extras de la Fiesta
			</h2>

			<div className="space-y-3">
				{/* Time Extension */}
				<div className="p-4 rounded-3xl border-2 border-white bg-white shadow-sm">
					<div className="flex items-center gap-3 mb-3">
						<div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
							<Clock size={20} />
						</div>
						<div>
							<p className="font-bold text-gray-800">Duración del evento</p>
							<p className="text-xs text-gray-500">Amplía la diversión</p>
						</div>
					</div>
					<div className="grid grid-cols-3 gap-2">
						{[0, 30, 60].map((mins) => (
							<button
								key={mins}
								onClick={() =>
									setFormData({
										...formData,
										extras: {
											...formData.extras,
											extension: mins,
											extensionType: mins > 0 ? 'after' : 'default',
										},
									})
								}
								className={`py-2 px-1 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
									formData.extras.extension === mins
										? 'border-purple-500 bg-purple-50 text-purple-700'
										: 'border-gray-100 bg-gray-50 text-gray-400 hover:border-purple-200'
								}`}
							>
								<span>{mins === 0 ? '2 hs.' : mins === 30 ? '2:30 hs.' : '3 hs.'}</span>
								{mins > 0 && (
									<span
										className={`text-[9px] px-1.5 rounded-full ${formData.extras.extension === mins ? 'bg-purple-200 text-purple-700' : 'bg-gray-200 text-gray-500'}`}
									>
										+{getPriceForExtension(mins)}€
									</span>
								)}
							</button>
						))}
					</div>

					{formData.extras.extension > 0 && (
						<div className="mt-3 p-3 bg-purple-50/70 rounded-xl border border-purple-100 text-center">
							<p className="text-xs font-bold text-purple-600">
								El horario exacto se configurará al elegir el turno.
							</p>
						</div>
					)}
				</div>

				{/* Extras del catálogo genérico (Piñata es un item más, sin toggle especial) */}
				{(() => {
					const items = filterActiveCatalog(extrasCatalogo);
					if (items.length === 0) return null;

					const toggleItem = (itemSlug) => {
						const currentIds = formData.extras.catalogoItemIds || [];
						const nextIds = currentIds.includes(itemSlug)
							? currentIds.filter((id) => id !== itemSlug)
							: [...currentIds, itemSlug];
						setFormData({
							...formData,
							extras: { ...formData.extras, catalogoItemIds: nextIds },
						});
					};

					return (
						<div className="p-4 rounded-3xl border-2 border-white bg-white shadow-sm">
							<div className="flex items-center gap-3 mb-3">
								<div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
									🎁
								</div>
								<div>
									<p className="font-bold text-gray-800">Extras disponibles</p>
									<p className="text-xs text-gray-500">
										Añade más detalles a tu fiesta
									</p>
								</div>
							</div>
							<div className="space-y-2">
								{items.map((item) => {
									const isSelected = (formData.extras.catalogoItemIds || []).includes(
										item.slug,
									);
									return (
										<div
											key={item.slug}
											onClick={() => toggleItem(item.slug)}
											className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
												isSelected
													? 'border-pink-300 bg-pink-50'
													: 'border-gray-100 bg-gray-50 hover:border-pink-200'
											}`}
										>
											<div className="flex items-center gap-3 min-w-0">
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														setSelectedItemForModal(item);
													}}
													className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-xl shrink-0 overflow-hidden relative group hover:ring-2 hover:ring-pink-400 transition-all cursor-pointer"
													title="Ver imagen"
												>
													{item.imageUrl ? (
														<>
															<img
																src={item.imageUrl}
																alt={item.nombre}
																className="w-full h-full object-cover rounded-full"
															/>
															<div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
																<ZoomIn size={14} className="text-white drop-shadow" />
															</div>
														</>
													) : (
														<span>{item.nombre?.charAt(0) || '✨'}</span>
													)}
												</button>
												<div className="text-left min-w-0">
													<p className="font-bold text-gray-800 text-sm truncate">
														{item.nombre}
													</p>
													{item.descripcion && (
														<p className="text-xs text-gray-500 truncate">
															{item.descripcion}
														</p>
													)}
												</div>
											</div>
											<div className="flex items-center gap-2 shrink-0">
												<span className="text-sm font-black text-pink-600">
													+{Number(item.precio || 0).toFixed(0)}€
												</span>
												<div
													className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
														isSelected
															? 'bg-pink-500 border-pink-500 text-white'
															: 'border-gray-300'
													}`}
												>
													{isSelected && <CheckCircle size={14} />}
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					);
				})()}

				{/* Observaciones */}
				<div className="p-4 rounded-3xl border-2 border-white bg-white shadow-sm mt-3">
					<div className="flex items-center gap-3 mb-3">
						<div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
							<MessageSquare size={20} />
						</div>
						<div>
							<p className="font-bold text-gray-800">Comentarios adicionales</p>
							<p className="text-xs text-gray-500">
								Detalles logísticos, peticiones o cualquier cosa que quieras que sepamos
							</p>
						</div>
					</div>
					<textarea
						value={formData.extras.observaciones || ''}
						onChange={(e) =>
							setFormData({
								...formData,
								extras: {
									...formData.extras,
									observaciones: e.target.value.substring(0, 500),
								},
							})
						}
						maxLength={500}
						placeholder="Ej: Decoración especial, necesitamos acceso para silla de ruedas, u otra consideración importante..."
						className="w-full min-h-[100px] p-3 rounded-2xl border-2 border-gray-100 bg-gray-50 text-base resize-none focus:outline-none focus:border-blue-300 focus:bg-white transition-all text-gray-700"
					/>
					<div className="text-right mt-1">
						<span className="text-[10px] text-gray-400 font-medium">
							{(formData.extras.observaciones || '').length}/500
						</span>
					</div>
				</div>
			</div>

			{/* Modal Preview Imagen Extra */}
			<AnimatePresence>
				{selectedItemForModal && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed top-16 md:top-20 inset-x-0 bottom-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
						onClick={() => setSelectedItemForModal(null)}
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0, y: 20 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							exit={{ scale: 0.9, opacity: 0, y: 20 }}
							className="bg-white rounded-[32px] overflow-hidden w-full max-w-sm sm:max-w-md shadow-2xl relative max-h-[90dvh] flex flex-col"
							onClick={(e) => e.stopPropagation()}
						>
							<button 
								onClick={() => setSelectedItemForModal(null)}
								className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/90 text-gray-900 shadow-xl flex items-center justify-center active:scale-90 border border-gray-100"
							>
								<X size={20} strokeWidth={3} />
							</button>

							<div className="overflow-y-auto no-scrollbar">
								<div className="w-full bg-pink-50/40 relative flex items-center justify-center overflow-hidden shrink-0 min-h-[200px] max-h-[50dvh]">
									{selectedItemForModal.imageUrl ? (
										<img 
											src={selectedItemForModal.imageUrl} 
											alt={selectedItemForModal.nombre} 
											className="w-full h-auto max-h-[50dvh] object-contain block mx-auto"
										/>
									) : (
										<div className="w-full h-52 flex flex-col items-center justify-center text-gray-400 gap-2 p-6 text-center">
											<ImageIcon size={48} strokeWidth={1.5} className="text-gray-300" />
											<span className="text-sm font-bold text-gray-500">Imagen no disponible</span>
										</div>
									)}
									<div className="absolute bottom-3 right-3 bg-pink-500 text-white px-3.5 py-1.5 rounded-2xl font-black text-base shadow-lg z-10">
										+{Number(selectedItemForModal.precio || 0).toFixed(0)}€
									</div>
								</div>

								<div className="p-5">
									<h3 className="text-lg sm:text-xl font-display font-black text-text-black mb-1">
										{selectedItemForModal.nombre}
									</h3>
									{selectedItemForModal.descripcion ? (
										<p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
											{selectedItemForModal.descripcion}
										</p>
									) : (
										<p className="text-xs text-gray-400 italic">
											Sin descripción adicional
										</p>
									)}
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default Step7Extras;
