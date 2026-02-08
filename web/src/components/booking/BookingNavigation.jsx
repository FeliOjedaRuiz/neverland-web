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
	if (step >= 9) return null;

	return (
		<div className="fixed bottom-0 left-0 w-full sm:static p-4 bg-white border-t border-gray-100 flex justify-between items-center shrink-0 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sm:z-20">
			{showBack ? (
				<button
					onClick={onBack}
					className="px-6 py-2.5 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
				>
					<ChevronLeft size={18} />
					Atrás
				</button>
			) : (
				<div className="w-12"></div> // Spacer
			)}

			{step < 8 ? (
				<button
					onClick={onNext}
					disabled={!isValid}
					className="px-6 py-2.5 rounded-full bg-energy-orange text-white font-display font-bold text-base shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none disabled:scale-100 flex items-center gap-2"
				>
					Siguiente <ChevronRight size={18} />
				</button>
			) : (
				<button
					onClick={onSubmit}
					disabled={loading}
					className="px-8 py-3 rounded-full bg-neverland-green text-white font-display font-bold text-base shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-70 flex items-center gap-2"
				>
					{loading ? (
						<>
							<Loader2 className="animate-spin" /> Procesando...
						</>
					) : (
						<>
							Confirmar Reserva <CheckCircle size={18} />
						</>
					)}
				</button>
			)}
		</div>
	);
};

export default BookingNavigation;
