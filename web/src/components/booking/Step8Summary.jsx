import React from 'react';

const Step8Summary = ({
	formData,
	prices,
	calculateTotal,
	getExtendedTime,
	childrenMenusWithPrices,
	workshops,
}) => {
	return (
		<div>
			<h2 className="text-xl font-display font-bold text-text-black text-center mb-2">
				Resumen Final
			</h2>
			<div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4 relative overflow-hidden">
				<div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-neverland-green via-energy-orange to-sun-yellow"></div>

				{/* Client Info */}
				<div className="flex justify-between items-start border-b border-gray-100 pb-3">
					<div>
						<p className="text-sm text-gray-400 font-bold">Reserva para</p>
						<p className="font-bold text-lg text-gray-800">
							{formData.cliente.nombreNiño} ({formData.cliente.edadNiño} años)
						</p>
						<p className="text-sm text-gray-600">
							{formData.fecha} • {getExtendedTime()}
						</p>
					</div>
					<div className="bg-green-100 text-neverland-green px-3 py-1 rounded-full text-xs font-bold">
						{formData.turno}
					</div>
				</div>

				{/* Detail List */}
				<div className="space-y-3 text-sm pr-2">
					<div className="flex justify-between text-energy-orange">
						<span>
							{childrenMenusWithPrices?.find(
								(m) => String(m.id) === String(formData.niños.menuId),
							)?.name || `Menú Infantil ${formData.niños.menuId}`}{' '}
							x {formData.niños.cantidad}
						</span>
						<span className="font-bold">
							{(
								formData.niños.cantidad *
								(childrenMenusWithPrices?.find(
									(m) => String(m.id) === String(formData.niños.menuId),
								)?.price || 0)
							).toFixed(2)}
							€
						</span>
					</div>
					{formData.fecha &&
						[0, 5, 6].includes(new Date(formData.fecha).getDay()) && (
							<div className="flex justify-between text-neverland-green italic text-xs bg-green-50/50 p-2 rounded-lg">
								<span>Plus Fin de Semana (Vie-Dom)</span>
								<span className="font-bold">
									+
									{(
										formData.niños.cantidad * (prices.plusFinDeSemana || 1.5)
									).toFixed(2)}
									€
								</span>
							</div>
						)}

					{/* Adult Food Summary */}
					{formData.adultos.comida?.length > 0 && (
						<div className="flex justify-between text-energy-orange">
							<span>
								Raciones adultos x
								{formData.adultos.comida.reduce(
									(acc, curr) => acc + curr.cantidad,
									0,
								)}
							</span>
							<span className="font-bold">
								{formData.adultos.comida
									.reduce(
										(acc, curr) =>
											acc + curr.cantidad * (curr.precioUnitario || 0),
										0,
									)
									.toFixed(2)}
								€
							</span>
						</div>
					)}
					{formData.extras.taller !== 'ninguno' && (
						<div className="flex justify-between text-rec-blue border-t border-blue-50 pt-2">
							<span>Actividad: {formData.extras.taller}</span>
							<span className="font-bold">
								{(() => {
									const workshop = (workshops || []).find(
										(w) => w.name === formData.extras.taller,
									);
									if (!workshop) return '0';
									return formData.niños.cantidad >= 15
										? workshop.pricePlus
										: workshop.priceBase;
								})()}
								€
							</span>
						</div>
					)}
					{formData.extras.personaje !== 'ninguno' && (
						<div className="flex justify-between text-rec-blue">
							<span>Personaje: {formData.extras.personaje}</span>
							<span className="font-bold">
								{prices.preciosExtras?.personaje || 0}€
							</span>
						</div>
					)}
					{formData.extras.pinata && (
						<div className="flex justify-between text-sun-yellow">
							<span>Piñata</span>
							<span className="font-bold">
								{prices.preciosExtras?.pinata || 0}€
							</span>
						</div>
					)}
					{formData.extras.extension > 0 && (
						<div className="flex justify-between text-purple-600 italic text-xs pt-1 border-t border-purple-50 mt-1">
							<span>Tiempo Extra (+{formData.extras.extension}m)</span>
							<span className="font-bold">
								{formData.extras.extension === 30
									? prices.preciosExtras?.extension30 || 0
									: prices.preciosExtras?.extension60 || 0}
								€
							</span>
						</div>
					)}
					{formData.extras.observaciones && (
						<div className="text-gray-600 text-xs pt-2 border-t border-gray-100 mt-2">
							<span className="font-bold block mb-1">Notas:</span>
							<p className="italic bg-gray-50 rounded-lg p-2 max-h-24 overflow-y-auto w-full break-words">
								{formData.extras.observaciones}
							</p>
						</div>
					)}
				</div>

				{/* Total */}
				<div className="mt-auto pt-4 border-t border-dashed border-gray-200">
					<div className="flex justify-between items-end">
						<span className="text-gray-500 font-medium">Total Estimado</span>
						<span className="text-4xl font-display font-black text-neverland-green tracking-tight">
							{calculateTotal().toFixed(2)}€
						</span>
					</div>
				</div>
			</div>
			<p className="text-[10px] text-center text-gray-400 mt-2 px-4">
				Revisaremos disponibilidad y te contactaremos para confirmar.
			</p>
		</div>
	);
};

export default Step8Summary;
