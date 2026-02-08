import React from 'react';
import { CheckCircle } from 'lucide-react';

const Step5Workshops = ({ formData, setFormData, WORKSHOPS }) => {
	return (
		<div className="flex flex-col h-full">
			<h2 className="text-xl font-display font-bold text-text-black text-center mb-4">
				Talleres Mágicos
			</h2>
			<div className="space-y-3 overflow-y-auto pb-4">
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
						<span className="font-bold text-gray-600">Sin Taller</span>
						{formData.extras.taller === 'ninguno' && (
							<CheckCircle
								className="text-gray-500"
								fill="currentColor"
								stroke="white"
							/>
						)}
					</div>
				</div>

				{WORKSHOPS.map((workshop) => (
					<div
						key={workshop.id}
						onClick={() =>
							setFormData({
								...formData,
								extras: { ...formData.extras, taller: workshop.id },
							})
						}
						className={`relative overflow-hidden rounded-3xl border-2 transition-all cursor-pointer ${
							formData.extras.taller === workshop.id
								? 'border-energy-orange bg-orange-50 shadow-md'
								: 'border-white bg-white shadow-sm'
						}`}
					>
						<div className="p-4 relative z-10">
							<div className="flex justify-between items-start mb-2">
								<span
									className={`font-display font-black text-lg ${
										formData.extras.taller === workshop.id
											? 'text-energy-orange'
											: 'text-gray-800'
									}`}
								>
									{workshop.name}
								</span>
								<div className="text-right">
									<span className="font-black text-xl bg-white px-2 py-1 rounded-lg text-energy-orange shadow-sm block">
										{workshop.priceBase}€
									</span>
									<span className="text-[10px] text-gray-500 font-bold">
										Base
									</span>
								</div>
							</div>
							<p className="text-sm text-gray-600 italic opacity-80 mb-2">
								"{workshop.desc}"
							</p>
							{formData.niños.cantidad > 25 && (
								<div className="text-xs bg-white/60 p-2 rounded-lg text-energy-orange font-bold">
									⚠️ +25 niños: {workshop.pricePlus}€
								</div>
							)}
						</div>
						{formData.extras.taller === workshop.id && (
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

export default Step5Workshops;
