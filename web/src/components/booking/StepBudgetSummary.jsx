import React from 'react';
import { CalendarCheck } from 'lucide-react';
import {
	filterActiveCatalog,
	getCatalogItemById,
	sumCatalogPrices,
} from '../../utils/bookingUtils';

const StepBudgetSummary = ({
	formData,
	prices,
	calculateTotal,
	childrenMenusWithPrices,
	workshops,
	extrasCatalogo = [],
	onNext,
}) => {
	const total = calculateTotal();

	// Detectar si habría plus de fin de semana (sin fecha aún no sabemos)
	const plusPerKid = prices.plusFinDeSemana || 1.5;
	const plusTotal = plusPerKid * (formData.niños?.cantidad || 0);

	return (
		<div className="flex flex-col h-full flex-1 relative">
			<h2 className="text-xl font-display font-bold text-text-black text-center mb-2 shrink-0">
				Tu Presupuesto
			</h2>
			<div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4 relative overflow-hidden mb-6">
				<div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-neverland-green via-energy-orange to-sun-yellow"></div>

				{/* Detail List */}
				<div className="space-y-3 text-sm pr-2">
					{/* Children Menu */}
					<div className="flex justify-between text-energy-orange">
						<span>
							{childrenMenusWithPrices?.find(
								(m) => String(m.id) === String(formData.niños.menuId),
							)?.name || `Menú Infantil`}{' '}
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

					{/* Workshop */}
					{formData.extras.taller && formData.extras.taller !== 'ninguno' && (
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

					{/* Character */}
					{formData.extras.personajes && formData.extras.personajes.length > 0 && (
						<div className="flex flex-col gap-2 p-3 bg-purple-50/50 rounded-2xl border border-purple-100/50 mb-1">
							<div className="flex justify-between items-center">
								<div className="flex items-center gap-3">
									<div className="flex flex-col">
										<p className="text-[10px] text-purple-400 font-black uppercase tracking-widest leading-none mb-1">Visita Especial</p>
										<div className="flex flex-wrap gap-2">
											{formData.extras.personajes.map((charName, idx) => {
												const char = (prices.characters || []).find(c => (c.nombre || c.name) === charName);
												return (
													<div key={charName} className="flex items-center gap-1.5">
														<div className="w-8 h-8 rounded-lg overflow-hidden bg-white shadow-sm shrink-0 border border-purple-100">
															{char?.imageUrl ? (
																<img src={char.imageUrl} alt={charName} className="w-full h-full object-cover" />
															) : (
																<div className="w-full h-full flex items-center justify-center text-purple-200 bg-purple-50">
																	<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
																</div>
															)}
														</div>
														<span className="font-black text-purple-600 text-xs">{charName}</span>
													</div>
												);
											})}
										</div>
									</div>
								</div>
								<div className="flex flex-col items-end">
									{formData.extras.personajes.length === 3 && (
										<span className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-0.5">Pack 3</span>
									)}
									<span className="font-black text-purple-600">
										{(() => {
											const count = formData.extras.personajes.length;
											if (count === 3) return prices.preciosExtras?.precioPack3Personajes || 100;
											return (prices.preciosExtras?.personaje || 40) * count;
										})()}€
									</span>
								</div>
							</div>
						</div>
					)}

					{/* Legacy Piñata fallback for old reservations */}
					{formData.extras.pinata && (formData.extras.catalogoItemIds?.length || 0) === 0 && (
						<div className="flex justify-between text-sun-yellow">
							<span>Piñata</span>
							<span className="font-bold">
								{prices.preciosExtras?.pinata || 0}€
							</span>
						</div>
					)}

					{/* Extension */}
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

					{/* Catálogo de extras adicionales (incluye Piñata — no es caso especial) */}
					{(() => {
						const hasCatalogo = formData.extras.catalogoItemIds?.length > 0;
						const hasTaller = formData.extras.taller && formData.extras.taller !== 'ninguno';
						const hasPersonajes = (formData.extras.personajes?.length || 0) > 0;
						const hasLegacyPinata =
							formData.extras.pinata &&
							!(formData.extras.catalogoItemIds || []).includes('pinata');
						if (!hasCatalogo && !hasTaller && !hasPersonajes && !hasLegacyPinata) return null;
						const tallerSnap = formData.extras.precioTallerApplied || 0;
						const personajesSnap = formData.extras.precioPersonajeApplied || 0;
						const legacyPinataSnap = hasLegacyPinata
							? (formData.extras.precioPinataApplied || prices.preciosExtras?.pinata || 0)
							: 0;
						return (
							<div className="pt-2 border-t border-pink-50 mt-2">
								<p className="text-[10px] text-pink-400 font-black uppercase tracking-widest mb-2">
									Extras Adicionales
								</p>
								{hasCatalogo && (
									<div className="space-y-1.5">
										{formData.extras.catalogoItemIds.map((id) => {
											const item = getCatalogItemById(id, filterActiveCatalog(extrasCatalogo));
											const name = item?.nombre || id;
											const price = item ? Number(item.precio || 0) : 0;
											return (
												<div key={id} className="flex justify-between text-pink-600 text-xs">
													<span className="truncate pr-2">{name}</span>
													<span className="font-bold shrink-0">{price.toFixed(2)}€</span>
												</div>
											);
										})}
									</div>
								)}
								<div className="flex justify-between text-pink-700 text-xs font-bold mt-2 pt-2 border-t border-pink-100">
									<span>Subtotal actividades y extras</span>
									<span>
										{(
											tallerSnap +
											personajesSnap +
											legacyPinataSnap +
											sumCatalogPrices(
												formData.extras.catalogoItemIds || [],
												filterActiveCatalog(extrasCatalogo),
											)
										).toFixed(2)}
										€
									</span>
								</div>
							</div>
						);
					})()}

					{/* Allergens */}
					{formData.extras.alergenos && (
						<div className="text-energy-orange text-xs pt-2 border-t border-orange-100 mt-2">
							<span className="font-bold flex items-center gap-1 mb-1">
								<span className="text-[10px]">⚠️</span> Alérgenos:
							</span>
							<p className="italic bg-orange-50 rounded-lg p-2 max-h-24 overflow-y-auto w-full wrap-break-word">
								{formData.extras.alergenos}
							</p>
						</div>
					)}

					{/* Notes */}
					{formData.extras.observaciones && (
						<div className="text-gray-600 text-xs pt-2 border-t border-gray-100 mt-2">
							<span className="font-bold block mb-1">Notas:</span>
							<p className="italic bg-gray-50 rounded-lg p-2 max-h-24 overflow-y-auto w-full wrap-break-word">
								{formData.extras.observaciones}
							</p>
						</div>
					)}
				</div>

				{/* Total — Entre semana */}
				<div className="mt-auto pt-4 border-t border-dashed border-gray-200">
					<div className="flex justify-between items-center">
						<div>
							<span className="text-gray-500 font-medium text-sm block">Lunes a Jueves</span>
							<span className="text-[10px] text-gray-400">Precio entre semana</span>
						</div>
						<span className="text-4xl font-display font-black text-neverland-green tracking-tight">
							{total.toFixed(2)}€
						</span>
					</div>
				</div>

				{/* Total — Fin de semana */}
				<div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl border border-amber-100">
					<div>
						<span className="text-amber-700 font-bold text-sm block">Viernes a Domingo</span>
						<span className="text-[10px] text-amber-500">+{plusPerKid.toFixed(2)}€/niño</span>
					</div>
					<span className="text-2xl font-display font-black text-amber-600 tracking-tight">
						{(total + plusTotal).toFixed(2)}€
					</span>
				</div>
			</div>

			{/* Sticky CTA Footer */}
			<div className="sticky bottom-0 pb-4 pt-4 sm:pb-6 left-0 right-0 mt-auto bg-white/95 backdrop-blur-md z-10 border-t border-gray-100 shadow-[0_-15px_15px_-15px_rgba(0,0,0,0.1)] -mx-4 px-4 sm:-mx-6 sm:px-6">
				<div className="text-center mb-3">
					<p className="text-sm font-bold text-neverland-green flex items-center justify-center gap-2">
						<CalendarCheck size={18} />
						¡No te quedes sin lugar!
					</p>
				</div>
				<button
					onClick={onNext}
					className="w-full py-1.5 rounded-2xl bg-neverland-green text-white font-display font-black text-2xl shadow-lg shadow-green-500/20 hover:shadow-2xl hover:shadow-green-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-1"
				>
					Reserva tu fecha
				</button>
			</div>
		</div>
	);
};

export default StepBudgetSummary;
