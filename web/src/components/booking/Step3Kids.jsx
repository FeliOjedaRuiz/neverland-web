import React from 'react';
import { CheckCircle } from 'lucide-react';

const Step3Kids = ({ formData, setFormData, CHILDREN_MENUS }) => {
	return (
		<div>
			<h2 className="text-xl font-display font-bold text-text-black text-center mb-4">
				Los Protagonistas
			</h2>

			{/* Counter */}
			<div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center mb-4 shrink-0">
				<div>
					<p className="font-bold text-gray-800">Niños Invitados</p>
					<p className="text-xs text-gray-400">Mínimo 12</p>
				</div>
				<div className="flex items-center gap-3 bg-gray-50 rounded-full p-1">
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
						className="w-10 h-10 rounded-full bg-white text-neverland-green font-bold shadow-sm"
					>
						-
					</button>
					<span className="text-xl font-black w-8 text-center">
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
						className="w-10 h-10 rounded-full bg-neverland-green text-white font-bold shadow-sm"
					>
						+
					</button>
				</div>
			</div>

			<p className="text-sm font-bold text-gray-400 mb-2 px-2 flex justify-between items-center">
				<span>Elige el Menú Infantil:</span>
				{formData.fecha &&
					[0, 5, 6].includes(new Date(formData.fecha).getDay()) && (
						<span className="text-[10px] text-neverland-green bg-green-50 px-2 py-1 rounded-lg animate-pulse">
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
						className={`relative overflow-hidden rounded-3xl border-2 transition-all cursor-pointer ${
							formData.niños.menuId === menu.id
								? 'border-neverland-green bg-green-50 shadow-md'
								: 'border-white bg-white shadow-sm'
						}`}
					>
						<div className="p-4 relative z-10">
							<div className="flex justify-between items-start mb-2">
								<span
									className={`font-display font-black text-lg ${formData.niños.menuId === menu.id ? 'text-neverland-green' : 'text-gray-800'}`}
								>
									{menu.name}
								</span>
								<span className="font-black text-xl bg-white px-2 py-1 rounded-lg text-neverland-green shadow-sm">
									{menu.price}€
								</span>
							</div>
							<div className="text-sm text-gray-600 mb-1 space-y-2">
								<p className="flex items-baseline gap-2 leading-tight">
									<strong className="text-neverland-green font-black uppercase text-[9px] tracking-widest shrink-0">
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
												<div className="w-1 h-1 rounded-full bg-neverland-green/40" />
												{item.replace(/^-/, '').trim()}
											</span>
										))}
								</div>
							</div>
						</div>
						{formData.niños.menuId === menu.id && (
							<div className="absolute top-0 right-0 p-4">
								<CheckCircle
									className="text-neverland-green"
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
