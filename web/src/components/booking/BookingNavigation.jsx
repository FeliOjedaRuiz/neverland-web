import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const BookingNavigation = ({
	step,
	loading,
	onNext,
	onBack,
	showBack,
	onSubmit,
	isValid,
	totalSteps = 8,
	submitLabel = 'Solicitar reserva',
	nextLabel = 'Siguiente',
	customAction,
	hideNext = false,
	validationMsg,
}) => {
	const [showError, setShowError] = useState(false);
	const [shake, setShake] = useState(false);

	const displayMsg = validationMsg || 'Completa los campos obligatorios para continuar';

	const handleNextClick = useCallback(() => {
		if (isValid) {
			onNext();
		} else {
			// Mostrar mensaje y animación shake
			setShowError(true);
			setShake(true);
			setTimeout(() => setShake(false), 500);
			setTimeout(() => setShowError(false), 3500);
		}
	}, [isValid, onNext]);

	if (step >= totalSteps + 1) return null;

	return (
		<div className="p-3 bg-white border-t border-gray-100 flex justify-between items-center shrink-0 z-20 shadow-lg sm:shadow-none">
			{showBack ? (
				<button
					onClick={onBack}
					className="px-4 py-2 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors text-sm flex items-center gap-1.5"
				>
					<ChevronLeft size={16} />
					Atrás
				</button>
			) : (
				<div className="w-12"></div>
			)}

			{customAction ? (
				customAction
			) : step < totalSteps ? (
				<div className="flex flex-col items-end gap-1.5 relative">
					{/* Error message — visible on tap/click, works on mobile */}
					{showError && !hideNext && (
						<div
							className="absolute bottom-full right-0 mb-2 flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl whitespace-nowrap border border-red-200 shadow-md"
							style={{ animation: 'fadeInUp 0.2s ease' }}
						>
							<AlertCircle size={13} className="shrink-0" />
							{displayMsg}
						</div>
					)}

					<style>{`
						@keyframes fadeInUp {
							from { opacity: 0; transform: translateY(6px); }
							to   { opacity: 1; transform: translateY(0); }
						}
						@keyframes shake {
							0%, 100% { transform: translateX(0); }
							20%       { transform: translateX(-5px); }
							40%       { transform: translateX(5px); }
							60%       { transform: translateX(-4px); }
							80%       { transform: translateX(4px); }
						}
					`}</style>

					{!hideNext && (
						<button
							onClick={handleNextClick}
							style={shake ? { animation: 'shake 0.45s ease' } : {}}
							className={`px-5 py-2 rounded-full font-display font-bold text-sm sm:text-base shadow-md transition-all flex items-center gap-1.5 ${
								isValid
									? 'bg-energy-orange text-white hover:shadow-lg hover:scale-105 active:scale-95'
									: 'bg-gray-200 text-gray-400 cursor-pointer'
							}`}
						>
							{nextLabel} <ChevronRight size={16} />
						</button>
					)}
				</div>
			) : (
				<button
					onClick={onSubmit}
					disabled={loading}
					className="px-5 py-2 rounded-full bg-neverland-green text-white font-display font-bold text-sm shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-70 flex items-center gap-2 whitespace-nowrap"
				>
					{loading ? (
						<>
							<Loader2 size={16} className="animate-spin" /> Procesando...
						</>
					) : (
						<>
							{submitLabel} <CheckCircle size={16} />
						</>
					)}
				</button>
			)}
		</div>
	);
};

export default BookingNavigation;
