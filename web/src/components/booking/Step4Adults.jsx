import React from 'react';
import { Minus, Plus } from 'lucide-react';

const Step4Adults = ({ formData, setFormData, ADULT_MENU_OPTIONS }) => {
	return (
		<div>
			<h2 className="text-xl font-display font-bold text-text-black text-center mb-2">
				Para los Mayores
			</h2>

			<div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center mb-2 shrink-0">
				<div>
					<p className="font-bold text-sm text-gray-800">Adultos Estimados</p>
					<p className="text-[10px] text-gray-400">Aproximado</p>
				</div>
				<div className="flex items-center gap-2 bg-gray-50 rounded-full p-1">
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
						className="w-8 h-8 rounded-full bg-white text-gray-600 font-bold shadow-sm flex items-center justify-center"
					>
						<Minus size={14} />
					</button>
					<span className="text-lg font-black w-6 text-center bg-transparent">
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
						className="w-8 h-8 rounded-full bg-gray-800 text-white font-bold shadow-sm flex items-center justify-center"
					>
						<Plus size={14} />
					</button>
				</div>
			</div>

			{formData.adultos.cantidad === 0 && (
				<p className="text-[10px] text-red-500 font-bold ml-2 -mt-1 mb-2 animate-pulse">
					⚠️ Es necesario al menos 1 adulto responsable
				</p>
			)}

			<p className="text-xs font-bold text-gray-400 mb-1.5 px-2">
				Añadir Comida (Opcional):
			</p>
			<div className="space-y-2">
				{ADULT_MENU_OPTIONS.map((item) => {
					const qty = formData.adultos.comida[item.id] || 0;
					return (
						<div
							key={item.id}
							className={`p-3 rounded-2xl border-2 transition-all ${
								qty > 0
									? 'border-gray-800 bg-gray-50'
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
								<span className="font-black text-base text-gray-800">
									{item.precio}€
								</span>
							</div>
							<div className="flex justify-end mt-1">
								<div className="flex items-center gap-2 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
									<button
										onClick={() => {
											const newComida = { ...formData.adultos.comida };
											if (newComida[item.id] > 0) {
												newComida[item.id]--;
												if (newComida[item.id] === 0) delete newComida[item.id];
												setFormData({
													...formData,
													adultos: { ...formData.adultos, comida: newComida },
												});
											}
										}}
										className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${qty > 0 ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-300'}`}
										disabled={qty === 0}
									>
										<Minus size={12} />
									</button>
									<span
										className={`text-base font-bold w-5 text-center ${qty > 0 ? 'text-gray-800' : 'text-gray-300'}`}
									>
										{qty}
									</span>
									<button
										onClick={() => {
											const newComida = { ...formData.adultos.comida };
											newComida[item.id] = (newComida[item.id] || 0) + 1;
											setFormData({
												...formData,
												adultos: { ...formData.adultos, comida: newComida },
											});
										}}
										className="w-7 h-7 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-black transition-colors"
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
