import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';

const Step7Extras = ({ formData, setFormData, getExtendedTime }) => {
	return (
		<div className="flex flex-col h-full">
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
							<p className="font-bold text-gray-800">Tiempo Extra</p>
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
										},
									})
								}
								className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${
									formData.extras.extension === mins
										? 'border-purple-500 bg-purple-50 text-purple-700'
										: 'border-gray-100 bg-gray-50 text-gray-400 hover:border-purple-200'
								}`}
							>
								{mins === 0 ? 'Sin extra' : `+${mins} min`}
							</button>
						))}
					</div>
					{formData.extras.extension > 0 && (
						<p className="text-xs text-center text-purple-600 mt-2 font-medium bg-purple-50 p-2 rounded-lg">
							Nuevo horario: {getExtendedTime()}
						</p>
					)}
				</div>

				{/* Pinata */}
				<div
					onClick={() =>
						setFormData({
							...formData,
							extras: {
								...formData.extras,
								pinata: !formData.extras.pinata,
							},
						})
					}
					className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${
						formData.extras.pinata
							? 'border-sun-yellow bg-yellow-50 shadow-md'
							: 'border-white bg-white shadow-sm'
					}`}
				>
					<div className="flex items-center gap-3">
						<div
							className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-white shadow-sm`}
						>
							🪅
						</div>
						<div className="text-left">
							<p className="font-bold text-gray-800 text-lg">
								Piñata Neverland
							</p>
							<p className="text-sm text-gray-500">
								Incluye caramelos y sorpresas
							</p>
						</div>
					</div>
					<div
						className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
							formData.extras.pinata
								? 'bg-sun-yellow border-sun-yellow text-white'
								: 'border-gray-200'
						}`}
					>
						{formData.extras.pinata && <CheckCircle size={16} />}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Step7Extras;
