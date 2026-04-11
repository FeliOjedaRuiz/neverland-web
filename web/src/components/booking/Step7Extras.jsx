import React from 'react';
import { Clock, CheckCircle, MessageSquare } from 'lucide-react';

const Step7Extras = ({ formData, setFormData, prices }) => {
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
		</div>
	);
};

export default Step7Extras;
