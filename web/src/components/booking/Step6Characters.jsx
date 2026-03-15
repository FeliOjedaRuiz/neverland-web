import { Search, CheckCircle, Image as ImageIcon, X } from 'lucide-react';

const Step6Characters = ({
	formData,
	setFormData,
	CHARACTERS,
	charSearch,
	setCharSearch,
}) => {
	const filteredChars = (CHARACTERS || []).filter((c) =>
		!c.suspended && (c.nombre || c.name || '').toLowerCase().includes(charSearch.toLowerCase()),
	);

	const selectedChar = formData.extras.personaje;

	return (
		<div className="flex flex-col h-full overflow-hidden pb-4">
			<h2 className="text-xl font-display font-black text-text-black text-center mb-1">
				Visita Especial
			</h2>
			<p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest mb-6">Un momento mágico con sus personajes favoritos</p>

			<div className="bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-gray-100 flex items-center gap-2 mb-6 shrink-0 shadow-sm focus-within:ring-2 focus-within:ring-purple-200 focus-within:bg-white transition-all">
				<Search className="text-gray-300" size={18} />
				<input
					className="w-full bg-transparent outline-none font-bold text-sm text-gray-700 placeholder:text-gray-300"
					placeholder="Buscar personaje..."
					value={charSearch}
					onChange={(e) => setCharSearch(e.target.value)}
				/>
			</div>

			<div className="flex-1 overflow-y-auto no-scrollbar pr-1">
				<div className="grid grid-cols-1 gap-3 mb-4">
					<div
						onClick={() =>
							setFormData({
								...formData,
								extras: { ...formData.extras, personaje: 'ninguno' },
							})
						}
						className={`p-4 rounded-[28px] border-2 transition-all cursor-pointer relative group ${
							selectedChar === 'ninguno'
								? 'border-gray-200 bg-gray-50'
								: 'border-white bg-white/70 hover:border-gray-100 shadow-sm'
						}`}
					>
						<div className="flex justify-between items-center">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
									<X size={20} />
								</div>
								<div className="flex flex-col">
									<span className={`font-black text-sm uppercase tracking-wide ${selectedChar === 'ninguno' ? 'text-gray-600' : 'text-gray-400'}`}>Sin Visita</span>
									<span className="text-[9px] font-bold text-gray-400">Prefiero no añadir un personaje</span>
								</div>
							</div>
							{selectedChar === 'ninguno' && (
								<CheckCircle
									className="text-gray-600"
									fill="currentColor"
									stroke="white"
									size={24}
								/>
							)}
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-2.5 pb-4">
					{filteredChars.map((char) => {
						const charName = char.nombre || char.name;
						const isSelected = selectedChar === charName;
						
						return (
							<div
								key={char.id || charName}
								onClick={() =>
									setFormData({
										...formData,
										extras: { ...formData.extras, personaje: charName },
									})
								}
								className={`group flex items-center gap-4 p-3 rounded-[28px] border-2 transition-all cursor-pointer relative overflow-hidden ${
									isSelected
										? 'border-purple-500 bg-purple-50/30 shadow-md shadow-purple-500/5'
										: 'border-white bg-white/70 shadow-sm hover:border-purple-100'
								}`}
							>
								{/* Image Thumbnail */}
								<div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-gray-100 shadow-inner">
									{char.imageUrl ? (
										<img 
											src={char.imageUrl} 
											alt={charName} 
											className={`w-full h-full object-cover transition-transform duration-700 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center text-gray-300">
											<ImageIcon size={28} />
										</div>
									)}
								</div>
								
								{/* Character Details */}
								<div className="flex-1 min-w-0">
									<span
										className={`font-black text-sm block mb-0.5 transition-colors ${
											isSelected ? 'text-purple-600' : 'text-text-black'
										}`}
									>
										{charName}
									</span>
									<div className="flex items-center gap-1.5">
										<span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Visita Especial</span>
										<div className="w-1 h-1 rounded-full bg-gray-200" />
										<span className="text-[8px] font-black text-purple-400 uppercase tracking-widest leading-none">Neverland</span>
									</div>
								</div>
								
								{/* Checkmark indicator */}
								<div className={`transition-all duration-300 ${isSelected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
									<div className="bg-purple-500 rounded-full p-2 shadow-lg border-2 border-white">
										<CheckCircle size={14} className="text-white" fill="currentColor" stroke="none" />
									</div>
								</div>

								{isSelected && (
									<div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
								)}
							</div>
						);
					})}
				</div>

				{filteredChars.length === 0 && charSearch && (
					<div className="text-center py-10">
						<div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-50 text-gray-200 mb-3">
							<Search size={24} />
						</div>
						<p className="text-xs font-bold text-gray-400">No encontramos ningún personaje que coincida con "{charSearch}"</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default Step6Characters;
