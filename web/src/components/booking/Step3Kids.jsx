import React from 'react';
import { CheckCircle } from 'lucide-react';

const Step3Kids = ({ formData, setFormData, CHILDREN_MENUS }) => {
	return (
		<div className="flex flex-col h-full">
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

			<p className="text-sm font-bold text-gray-400 mb-2 px-2">
				Elige el Menú Infantil:
			</p>
			<div className="space-y-3 overflow-y-auto pb-4">
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
							<div className="text-sm text-gray-600 mb-3 space-y-1">
								<p>
									<strong className="text-neverland-green">Principal:</strong>{' '}
									{menu.main}
								</p>
								<p className="text-xs italic opacity-70">"{menu.desc}"</p>
							</div>
							<div className="bg-white/60 p-2 rounded-xl text-xs text-gray-500 flex gap-2 items-center">
								<span className="shrink-0 font-bold">Incluye:</span> Bebida,
								Tarta y Chuches.
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
