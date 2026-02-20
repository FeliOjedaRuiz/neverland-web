import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const Step3Kids = ({ formData, setFormData, CHILDREN_MENUS }) => {
	return (
		<div>
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
									cantidad: formData.niños.cantidad + 1,
								},
							})
						}
						className="w-8 h-8 rounded-full bg-neverland-green text-white font-black shadow-md hover:scale-105 active:scale-90 transition-all flex items-center justify-center text-base"
					>
						+
					</button>
				</div>
			</motion.div>

			<p className="text-sm font-bold text-gray-400 mb-2 px-2 flex justify-between items-center">
				<span>Elige el Menú Infantil:</span>
				{formData.fecha &&
					[0, 5, 6].includes(new Date(formData.fecha).getDay()) && (
						<span className="text-[10px] text-energy-orange bg-orange-50 px-2 py-1 rounded-lg animate-pulse">
							+1.50€ Vie a Dom
						</span>
					)}
			</p>
			<div className="space-y-3">
				{CHILDREN_MENUS.map((menu) => (
					<div
						key={menu.id}
						onClick={() =>
							setFormData({
								...formData,
								niños: { ...formData.niños, menuId: menu.id },
							})
						}
						className={`relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer ${
							formData.niños.menuId === menu.id
								? 'border-energy-orange bg-orange-50/30 shadow-md'
								: 'border-orange-50 bg-white shadow-sm hover:border-orange-100'
						}`}
					>
						<div className="p-4 relative z-10">
							<div className="flex justify-between items-start mb-2">
								<span
									className={`font-display font-black text-lg ${formData.niños.menuId === menu.id ? 'text-energy-orange' : 'text-gray-800'}`}
								>
									{menu.name}
								</span>
								<span
									className={`font-black text-xl bg-white px-2 py-1 rounded-lg shadow-sm ${formData.niños.menuId === menu.id ? 'text-energy-orange' : 'text-orange-300/80'}`}
								>
									{menu.price}€
								</span>
							</div>
							{formData.fecha &&
								[0, 5, 6].includes(new Date(formData.fecha).getDay()) && (
									<div className="flex justify-end mb-2 -mt-1">
										<span className="text-[10px] font-bold text-energy-orange bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100/50">
											+1.50€ Vie a Dom
										</span>
									</div>
								)}
							<div className="text-sm text-gray-600 mb-1 space-y-2">
								<p className="flex items-baseline gap-2 leading-tight">
									<strong
										className={`font-black uppercase text-[9px] tracking-widest shrink-0 ${formData.niños.menuId === menu.id ? 'text-energy-orange' : 'text-orange-200'}`}
									>
										Principal
									</strong>
									<span className="font-bold text-gray-800">{menu.main}</span>
								</p>
								<div className="flex flex-wrap gap-1.5 pt-1">
									{menu.desc
										?.split('\n')
										.filter((i) => i.trim())
										.map((item, i) => (
											<span
												key={i}
												className="bg-gray-100/60 text-[10px] px-2.5 py-1 rounded-full text-gray-500 font-bold flex items-center gap-1.5 border border-gray-100/50"
											>
												<div
													className={`w-1 h-1 rounded-full ${formData.niños.menuId === menu.id ? 'bg-energy-orange/40' : 'bg-orange-100'}`}
												/>
												{item.replace(/^-/, '').trim()}
											</span>
										))}
								</div>
							</div>
						</div>
						{formData.niños.menuId === menu.id && (
							<div className="absolute top-0 right-0 p-4">
								<CheckCircle
									className="text-energy-orange"
									fill="currentColor"
									stroke="white"
								/>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
};

export default Step3Kids;
