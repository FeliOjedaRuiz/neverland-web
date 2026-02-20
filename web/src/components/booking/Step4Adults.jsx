import React from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';

const Step4Adults = ({ formData, setFormData, ADULT_MENU_OPTIONS }) => {
	return (
		<div>
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
									cantidad: Math.max(0, formData.adultos.cantidad - 1),
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
									cantidad: formData.adultos.cantidad + 1,
								},
							})
						}
						className="w-8 h-8 rounded-full bg-neverland-green text-white font-black shadow-md hover:scale-105 active:scale-90 transition-all flex items-center justify-center text-base"
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
							<div className="flex justify-between items-start mb-1">
								<div>
									<p className="font-bold text-sm text-gray-800">
										{item.nombre}
									</p>
									<p className="text-[10px] text-gray-500">{item.unidades}</p>
								</div>
								<span
									className={`font-black text-base ${qty > 0 ? 'text-energy-orange' : 'text-gray-800'}`}
								>
									{item.precio}€
								</span>
							</div>
							<div className="flex justify-end mt-1">
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
										className="w-7 h-7 rounded-full bg-energy-orange text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
									>
										<Plus size={12} />
									</button>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default Step4Adults;
