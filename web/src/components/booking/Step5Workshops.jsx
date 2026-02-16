import React from 'react';
import { CheckCircle } from 'lucide-react';

const Step5Workshops = ({ formData, setFormData, WORKSHOPS }) => {
	return (
		<div>
			<h2 className="text-xl font-display font-bold text-text-black text-center mb-4">
				Actividades
			</h2>
			<div className="space-y-3">
				<div
					onClick={() =>
						setFormData({
							...formData,
							extras: { ...formData.extras, taller: 'ninguno' },
						})
					}
					className={`p-4 rounded-3xl border-2 transition-all cursor-pointer ${
						formData.extras.taller === 'ninguno'
							? 'border-gray-400 bg-gray-100'
							: 'border-white bg-white shadow-sm'
					}`}
				>
					<div className="flex justify-between items-center">
						<span className="font-bold text-gray-600">Sin actividad</span>
						{formData.extras.taller === 'ninguno' && (
							<CheckCircle
								className="text-gray-500"
								fill="currentColor"
								stroke="white"
							/>
						)}
					</div>
				</div>

				{/* Separator Text */}
				<div className="col-span-1 sm:col-span-2 lg:col-span-3 py-2">
					<p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">
						Puedes seleccionar una actividad
					</p>
				</div>

				{WORKSHOPS.map((workshop) => (
					<div
						key={workshop.id}
						onClick={() =>
							setFormData({
								...formData,
								extras: { ...formData.extras, taller: workshop.name },
							})
						}
						className={`relative overflow-hidden rounded-3xl border-2 transition-all cursor-pointer ${
							formData.extras.taller === workshop.id
								? 'border-energy-orange bg-orange-50 shadow-md'
								: 'border-white bg-white shadow-sm'
						}`}
					>
						{/* Image Placeholder */}
						<div className="w-full h-32 bg-gray-100 flex items-center justify-center relative overflow-hidden">
							<div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent"></div>
							<span className="text-gray-300 text-xs font-bold uppercase tracking-widest">
								Foto Ilustrativa
							</span>
						</div>

						<div className="p-4 relative z-10">
							<div className="flex justify-between items-start mb-2">
								<span
									className={`font-display font-black text-lg ${
										formData.extras.taller === workshop.name
											? 'text-energy-orange'
											: 'text-gray-800'
									}`}
								>
									{workshop.name}
								</span>
								<div className="text-right">
									<span className="font-black text-xl bg-white px-2 py-1 rounded-lg text-energy-orange shadow-sm block">
										{formData.niños.cantidad >= 15
											? workshop.pricePlus
											: workshop.priceBase}
										€
									</span>
								</div>
							</div>
							<p className="text-sm text-gray-600 italic opacity-80 mb-2">
								"{workshop.desc}"
							</p>
							{formData.niños.cantidad >= 15 && (
								<div className="text-[10px] bg-energy-orange/10 p-2 rounded-lg text-energy-orange font-bold animate-in slide-in-from-left-2">
									✨ Incluye suplemento por grupo (+15 niños)
								</div>
							)}
						</div>
						{formData.extras.taller === workshop.id && (
							<div className="absolute top-2 right-2 z-20">
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

export default Step5Workshops;
