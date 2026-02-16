import React from 'react';
import { Search, CheckCircle } from 'lucide-react';

const Step6Characters = ({
	formData,
	setFormData,
	CHARACTERS,
	charSearch,
	setCharSearch,
}) => {
	const filteredChars = CHARACTERS.filter((c) =>
		c.toLowerCase().includes(charSearch.toLowerCase()),
	);

	return (
		<div>
			<h2 className="text-xl font-display font-bold text-text-black text-center mb-4">
				Visita Especial
			</h2>

			<div className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-2 mb-4 shrink-0 shadow-sm focus-within:ring-2 focus-within:ring-rec-blue transition-all">
				<Search className="text-gray-300" size={20} />
				<input
					className="w-full bg-transparent outline-none font-medium text-gray-700 placeholder:text-gray-300"
					placeholder="Buscar personaje..."
					value={charSearch}
					onChange={(e) => setCharSearch(e.target.value)}
				/>
			</div>

			<div className="space-y-2">
				<div
					onClick={() =>
						setFormData({
							...formData,
							extras: { ...formData.extras, personaje: 'ninguno' },
						})
					}
					className={`p-4 rounded-3xl border-2 transition-all cursor-pointer ${
						formData.extras.personaje === 'ninguno'
							? 'border-gray-400 bg-gray-100'
							: 'border-white bg-white shadow-sm'
					}`}
				>
					<div className="flex justify-between items-center">
						<span className="font-bold text-gray-600">Sin Visita</span>
						{formData.extras.personaje === 'ninguno' && (
							<CheckCircle
								className="text-gray-500"
								fill="currentColor"
								stroke="white"
							/>
						)}
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2">
					{filteredChars.map((char) => (
						<div
							key={char}
							onClick={() =>
								setFormData({
									...formData,
									extras: { ...formData.extras, personaje: char },
								})
							}
							className={`p-3 rounded-2xl border-2 transition-all cursor-pointer relative ${
								formData.extras.personaje === char
									? 'border-rec-blue bg-blue-50 shadow-md'
									: 'border-white bg-white shadow-sm hover:border-blue-100'
							}`}
						>
							<span
								className={`font-bold text-sm ${
									formData.extras.personaje === char
										? 'text-rec-blue'
										: 'text-gray-700'
								}`}
							>
								{char}
							</span>
							{formData.extras.personaje === char && (
								<div className="absolute top-2 right-2">
									<CheckCircle
										size={16}
										className="text-rec-blue"
										fill="currentColor"
										stroke="white"
									/>
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default Step6Characters;
