import React from 'react';
import { ChevronLeft, ChevronRight, Loader2, CheckCircle } from 'lucide-react';

const BookingNavigation = ({
	step,
	loading,
	onNext,
	onBack,
	showBack,
	onSubmit,
	isValid,
}) => {
	const getValidationMsg = () => {
		if (step === 1) return 'Selecciona fecha y turno';
		if (step === 2) return 'Completa todos los datos';
		if (step === 4) return 'Mínimo 1 adulto responsable';
		return 'Completar campos';
	};

	if (step >= 9) return null;

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
				<div className="w-12"></div> // Spacer
			)}

			{step < 8 ? (
				<div className="flex flex-col items-end gap-1 relative group">
					{!isValid && (
						<span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-red-50 text-red-500 text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-red-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
							{getValidationMsg()}
						</span>
					)}
					<button
						onClick={onNext}
						disabled={!isValid}
						className="px-5 py-2 rounded-full bg-energy-orange text-white font-display font-bold text-sm sm:text-base shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-1.5"
					>
						Siguiente <ChevronRight size={16} />
					</button>
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
							Solicitar reserva <CheckCircle size={16} />
						</>
					)}
				</button>
			)}
		</div>
	);
};

export default BookingNavigation;
