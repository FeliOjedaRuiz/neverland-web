import React from 'react';

const BookingHeader = ({ step, stepsList }) => {
	if (step >= 9) return null;

	return (
		<div className="shrink-0 px-4 pt-2 pb-2 z-10 bg-surface sm:bg-transparent transition-all">
			<h1 className="text-xl sm:text-2xl font-display font-black text-neverland-green text-center leading-tight">
				Reserva tu Fiesta
			</h1>
			<div className="flex justify-between items-center relative mt-3 px-2 mx-auto max-w-lg">
				<div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2 rounded-full"></div>
				<div
					className="absolute top-1/2 left-0 h-0.5 bg-neverland-green -z-10 -translate-y-1/2 rounded-full transition-all duration-500"
					style={{ width: `${((step - 1) / 7) * 100}%` }}
				></div>
				{stepsList.map((s) => {
					const isActive = step >= s.id;
					const isCurrent = step === s.id;
					return (
						<div key={s.id} className="relative group">
							<div
								className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
									isActive
										? 'bg-neverland-green border-neverland-green text-white scale-110'
										: 'bg-surface border-white text-gray-300'
								}`}
							>
								<s.icon size={isCurrent ? 14 : 10} />
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default BookingHeader;
