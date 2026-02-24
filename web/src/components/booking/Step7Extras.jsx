import React from 'react';
import { Clock, CheckCircle, MessageSquare } from 'lucide-react';

const Step7Extras = ({ formData, setFormData, getExtendedTime, prices }) => {
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
								<span>{mins === 0 ? 'Sin extra' : `+${mins} min`}</span>
								{mins > 0 && (
									<span
										className={`text-[9px] px-1.5 rounded-full ${formData.extras.extension === mins ? 'bg-purple-200 text-purple-700' : 'bg-gray-200 text-gray-500'}`}
									>
										{getPriceForExtension(mins)}€
									</span>
								)}
							</button>
						))}
					</div>

					{/* Turn 2 Special Options */}
					{formData.turno === 'T2' && formData.extras.extension > 0 && (
						<div className="mt-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
							<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-2">
								¿Cómo prefieres ampliar el tiempo?
							</p>
							<div className="grid grid-cols-1 gap-2">
								{formData.extras.extension === 30 && (
									<>
										<button
											onClick={() =>
												setFormData({
													...formData,
													extras: {
														...formData.extras,
														extensionType: 'before',
													},
												})
											}
											className={`py-2 px-4 rounded-xl text-xs font-bold border-2 transition-all flex justify-between items-center ${
												formData.extras.extensionType === 'before'
													? 'border-purple-500 bg-white text-purple-700 shadow-sm'
													: 'border-transparent bg-white/50 text-gray-500 hover:border-purple-200'
											}`}
										>
											<span>Empezar 30m antes</span>
											<span className="opacity-50 font-normal">
												17:30 - 20:00
											</span>
										</button>
										<button
											onClick={() =>
												setFormData({
													...formData,
													extras: {
														...formData.extras,
														extensionType: 'after',
													},
												})
											}
											className={`py-2 px-4 rounded-xl text-xs font-bold border-2 transition-all flex justify-between items-center ${
												formData.extras.extensionType === 'after'
													? 'border-purple-500 bg-white text-purple-700 shadow-sm'
													: 'border-transparent bg-white/50 text-gray-500 hover:border-purple-200'
											}`}
										>
											<span>Terminar 30m después</span>
											<span className="opacity-50 font-normal">
												18:00 - 20:30
											</span>
										</button>
									</>
								)}
								{formData.extras.extension === 60 && (
									<>
										<button
											onClick={() =>
												setFormData({
													...formData,
													extras: {
														...formData.extras,
														extensionType: 'before',
													},
												})
											}
											className={`py-2 px-4 rounded-xl text-xs font-bold border-2 transition-all flex justify-between items-center ${
												formData.extras.extensionType === 'before'
													? 'border-purple-500 bg-white text-purple-700 shadow-sm'
													: 'border-transparent bg-white/50 text-gray-500 hover:border-purple-200'
											}`}
										>
											<span>Empezar 1h antes</span>
											<span className="opacity-50 font-normal">
												17:00 - 20:00
											</span>
										</button>
										<button
											onClick={() =>
												setFormData({
													...formData,
													extras: {
														...formData.extras,
														extensionType: 'after',
													},
												})
											}
											className={`py-2 px-4 rounded-xl text-xs font-bold border-2 transition-all flex justify-between items-center ${
												formData.extras.extensionType === 'after'
													? 'border-purple-500 bg-white text-purple-700 shadow-sm'
													: 'border-transparent bg-white/50 text-gray-500 hover:border-purple-200'
											}`}
										>
											<span>Terminar 1h después</span>
											<span className="opacity-50 font-normal">
												18:00 - 21:00
											</span>
										</button>
										<button
											onClick={() =>
												setFormData({
													...formData,
													extras: { ...formData.extras, extensionType: 'both' },
												})
											}
											className={`py-2 px-4 rounded-xl text-xs font-bold border-2 transition-all flex justify-between items-center ${
												formData.extras.extensionType === 'both'
													? 'border-purple-500 bg-white text-purple-700 shadow-sm'
													: 'border-transparent bg-white/50 text-gray-500 hover:border-purple-200'
											}`}
										>
											<span>30m antes y 30m después</span>
											<span className="opacity-50 font-normal">
												17:30 - 20:30
											</span>
										</button>
									</>
								)}
							</div>
						</div>
					)}

					<p
						className={`text-xs text-center mt-3 font-medium p-2 rounded-lg transition-all ${
							formData.extras.extension > 0
								? 'text-purple-600 bg-purple-50'
								: 'text-gray-400 bg-gray-50/50'
						}`}
					>
						Horario previsto:{' '}
						<span className="font-black">{getExtendedTime()}</span>
					</p>
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
							<p className="font-bold text-gray-800">Observaciones</p>
							<p className="text-xs text-gray-500">
								¿Algo extra que debamos saber?
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
									observaciones: e.target.value,
								},
							})
						}
						placeholder="Aquí puedes agregar alergias u otras cosas que quieras comentarnos..."
						className="w-full min-h-[100px] p-3 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm resize-none focus:outline-none focus:border-blue-300 focus:bg-white transition-all text-gray-700"
					/>
				</div>
			</div>
		</div>
	);
};

export default Step7Extras;
