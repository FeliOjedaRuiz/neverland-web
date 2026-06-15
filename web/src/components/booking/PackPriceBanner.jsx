import React from 'react';

const PackPriceBanner = ({ formData, prices }) => {
	const personajes = formData?.extras?.personajes || [];
	const count = personajes.length;

	if (count === 0) return null;

	const unitPrice = prices?.preciosExtras?.personaje || 40;
	const packPrice = prices?.preciosExtras?.precioPack3Personajes || 100;
	const isPackActive = count === 3;

	let display;
	if (count === 1) display = `${unitPrice}€`;
	else if (count === 2) display = `${unitPrice * 2}€`;
	else display = `Pack 3: ${packPrice}€`;

	const savings = (unitPrice * 3) - packPrice;

	return (
		<div className="shrink-0 z-40 px-4 py-3 text-center border-t border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 shadow-[0_-4px_20px_-4px_rgba(168,85,247,0.15)]">
			<div className="flex items-center justify-center gap-2">
				<span className="font-black text-purple-700 text-base sm:text-lg">
					{display}
				</span>
				{isPackActive && (
					<span className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-gradient-to-r from-pink-500 to-purple-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
						Ahorras {savings}€
					</span>
				)}
			</div>
		</div>
	);
};

export default PackPriceBanner;
