import React, { useState, useEffect } from 'react';
import {
	Save,
	Plus,
	Trash2,
	Loader2,
	X,
	Settings2,
	Sparkles,
	Utensils,
	Clock,
	ChevronDown,
	Pizza,
	Users,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getConfig, updateConfig } from '../../services/api';

const ToggleSwitch = ({ active, onChange, title }) => {
	return (
		<button
			onClick={onChange}
			title={title}
			className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
				active ? 'bg-neverland-green' : 'bg-gray-200'
			}`}
		>
			<span
				className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
					active ? 'translate-x-4' : 'translate-x-0'
				}`}
			/>
		</button>
	);
};

const AccordionSection = ({
	title,
	subtitle,
	icon: Icon,
	color,
	isOpen,
	onToggle,
	children,
	action,
}) => {
	return (
		<div
			className={`border-l-4 ${color} bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 ${isOpen ? 'shadow-lg' : ''}`}
		>
			<div
				onClick={onToggle}
				className="p-6 cursor-pointer flex items-center justify-between hover:bg-gray-50/50 transition-colors group"
			>
				<div className="flex items-center gap-5">
					<div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:scale-110 group-hover:bg-white group-hover:shadow-md transition-all">
						<Icon size={24} />
					</div>
					<div>
						<h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">
							{subtitle}
						</h4>
						<h3 className="text-lg font-display font-black text-text-black leading-tight">
							{title}
						</h3>
					</div>
				</div>
				<div className="flex items-center gap-3">
					{action && (
						<div
							onClick={(e) => e.stopPropagation()}
							className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
						>
							{action}
						</div>
					)}
					<div
						className={`p-2 transition-transform duration-300 ${isOpen ? 'rotate-180 text-neverland-green' : 'text-gray-300'}`}
					>
						<ChevronDown size={20} />
					</div>
				</div>
			</div>
			{isOpen && (
				<div className="p-5 pt-0 animate-in slide-in-from-top-2 duration-300">
					<div className="pt-4 border-t border-gray-50">{children}</div>
				</div>
			)}
		</div>
	);
};

