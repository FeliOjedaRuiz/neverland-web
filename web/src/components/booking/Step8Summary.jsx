import React from 'react';

const Step8Summary = ({
	formData,
	prices,
	calculateTotal,
	getExtendedTime,
	CHILDREN_MENUS,
	WORKSHOPS,
	ADULT_MENU_OPTIONS,
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
				<div className="space-y-2 text-sm text-gray-600 pr-2">
					<div className="flex justify-between">
						<span>
							{formData.niños.cantidad} x{' '}
							{CHILDREN_MENUS.find((m) => m.id === formData.niños.menuId)?.name}
						</span>
						<span className="font-bold">
							{(
								formData.niños.cantidad *
								(CHILDREN_MENUS.find((m) => m.id === formData.niños.menuId)
									?.price || 0)
							).toFixed(2)}
							€
						</span>
					</div>
					{formData.fecha &&
						[0, 5, 6].includes(new Date(formData.fecha).getDay()) && (
							<div className="flex justify-between text-neverland-green italic text-xs">
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
					{Object.entries(formData.adultos.comida).map(([id, qty]) => {
						const item = ADULT_MENU_OPTIONS.find((o) => o.id === id);
						return (
							<div key={id} className="flex justify-between">
								<span>
									{qty} x {item?.nombre}
								</span>
								<span className="font-bold">
									{(qty * item?.precio).toFixed(2)}€
								</span>
							</div>
						);
					})}
					{formData.extras.taller !== 'ninguno' && (
						<div className="flex justify-between text-energy-orange">
							<span>Actividad: {formData.extras.taller}</span>
							<span className="font-bold">
								{(() => {
									const workshop = WORKSHOPS.find(
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
								{prices.preciosExtras.personaje}€
							</span>
						</div>
					)}
					{formData.extras.pinata && (
						<div className="flex justify-between text-sun-yellow">
							<span>Piñata</span>
							<span className="font-bold">{prices.preciosExtras.pinata}€</span>
						</div>
					)}
					{formData.extras.extension > 0 && (
						<div className="flex justify-between">
							<span>Tiempo Extra (+{formData.extras.extension}m)</span>
							<span className="font-bold">
								{formData.extras.extension === 30
									? prices.preciosExtras.extension30
									: prices.preciosExtras.extension60}
								€
							</span>
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