const ConfigurationPanel = ({ initialConfig, onConfigChange }) => {
	const [config, setConfig] = useState(initialConfig);
	const [originalConfig, setOriginalConfig] = useState(initialConfig);
	const [loading, setLoading] = useState(!initialConfig);
	const [openSections, setOpenSections] = useState({
		kids: false,
		adults: false,
		workshops: false,
		characters: false,
		others: false,
	});
	const [newCharacterName, setNewCharacterName] = useState('');

	const toggleSection = (section, forceOpen = false) => {
		setOpenSections((prev) => ({
			...prev,
			[section]: forceOpen ? true : !prev[section],
		}));
	};

	// Transformation logic to ensure stable IDs and fields for list items
	const transformConfig = (data) => {
		const normalize = (list) =>
			(list || []).map((item) => ({
				...item,
				id: item.id || item._id || Date.now().toString() + Math.random(),
				nombre: item.nombre || item.name || '',
				name: item.nombre || item.name || '',
				precio: item.precio || item.price || 0,
				price: item.precio || item.price || 0,
			}));

		if (data.menusNiños) data.menusNiños = normalize(data.menusNiños);
		if (data.preciosAdultos)
			data.preciosAdultos = normalize(data.preciosAdultos);
		if (data.workshops) data.workshops = normalize(data.workshops);

		return data;
	};

	const fetchData = React.useCallback(async () => {
		if (initialConfig && Object.keys(initialConfig).length > 0) {
			const data = transformConfig(JSON.parse(JSON.stringify(initialConfig)));
			setConfig(data);
			setOriginalConfig(JSON.parse(JSON.stringify(data)));
			setLoading(false);
			return;
		}

		setLoading(true);
		try {
			const res = await getConfig();
			const data = transformConfig(res.data);
			setConfig(data);
			setOriginalConfig(JSON.parse(JSON.stringify(data)));
		} catch (err) {
			console.error('Error fetching data:', err);
		} finally {
			setLoading(false);
		}
	}, [initialConfig]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleSave = async (newConfig = config) => {
		try {
			await updateConfig(newConfig || config);
			toast.success('Guardado correctamente');
			const savedConfig = newConfig || config;
			setOriginalConfig(JSON.parse(JSON.stringify(savedConfig)));
			if (onConfigChange) onConfigChange(savedConfig);
		} catch (err) {
			console.error('Error saving config:', err);
			toast.error('Error al guardar');
		}
	};

	const addItem = (field, defaultObj, sectionName) => {
		if (!openSections[sectionName]) {
			toggleSection(sectionName, true);
		}

		// Add new item with a guaranteed UNIQUE ID
		const newItem = {
			...defaultObj,
			id: Date.now().toString(),
			isNew: true, // Marker for autofocu
		};

		const newList = [newItem, ...(config[field] || [])];
		const newConfig = { ...config, [field]: newList };
		setConfig(newConfig);
	};

	const removeItem = (field, index) => {
		if (window.confirm('¿Seguro que quieres eliminar este elemento?')) {
			const newList = [...config[field]];
			newList.splice(index, 1);
			const newConfig = { ...config, [field]: newList };
			setConfig(newConfig);
			handleSave(newConfig);
		}
	};

	const updateListItem = (field, index, key, value) => {
		const newList = [...config[field]];
		newList[index] = { ...newList[index], [key]: value };
		setConfig({ ...config, [field]: newList });
	};

	const handleAddCharacter = async () => {
		if (!newCharacterName.trim()) return;
		const newList = [newCharacterName.trim(), ...config.characters];
		const newConfig = { ...config, characters: newList };
		setConfig(newConfig);
		setNewCharacterName('');
		await handleSave(newConfig);
	};

	// --- Change Detection Logic ---
	const hasChanges = (section) => {
		if (!originalConfig || !config) return false;

		if (section === 'kids') {
			return (
				JSON.stringify(config.menusNiños) !==
					JSON.stringify(originalConfig.menusNiños) ||
				config.plusFinDeSemana !== originalConfig.plusFinDeSemana
			);
		}
		if (section === 'others') {
			return (
				JSON.stringify(config.preciosExtras) !==
				JSON.stringify(originalConfig.preciosExtras)
			);
		}
		if (section === 'others') {
			return (
				JSON.stringify(config.preciosExtras) !==
				JSON.stringify(originalConfig.preciosExtras)
			);
		}
		if (section === 'characters') {
			return (
				JSON.stringify(config.characters) !==
				JSON.stringify(originalConfig.characters)
			);
		}
		return false;
	};

	const isItemChanged = (listName, item) => {
		if (!originalConfig) return false;
		const originalList = originalConfig[listName] || [];
		const originalItem = originalList.find((i) => i.id === item.id);

		if (!originalItem) return true; // New item

		const { isNew: _, ...itemClean } = item;
		const { isNew: __, ...orgClean } = originalItem;

		return JSON.stringify(itemClean) !== JSON.stringify(orgClean);
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-full py-20 text-gray-300 gap-4">
				<Loader2 className="animate-spin text-neverland-green/40" size={48} />
				<p className="font-display font-black uppercase tracking-widest text-[10px]">
					Sincronizando configuración...
				</p>
			</div>
		);
	}

	const extraLabels = {
		tallerBase: 'Actividad Económica (≤15)',
		tallerPlus: 'Actividad Premium (>15)',
		personaje: 'Personaje Animado',
		pinata: 'Piñata Neverland',
		extension30: 'Extra 30 Min',
		extension60: 'Extra 60 Min',
	};

	return (
		<div className="flex flex-col h-full bg-white animate-in fade-in duration-300 relative">
			{/* Scrollable Form Content */}
			<div className="flex-1 overflow-y-auto pb-32">
				{config && (
					<div className="p-6 space-y-4 max-w-5xl mx-auto">
						{/* Prices for Kids */}
						<AccordionSection
							title="Menús Infantiles"
							subtitle="Precios Base & Fin de Semana"
							icon={Pizza}
							color="border-l-neverland-green"
							isOpen={openSections.kids}
							onToggle={() => toggleSection('kids')}
							action={
								<button
									onClick={() =>
										addItem(
											'menusNiños',
											{
												nombre: '',
												precio: 0,
												principal: '',
												resto: '',
											},
											'kids',
										)
									}
									className="p-1.5 bg-neverland-green/10 text-neverland-green rounded-lg hover:bg-neverland-green hover:text-white transition-all shadow-sm"
								>
									<Plus size={16} />
								</button>
							}
						>
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 py-2">
								{(config.menusNiños || []).map((menu, idx) => (
									<div
										key={menu.id || idx}
										className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm relative group hover:border-neverland-green/20 transition-all flex flex-col gap-4"
									>
										{/* Row 1: Name and Price */}
										<div className="flex items-start gap-4">
											<div className="flex-1">
												<label className="text-[8px] font-black text-gray-300 uppercase tracking-widest block mb-1">
													Nombre del Menú
												</label>
												<input
													type="text"
													value={menu.nombre}
													placeholder="Nombre del menú..."
													autoFocus={menu.isNew}
													onChange={(e) => {
														const newList = [...config.menusNiños];
														newList[idx] = {
															...newList[idx],
															nombre: e.target.value,
														};
														setConfig({ ...config, menusNiños: newList });
													}}
													className="w-full p-0 bg-transparent border-none font-display font-black text-xl text-text-black outline-none placeholder:text-gray-300"
												/>
											</div>
											<div className="bg-neverland-green/5 rounded-xl p-2 border border-neverland-green/10 shrink-0 w-20 flex flex-col items-center justify-center">
												<label className="text-[8px] font-black text-neverland-green uppercase block leading-none mb-1.5">
													Precio
												</label>
												<div className="flex items-center justify-center w-full">
													<input
														type="number"
														value={menu.precio}
														onChange={(e) => {
															const newList = [...config.menusNiños];
															newList[idx] = {
																...newList[idx],
																precio: parseFloat(e.target.value),
															};
															setConfig({ ...config, menusNiños: newList });
														}}
														className="w-full bg-transparent p-0 text-lg font-black text-neverland-green outline-none border-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
													/>
													<span className="text-[10px] font-black text-neverland-green opacity-40 ml-0.5">
														€
													</span>
												</div>
											</div>
										</div>

										{/* Row 2: Main Dish (Full Width now) */}
										<div className="bg-gray-50 rounded-xl p-2 px-3 border border-gray-50">
											<label className="text-[8px] font-black text-gray-400 uppercase block leading-none mb-1">
												Plato Principal
											</label>
											<input
												type="text"
												value={menu.principal}
												placeholder="Hamburguesa..."
												onChange={(e) => {
													const newList = [...config.menusNiños];
													newList[idx] = {
														...newList[idx],
														principal: e.target.value,
													};
													setConfig({ ...config, menusNiños: newList });
												}}
												className="w-full bg-transparent p-0 text-sm font-bold text-gray-600 outline-none border-none"
											/>
										</div>

										{/* Row 3: Others Textarea */}
										<div className="bg-gray-50/50 rounded-xl p-3 px-3 border border-gray-100/50">
											<label className="text-[8px] font-black text-gray-400 uppercase block leading-none mb-1.5">
												Otros Detalles
											</label>
											<textarea
												value={menu.resto}
												rows={3}
												placeholder="- Bebida, postre..."
												onChange={(e) => {
													const newList = [...config.menusNiños];
													newList[idx] = {
														...newList[idx],
														resto: e.target.value,
													};
													setConfig({ ...config, menusNiños: newList });
												}}
												className="w-full bg-transparent p-0 text-sm font-medium text-gray-500 outline-none border-none resize-none leading-relaxed"
											/>
										</div>

										{/* Row 4: Action Bar */}
										<div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-1">
											<div className="flex items-center gap-2">
												{/* Status or other info can go here */}
											</div>
											<div className="flex items-center gap-1.5">
												<button
													onClick={() => handleSave()}
													className={`p-1.5 rounded-lg transition-all ${
														isItemChanged('menusNiños', menu)
															? 'text-neverland-green bg-neverland-green/10 scale-110 shadow-sm'
															: 'text-gray-300 hover:text-neverland-green hover:bg-gray-50'
													}`}
													title="Guardar"
												>
													<Save size={18} />
												</button>
												<button
													onClick={() => removeItem('menusNiños', idx)}
													className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
													title="Eliminar"
												>
													<Trash2 size={18} />
												</button>
											</div>
										</div>
									</div>
								))}

								{/* Weekend Plus Card - Refined */}
								<div className="p-4 bg-energy-orange/5 rounded-2xl border border-energy-orange/10 flex flex-col justify-center items-center relative overflow-hidden group min-h-[140px]">
									<div className="absolute -top-10 -right-10 w-32 h-32 bg-energy-orange/5 rounded-full blur-3xl group-hover:bg-energy-orange/10 transition-all" />
									<div className="relative text-center">
										<p className="text-[10px] font-black text-energy-orange uppercase tracking-[0.2em] mb-1 opacity-70">
											Plus Findes / Festivos
										</p>
										<div className="flex items-center justify-center group">
											<span className="text-xl font-black text-energy-orange/30 mr-1 mt-1">
												+
											</span>
											<input
												type="number"
												step="0.1"
												value={config.plusFinDeSemana}
												onChange={(e) =>
													setConfig({
														...config,
														plusFinDeSemana: parseFloat(e.target.value),
													})
												}
												className="w-16 bg-transparent p-0 text-3xl font-display font-black text-energy-orange outline-none border-none ring-0 text-center"
											/>
											<span className="text-xl font-black text-energy-orange/30 ml-1 mt-1">
												€
											</span>
										</div>
										<p className="text-[10px] font-bold text-energy-orange/40 mt-1 italic max-w-[160px] mx-auto leading-tight">
											Extra por niño en Vie, Sáb, Dom y Festivos
										</p>
									</div>
								</div>
							</div>
						</AccordionSection>

						{/* Adult Menus */}
						<AccordionSection
							title="Menú de Adultos"
							subtitle="Catering & Raciones"
							icon={Utensils}
							color="border-l-energy-orange"
							isOpen={openSections.adults}
							onToggle={() => toggleSection('adults')}
							action={
								<button
									onClick={() =>
										addItem(
											'preciosAdultos',
											{
												nombre: '',
												precio: 0,
												unidades: '',
											},
											'adults',
										)
									}
									className="p-1.5 bg-neverland-green/10 text-neverland-green rounded-lg hover:bg-neverland-green hover:text-white transition-all shadow-sm shadow-neverland-green/5"
								>
									<Plus size={16} />
								</button>
							}
						>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
								{(config.preciosAdultos || []).map((menu, idx) => (
									<div
										key={menu.id || idx}
										className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm relative group hover:border-neverland-green/20 transition-all flex flex-col gap-4"
									>
										{/* Row 1: Name (Full Width) */}
										<div className="w-full">
											<input
												type="text"
												value={menu.nombre}
												placeholder="Nombre del plato..."
												autoFocus={menu.isNew}
												onChange={(e) =>
													updateListItem(
														'preciosAdultos',
														idx,
														'nombre',
														e.target.value,
													)
												}
												className="w-full p-0 bg-transparent border-none font-display font-black text-xl text-text-black outline-none placeholder:text-gray-300"
											/>
										</div>

										{/* Row 2: Data Grid */}
										<div className="grid grid-cols-2 gap-3">
											<div className="bg-gray-50 rounded-xl p-2 px-3 border border-gray-50">
												<label className="text-[8px] font-black text-gray-400 uppercase block leading-none mb-1">
													Unidades
												</label>
												<input
													type="text"
													value={menu.unidades}
													placeholder="Ej: 12 uds"
													onChange={(e) =>
														updateListItem(
															'preciosAdultos',
															idx,
															'unidades',
															e.target.value,
														)
													}
													className="w-full bg-transparent p-0 text-xs font-bold text-gray-600 outline-none border-none"
												/>
											</div>
											<div className="bg-neverland-green/5 rounded-xl p-2 px-3 border border-neverland-green/10">
												<label className="text-[8px] font-black text-neverland-green uppercase block leading-none mb-1">
													Precio
												</label>
												<div className="flex items-center">
													<input
														type="number"
														value={menu.precio}
														onChange={(e) =>
															updateListItem(
																'preciosAdultos',
																idx,
																'precio',
																parseFloat(e.target.value),
															)
														}
														className="w-full bg-transparent p-0 text-sm font-black text-neverland-green outline-none border-none"
													/>
													<span className="text-[10px] font-black text-neverland-green opacity-40 ml-1">
														€
													</span>
												</div>
											</div>
										</div>

										{/* Row 3: Action Bar */}
										<div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-1">
											<div className="flex items-center gap-2">
												<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
													Visible
												</span>
												<ToggleSwitch
													active={!menu.suspended}
													onChange={() => {
														const newList = [...config.preciosAdultos];
														newList[idx] = {
															...newList[idx],
															suspended: !newList[idx].suspended,
														};
														setConfig({ ...config, preciosAdultos: newList });
														handleSave({ ...config, preciosAdultos: newList });
													}}
													title={
														menu.suspended
															? 'Activar (Suspendido)'
															: 'Suspender (Ocultar a clientes)'
													}
												/>
											</div>
											<div className="flex items-center gap-1.5">
												<button
													onClick={() => handleSave()}
													className={`p-1.5 rounded-lg transition-all ${
														isItemChanged('preciosAdultos', menu)
															? 'text-neverland-green bg-neverland-green/10 scale-110 shadow-sm'
															: 'text-gray-300 hover:text-neverland-green hover:bg-gray-50'
													}`}
													title="Guardar"
												>
													<Save size={18} />
												</button>
												<button
													onClick={() => removeItem('preciosAdultos', idx)}
													className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
													title="Eliminar"
												>
													<Trash2 size={18} />
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						</AccordionSection>

						{/* Workshops */}
						<AccordionSection
							title="Actividades"
							subtitle="Extras por niño"
							icon={Sparkles}
							color="border-l-blue-400"
							isOpen={openSections.workshops}
							onToggle={() => toggleSection('workshops')}
							action={
								<button
									onClick={() =>
										addItem(
											'workshops',
											{
												name: '',
												priceBase: 0,
												pricePlus: 0,
												desc: '',
											},
											'workshops',
										)
									}
									className="p-1.5 bg-blue-400/10 text-blue-500 rounded-lg hover:bg-blue-400 hover:text-white transition-all shadow-sm shadow-blue-400/5"
								>
									<Plus size={16} />
								</button>
							}
						>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
								{(config.workshops || []).map((ws, idx) => (
									<div
										key={ws.id || idx}
										className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm relative group hover:border-blue-200 transition-colors flex flex-col gap-4"
									>
										{/* Row 1: Name (Full Width) */}
										<div className="w-full">
											<input
												type="text"
												value={ws.name}
												placeholder="Nombre de la actividad..."
												autoFocus={ws.isNew}
												onChange={(e) =>
													updateListItem(
														'workshops',
														idx,
														'name',
														e.target.value,
													)
												}
												className="w-full p-0 bg-transparent border-none font-display font-black text-xl text-text-black outline-none placeholder:text-gray-300"
											/>
										</div>

										{/* Row 2: Description */}
										<div className="relative group/desc">
											<textarea
												value={ws.desc || ''}
												onChange={(e) => {
													if (e.target.value.length <= 150) {
														const newList = [...config.workshops];
														newList[idx] = {
															...newList[idx],
															desc: e.target.value,
														};
														setConfig({ ...config, workshops: newList });
													}
												}}
												placeholder="Breve descripción de la actividad..."
												className="w-full bg-gray-50/50 p-3 rounded-2xl text-xs font-medium text-gray-600 border border-gray-100 focus:bg-white focus:border-blue-200 focus:shadow-sm outline-none resize-none transition-all placeholder:text-gray-300 min-h-[60px]"
											/>
											<div
												className={`absolute bottom-2 right-2 text-[9px] font-black tracking-wider transition-colors pointer-events-none ${
													(ws.desc?.length || 0) >= 140
														? 'text-red-400'
														: 'text-gray-300'
												}`}
											>
												{ws.desc?.length || 0}/150
											</div>
										</div>

										{/* Row 3: Image URL */}
										<div className="bg-gray-50/30 rounded-2xl p-2.5 border border-gray-100/50">
											<div className="flex items-center gap-1.5 mb-1.5 px-1">
												<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">
													Imagen (URL)
												</label>
											</div>
											<div className="flex gap-2 items-center">
												<div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
													{ws.imageUrl ? (
														<img
															src={ws.imageUrl}
															alt="Preview"
															className="w-full h-full object-cover"
															onError={(e) => {
																e.target.src = '';
																e.target.parentElement.innerHTML =
																	'<span class="text-[8px] text-red-300 font-bold">Error</span>';
															}}
														/>
													) : (
														<span className="text-[8px] text-gray-300 font-bold">
															NO IMG
														</span>
													)}
												</div>
												<input
													type="text"
													value={ws.imageUrl || ''}
													placeholder="URL de la imagen (Cloudinary, etc)..."
													onChange={(e) =>
														updateListItem(
															'workshops',
															idx,
															'imageUrl',
															e.target.value,
														)
													}
													className="flex-1 bg-transparent p-0 text-xs font-bold text-gray-600 outline-none border-none placeholder:text-gray-200"
												/>
											</div>
										</div>

										{/* Row 4: Pricing Grid */}
										<div className="grid grid-cols-2 gap-3">
											<div className="bg-gray-50 rounded-xl p-2 px-3">
												<label className="text-[8px] font-black text-gray-400 uppercase block leading-none mb-1">
													Base (≤15)
												</label>
												<div className="flex items-center">
													<input
														type="number"
														value={ws.priceBase}
														onChange={(e) =>
															updateListItem(
																'workshops',
																idx,
																'priceBase',
																parseFloat(e.target.value),
															)
														}
														className="w-full bg-transparent p-0 font-bold text-gray-600 outline-none border-none"
													/>
													<span className="text-[10px] font-bold text-gray-300">
														€
													</span>
												</div>
											</div>
											<div className="bg-blue-50/50 rounded-xl p-2 px-3 border border-blue-50">
												<label className="text-[8px] font-black text-blue-400 uppercase block leading-none mb-1">
													Plus (&gt;15)
												</label>
												<div className="flex items-center">
													<input
														type="number"
														value={ws.pricePlus}
														onChange={(e) =>
															updateListItem(
																'workshops',
																idx,
																'pricePlus',
																parseFloat(e.target.value),
															)
														}
														className="w-full bg-transparent p-0 font-bold text-blue-500 outline-none border-none"
													/>
													<span className="text-[10px] font-bold text-blue-200">
														€
													</span>
												</div>
											</div>
										</div>

										{/* Row 5: Action Bar */}
										<div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-1">
											<div className="flex items-center gap-2">
												<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
													Visible
												</span>
												<ToggleSwitch
													active={!ws.suspended}
													onChange={() => {
														const newList = [...config.workshops];
														newList[idx] = {
															...newList[idx],
															suspended: !newList[idx].suspended,
														};
														setConfig({ ...config, workshops: newList });
														handleSave({ ...config, workshops: newList });
													}}
													title={
														ws.suspended
															? 'Activar (Suspendido)'
															: 'Suspender (Ocultar a clientes)'
													}
												/>
											</div>
											<div className="flex items-center gap-1.5">
												<button
													onClick={() => handleSave()}
													className={`p-1.5 rounded-lg transition-all ${
														isItemChanged('workshops', ws)
															? 'text-blue-500 bg-blue-50/50 scale-110 shadow-sm'
															: 'text-gray-300 hover:text-blue-500 hover:bg-gray-50'
													}`}
												>
													<Save size={18} />
												</button>
												<button
													onClick={() => removeItem('workshops', idx)}
													className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
												>
													<Trash2 size={18} />
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						</AccordionSection>

						{/* Characters */}
						<AccordionSection
							title="Personajes Neverland"
							subtitle="Catálogo de Animación"
							icon={Users}
							color="border-l-purple-500"
							isOpen={openSections.characters}
							onToggle={() => toggleSection('characters')}
						>
							<div className="flex flex-col gap-4 py-2">
								<div className="flex gap-2">
									<input
										type="text"
										value={newCharacterName}
										onChange={(e) => setNewCharacterName(e.target.value)}
										onKeyDown={(e) => e.key === 'Enter' && handleAddCharacter()}
										placeholder="Añadir nuevo personaje..."
										className="flex-1 bg-gray-50/50 p-3 rounded-2xl text-sm font-display font-bold text-text-black border border-gray-100 focus:bg-white focus:border-purple-200 focus:shadow-sm outline-none transition-all placeholder:text-gray-300"
									/>
									<button
										onClick={handleAddCharacter}
										disabled={!newCharacterName.trim()}
										className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl hover:bg-purple-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-purple-500/5"
									>
										<Plus size={20} />
									</button>
								</div>

								<div className="bg-gray-50 p-6 rounded-[32px] flex flex-wrap gap-2">
									{(config.characters || []).map((char, idx) => (
										<div
											key={idx}
											className="group flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-2xl text-[11px] font-black text-gray-700 hover:border-purple-200 hover:bg-purple-50 transition-all cursor-default shadow-sm shadow-black/5 animate-in zoom-in-95 duration-200"
										>
											{char}
											<button
												onClick={async () => {
													if (
														window.confirm(
															`¿Seguro quieres eliminar a ${char}?`,
														)
													) {
														const newList = [...config.characters];
														newList.splice(idx, 1);
														const newConfig = {
															...config,
															characters: newList,
														};
														setConfig(newConfig);
														await handleSave(newConfig);
													}
												}}
												className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-all ml-1"
											>
												<X size={14} />
											</button>
										</div>
									))}

									{(config.characters || []).length === 0 && (
										<div className="w-full text-center py-4 text-gray-300 text-xs italic">
											No hay personajes añadidos
										</div>
									)}
								</div>
							</div>
						</AccordionSection>

						{/* Others Prices */}
						<AccordionSection
							title="Precios & Otros Extras"
							subtitle="Ajustes Generales"
							icon={Settings2}
							color="border-l-gray-400"
							isOpen={openSections.others}
							onToggle={() => toggleSection('others')}
							action={
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleSave();
									}}
									className={`p-2 rounded-xl transition-all ${
										hasChanges('others')
											? 'text-neverland-green bg-neverland-green/10 hover:bg-neverland-green/20'
											: 'text-gray-300 hover:text-gray-400'
									}`}
									title="Guardar Cambios"
								>
									<Save size={20} />
								</button>
							}
						>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
								{Object.entries(config.preciosExtras)
									.filter(
										([key]) => key !== 'tallerBase' && key !== 'tallerPlus',
									)
									.map(([key, value]) => (
										<div
											key={key}
											className="flex flex-col gap-1 p-4 bg-gray-50/50 rounded-2xl border border-gray-50"
										>
											<label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter ml-0.5">
												{extraLabels[key] || key.replace(/([A-Z])/g, ' $1')}
											</label>
											<div className="relative flex items-center">
												<input
													type="number"
													value={value}
													onChange={(e) =>
														setConfig({
															...config,
															preciosExtras: {
																...config.preciosExtras,
																[key]: parseFloat(e.target.value),
															},
														})
													}
													className="w-full bg-transparent p-0 text-lg font-display font-black text-text-black outline-none border-none ring-0"
												/>
												<span className="text-gray-300 font-bold ml-1 text-sm">
													€
												</span>
											</div>
										</div>
									))}
							</div>
						</AccordionSection>
					</div>
				)}
			</div>
		</div>
	);
};

export default ConfigurationPanel;
