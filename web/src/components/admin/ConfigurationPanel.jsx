import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
	Upload,
	Image as ImageIcon,
	ArrowLeft,
	Eye,
	EyeOff,
	Calendar,
	Gift,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';
import { getConfig, updateConfig, uploadConfigImage } from '../../services/api';

const ToggleSwitch = ({ active, onChange, title }) => {
	return (
		<button
			onClick={onChange}
			type="button"
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
	icon,
	color,
	isOpen,
	onToggle,
	children,
	action,
}) => {
	const SectionIcon = icon;
	// motion is used in JSX below
	return (
		<div
			className={`border-l-4 ${color} bg-surface rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 ${isOpen ? 'shadow-lg' : ''}`}
		>
			<div
				onClick={onToggle}
				className="p-6 cursor-pointer flex items-center justify-between hover:bg-gray-50/50 transition-colors group"
			>
				<div className="flex items-center gap-5">
					<div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:scale-110 group-hover:bg-white group-hover:shadow-md transition-all">
						<SectionIcon size={24} />
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

const ConfigurationPanel = () => {
	const { config: contextConfig, setConfig: setContextConfig } =
		useOutletContext();
	const [config, setConfig] = useState(contextConfig);
	const [originalConfig, setOriginalConfig] = useState(contextConfig);
	const [loading, setLoading] = useState(!contextConfig);
	const [openSections, setOpenSections] = useState({
		kids: false,
		adults: false,
		workshops: false,
		characters: false,
		extrasCatalogo: false,
		others: false,
	});
	const [uploadingId, setUploadingId] = useState(null);
	const [editingWorkshopIdx, setEditingWorkshopIdx] = useState(null);
	const [editingAdultMenuIdx, setEditingAdultMenuIdx] = useState(null);
	const [editingKidsMenuIdx, setEditingKidsMenuIdx] = useState(null);
	const [editingCharacterIdx, setEditingCharacterIdx] = useState(null);
	const [editingExtraCatalogoIdx, setEditingExtraCatalogoIdx] = useState(null);

	const toggleSection = (section, forceOpen = false) => {
		setOpenSections((prev) => ({
			...prev,
			[section]: forceOpen ? true : !prev[section],
		}));
	};

	// Close modal on back button (Native Navigation)
	useEffect(() => {
		if (editingWorkshopIdx !== null || editingAdultMenuIdx !== null || editingKidsMenuIdx !== null || editingCharacterIdx !== null || editingExtraCatalogoIdx !== null) {
			window.history.pushState({ modal: 'editing' }, '');
			
			const handlePopState = () => {
				setEditingWorkshopIdx(null);
				setEditingAdultMenuIdx(null);
				setEditingKidsMenuIdx(null);
				setEditingCharacterIdx(null);
				setEditingExtraCatalogoIdx(null);
			};

			window.addEventListener('popstate', handlePopState);
			return () => window.removeEventListener('popstate', handlePopState);
		}
	}, [editingWorkshopIdx, editingAdultMenuIdx, editingKidsMenuIdx, editingCharacterIdx, editingExtraCatalogoIdx]);

	// Transformation logic to ensure stable IDs and fields for list items
	const transformConfig = (data) => {
		const normalize = (list) =>
			(list || []).map((item) => {
				if (typeof item === 'string') {
					return {
						id: Date.now().toString() + Math.random(),
						nombre: item,
						name: item,
						suspended: false,
						imageUrl: '',
					};
				}
				return {
					...item,
					id: item.id || item._id || Date.now().toString() + Math.random(),
					nombre: item.nombre || item.name || '',
					name: item.nombre || item.name || '',
					precio: item.precio || item.price || 0,
					price: item.precio || item.price || 0,
					suspended: item.suspended || false,
				};
			});

		if (data.menusNiños) data.menusNiños = normalize(data.menusNiños);
		if (data.preciosAdultos)
			data.preciosAdultos = normalize(data.preciosAdultos);
		if (data.workshops) data.workshops = normalize(data.workshops);
		if (data.characters) data.characters = normalize(data.characters);
		if (data.extrasCatalogo) data.extrasCatalogo = normalize(data.extrasCatalogo);

		return data;
	};

	const fetchData = React.useCallback(async () => {
		if (contextConfig && Object.keys(contextConfig).length > 0) {
			const data = transformConfig(JSON.parse(JSON.stringify(contextConfig)));
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
			if (setContextConfig) setContextConfig(data);
		} catch (err) {
			console.error('Error fetching data:', err);
		} finally {
			setLoading(false);
		}
	}, [contextConfig, setContextConfig]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleSave = async (newConfig = config) => {
		try {
			await updateConfig(newConfig || config);
			toast.success('Guardado correctamente');
			const savedConfig = newConfig || config;
			setOriginalConfig(JSON.parse(JSON.stringify(savedConfig)));
			if (setContextConfig) setContextConfig(savedConfig);
		} catch (err) {
			console.error('Error saving config:', err);
			toast.error('Error al guardar');
		}
	};

	const addItem = (field, defaultObj, sectionName) => {
		if (!openSections[sectionName]) {
			toggleSection(sectionName, true);
		}

		const newItem = {
			...defaultObj,
			id: Date.now().toString(),
		};

		const newList = [...(config[field] || []), newItem];
		const newConfig = { ...config, [field]: newList };
		setConfig(newConfig);
		return newList.length - 1; // Return the index of the newly added item
	};

	const removeItem = async (field, index) => {
		if (window.confirm('¿Seguro que quieres eliminar este elemento?')) {
			const newList = [...config[field]];
			newList.splice(index, 1);
			const newConfig = { ...config, [field]: newList };
			setConfig(newConfig);
			await handleSave(newConfig);
			return true;
		}
		return false;
	};

	const updateListItem = (field, index, keyOrUpdates, value) => {
		setConfig((prev) => {
			const newList = [...(prev[field] || [])];
			if (typeof keyOrUpdates === 'object') {
				newList[index] = { ...newList[index], ...keyOrUpdates };
			} else {
				newList[index] = { ...newList[index], [keyOrUpdates]: value };
			}
			return { ...prev, [field]: newList };
		});
	};


	const handleImageUpload = async (e, field, index) => {
		const file = e.target.files[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toast.error('El archivo debe ser una imagen');
			return;
		}

		// Validate file size (e.g., 20MB)
		if (file.size > 20 * 1024 * 1024) {
			toast.error('La imagen es demasiado grande (máx 20MB)');
			return;
		}

		const itemId = config[field][index].id;
		setUploadingId(itemId);

		try {
			const res = await uploadConfigImage(file);
			const imageUrl = res.data.imageUrl;
			updateListItem(field, index, 'imageUrl', imageUrl);
			toast.success('Imagen subida correctamente');
		} catch (err) {
			console.error('Error uploading image:', err);
			toast.error('Error al subir la imagen');
		} finally {
			setUploadingId(null);
		}
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
		precioPack3Personajes: 'Pack 3 personajes',
		pinata: 'Piñata Neverland',
		extension30: 'Extra 30 Min',
		extension60: 'Extra 60 Min',
	};

	return (
		<div className="flex flex-col h-full animate-in fade-in duration-300 relative">
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
									onClick={(e) => {
										e.stopPropagation();
										toggleSection('kids', true);
										const newIdx = addItem('menusNiños', {
											nombre: 'Nuevo Menú',
											precio: 10,
											principal: '',
											resto: '',
											suspended: false,
											imageUrl: ''
										});
										setEditingKidsMenuIdx(newIdx);
									}}
									className="p-1.5 bg-neverland-green text-white rounded-lg hover:scale-110 active:scale-95 transition-all shadow-md shadow-neverland-green/20"
								>
									<Plus size={18} />
								</button>
							}
						>
							<div className="space-y-6 py-2">
								{/* Pricing Context */}
								<div className="bg-orange-50/30 p-5 rounded-3xl border border-orange-100/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm shadow-orange-500/5">
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-energy-orange shadow-md shadow-orange-200/10">
											<Calendar size={22} />
										</div>
										<div>
											<p className="text-[9px] font-black text-energy-orange uppercase tracking-widest leading-none mb-1.5 opacity-70">Suplemento Especial</p>
											<h4 className="font-display font-black text-sm sm:text-base text-text-black">Plus Viernes, Sábados y Domingos</h4>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-50">
											<input
												type="number"
												step="0.5"
												value={config.plusFinDeSemana}
												onChange={(e) => setConfig({ ...config, plusFinDeSemana: parseFloat(e.target.value) })}
												className="w-16 bg-transparent text-center font-display font-black text-lg text-energy-orange outline-none"
											/>
											<span className="text-[10px] font-black text-gray-300 uppercase pr-2">€ extra</span>
										</div>
										<button
											onClick={() => handleSave()}
											disabled={config.plusFinDeSemana === originalConfig?.plusFinDeSemana}
											className={`p-3 rounded-2xl transition-all ${
												config.plusFinDeSemana !== originalConfig?.plusFinDeSemana
													? 'bg-neverland-green text-white shadow-lg shadow-neverland-green/20 hover:scale-105 active:scale-95 cursor-pointer'
													: 'bg-gray-100 text-gray-300 cursor-not-allowed'
											}`}
											title="Guardar suplemento"
										>
											<Save size={18} />
										</button>
									</div>
								</div>

								{/* Kids Menus Grid */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{(config.menusNiños || []).map((menu, idx) => (
										<div
											key={menu.id || idx}
											onClick={() => setEditingKidsMenuIdx(idx)}
											className={`group relative overflow-hidden bg-white rounded-2xl border-2 transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1 ${
												menu.suspended ? 'border-gray-50 opacity-60' : 'border-gray-100 hover:border-neverland-green/30'
											}`}
										>
											<div className="p-3 flex items-center gap-4">
												<div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100/50">
													{menu.imageUrl ? (
														<img src={menu.imageUrl} alt={menu.nombre} className="w-full h-full object-cover" />
													) : (
														<div className="w-full h-full flex items-center justify-center text-gray-200">
															<ImageIcon size={20} />
														</div>
													)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex justify-between items-start">
														<h5 className="font-display font-black text-sm text-text-black group-hover:text-neverland-green transition-colors truncate pr-2">
															{menu.nombre}
														</h5>
														<span className="font-black text-xs text-energy-orange bg-orange-50 px-2 py-0.5 rounded-lg shrink-0">
															{menu.precio}€
														</span>
													</div>
													<p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1 line-clamp-1">
														{menu.principal || 'Sin plato principal'}
													</p>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Kids Menu Modal Editor */}
							<AnimatePresence>
								{editingKidsMenuIdx !== null && (() => {
									const menu = config.menusNiños[editingKidsMenuIdx];
									const idx = editingKidsMenuIdx;
									
									return (
										<motion.div
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-text-black/20 text-text-black"
											onClick={(e) => {
												if (e.target === e.currentTarget) {
													setEditingKidsMenuIdx(null);
													window.history.back();
												}
											}}
										>
											<motion.div
												initial={{ scale: 0.95, y: 20 }}
												animate={{ scale: 1, y: 0 }}
												exit={{ scale: 0.95, y: 20 }}
												className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
												onClick={(e) => e.stopPropagation()}
											>
												{/* Image Upload Area */}
												<div className="relative w-full h-[140px] sm:h-[180px] bg-gray-100 overflow-hidden shrink-0">
													{menu.imageUrl ? (
														<>
															<img 
																src={menu.imageUrl} 
																alt={menu.nombre} 
																className="w-full h-full object-cover"
															/>
															<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
															<div className="absolute bottom-3 left-6 right-6 flex items-end justify-between">
																<label className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-xl transition-all cursor-pointer border border-white/30 group">
																	<input
																		type="file"
																		className="hidden"
																		accept="image/*"
																		onChange={(e) => handleImageUpload(e, 'menusNiños', idx)}
																	/>
																	<Upload size={16} />
																	<span className="font-display font-black text-[10px] uppercase tracking-wider">Cambiar Foto</span>
																</label>
															</div>
														</>
													) : (
														<label className="w-full h-full cursor-pointer flex flex-col items-center justify-center gap-2 group/empty bg-blue-50/20">
															<input
																type="file"
																className="hidden"
																accept="image/*"
																onChange={(e) => handleImageUpload(e, 'menusNiños', idx)}
															/>
															<div className="w-10 h-10 rounded-2xl bg-white text-blue-400 flex items-center justify-center shadow-lg group-hover/empty:scale-110 transition-all">
																<ImageIcon size={20} />
															</div>
															<p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Añadir Foto del Plato</p>
														</label>
													)}
													
													{uploadingId === (menu.id || idx) && (
														<div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-2 z-20">
															<Loader2 className="animate-spin text-blue-500" size={32} />
															<p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Subiendo imagen...</p>
														</div>
													)}

													<button 
														onClick={() => {
															setEditingKidsMenuIdx(null);
															window.history.back();
														}}
														className="absolute top-3 right-3 z-30 p-1.5 bg-white/90 hover:bg-white text-text-black rounded-full shadow-lg transition-all border border-gray-100 group/close"
													>
														<X size={16} className="group-hover:scale-110 transition-transform" />
													</button>
												</div>

												{/* Content Area */}
												<div className="p-5 sm:p-7 flex flex-col gap-4 overflow-y-auto min-h-0">
													<div className="flex justify-between items-center -mb-1">
														<div className="w-full max-w-[70%]">
															<label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nombre del Menú</label>
															<input
																type="text"
																value={menu.nombre}
																onChange={(e) => updateListItem('menusNiños', idx, 'nombre', e.target.value)}
																className="w-full bg-transparent border-none font-display font-black text-xl text-text-black outline-none placeholder:text-gray-100 focus:text-neverland-green transition-colors"
																placeholder="Ej: Menú 1..."
															/>
														</div>
														<div className="bg-orange-50 px-4 py-1.5 rounded-2xl border border-orange-100/50 text-right">
															<label className="text-[8px] font-black text-energy-orange uppercase tracking-widest block mb-0.5">Precio</label>
															<div className="flex items-center gap-1 justify-end">
																<input
																	type="number"
																	value={menu.precio}
																	onChange={(e) => updateListItem('menusNiños', idx, 'precio', parseFloat(e.target.value))}
																	className="w-14 bg-transparent text-right font-display font-black text-xl text-energy-orange outline-none"
																/>
																<span className="font-display font-black text-lg text-energy-orange space-x-0">€</span>
															</div>
														</div>
													</div>

													<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
														<div className="space-y-3">
															<div>
																<label className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
																	<div className="w-1 bg-neverland-green h-3 rounded-full" /> Principal
																</label>
																<textarea
																	rows={2}
																	value={menu.principal}
																	onChange={(e) => updateListItem('menusNiños', idx, 'principal', e.target.value)}
																	className="w-full bg-gray-50/50 p-3 rounded-2xl text-xs font-bold text-gray-700 border border-transparent focus:bg-white focus:border-neverland-green/20 outline-none resize-none transition-all leading-tight"
																	placeholder="Describe el plato fuerte..."
																/>
															</div>
															
															<div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
																<div className="flex items-center justify-between mb-1">
																	<label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Visibilidad</label>
																	<ToggleSwitch
																		active={!menu.suspended}
																		onChange={() => {
																			const newList = [...config.menusNiños];
																			newList[idx] = { ...newList[idx], suspended: !newList[idx].suspended };
																			setConfig({ ...config, menusNiños: newList });
																			handleSave({ ...config, menusNiños: newList });
																		}}
																	/>
																</div>
																<p className="text-[7px] font-bold text-gray-400 leading-tight">Si lo ocultas, no aparecerá en el formulario de reserva.</p>
															</div>
														</div>

														<div>
															<label className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
																<div className="w-1 bg-neverland-green h-3 rounded-full" /> También incluye
															</label>
															<textarea
																rows={4}
																value={menu.resto}
																onChange={(e) => updateListItem('menusNiños', idx, 'resto', e.target.value)}
																className="w-full h-[90px] bg-gray-50/50 p-3 rounded-2xl text-xs font-bold text-gray-500 border border-transparent focus:bg-white focus:border-neverland-green/20 outline-none resize-none transition-all leading-tight"
																placeholder="Usa saltos de línea para el resto de elementos..."
															/>
														</div>
													</div>

													<div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
														<button
															onClick={async () => {
																if (await removeItem('menusNiños', idx)) {
																	setEditingKidsMenuIdx(null);
																	window.history.back();
																}
															}}
															className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all font-display font-black text-[9px] uppercase tracking-wider"
														>
															<Trash2 size={14} /> Eliminar
														</button>
														<div className="flex items-center gap-3">
															<button
																onClick={() => handleSave()}
																className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl transition-all font-display font-black text-[10px] uppercase tracking-wider shadow-lg ${
																	isItemChanged('menusNiños', menu)
																		? 'bg-neverland-green text-white shadow-neverland-green/20 hover:scale-105 active:scale-95'
																		: 'bg-gray-100 text-gray-300 cursor-not-allowed'
																}`}
															>
																<Save size={14} /> Guardar Cambios
															</button>
														</div>
													</div>
												</div>
											</motion.div>
										</motion.div>
									);
								})()}
							</AnimatePresence>
						</AccordionSection>

						{/* Adult Menus */}
						<AccordionSection
							title="Menú de Adultos"
							subtitle="Catering & Raciones"
							icon={Utensils}
							color="border-l-energy-orange"
							isOpen={openSections.adults}
							onToggle={() => {
								toggleSection('adults');
								if (openSections.adults) setEditingAdultMenuIdx(null);
							}}
							action={
								<button
									onClick={(e) => {
										e.stopPropagation();
										const newIndex = addItem(
											'preciosAdultos',
											{
												nombre: '',
												precio: 0,
												unidades: '',
												isNew: true
											},
											'adults',
										);
										setEditingAdultMenuIdx(newIndex);
										toggleSection('adults', true);
									}}
									className="p-1.5 bg-neverland-green/10 text-neverland-green rounded-lg hover:bg-neverland-green hover:text-white transition-all shadow-sm shadow-neverland-green/5 flex items-center justify-center"
								>
									<Plus size={18} />
								</button>
							}
						>
							<div className="py-2">
								{/* Grid View */}
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
									{(config.preciosAdultos || []).map((menu, idx) => (
										<button
											key={menu.id || idx}
											onClick={() => setEditingAdultMenuIdx(idx)}
											className="group flex items-center gap-4 p-3 bg-gray-50/50 hover:bg-white border border-transparent hover:border-neverland-green/10 rounded-3xl transition-all hover:shadow-xl hover:shadow-neverland-green/5 text-left"
										>
											<div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-200 shrink-0 shadow-inner">
												{menu.imageUrl ? (
													<img src={menu.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
												) : (
													<div className="w-full h-full flex items-center justify-center text-gray-400">
														<ImageIcon size={20} />
													</div>
												)}
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-0.5">
													<h4 className="font-display font-black text-sm text-text-black truncate group-hover:text-neverland-green transition-colors">
														{menu.nombre || 'Sin nombre'}
													</h4>
													{menu.suspended && (
														<span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded-md text-[8px] font-black uppercase">Oculto</span>
													)}
												</div>
												<p className="text-[10px] font-medium text-gray-400 truncate">
													{menu.precio}€ • {menu.unidades || 'Sin unidades'}
												</p>
											</div>
											<div className="p-2 text-neverland-green/0 group-hover:text-neverland-green transition-all transform group-hover:translate-x-1">
												<Settings2 size={18} />
											</div>
										</button>
									))}
								</div>

								{/* Modal View */}
								<AnimatePresence>
									{editingAdultMenuIdx !== null && (
										<div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 cursor-default" onClick={(e) => e.stopPropagation()}>
											<motion.div
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
												onClick={() => setEditingAdultMenuIdx(null)}
												className="absolute inset-0 bg-text-black/40 backdrop-blur-md"
											/>
											<motion.div
												initial={{ opacity: 0, scale: 0.95, y: 20 }}
												animate={{ opacity: 1, scale: 1, y: 0 }}
												exit={{ opacity: 0, scale: 0.95, y: 20 }}
												className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden overflow-y-auto max-h-[92vh] flex flex-col"
											>
												{(() => {
													const menu = config.preciosAdultos[editingAdultMenuIdx];
													const idx = editingAdultMenuIdx;
													return (
														<div className="flex flex-col h-full">
															<div className="relative w-full h-[140px] sm:h-[180px] bg-gray-50 overflow-hidden shrink-0">
																{menu.imageUrl ? (
																	<>
																		<img
																			src={menu.imageUrl}
																			alt={menu.nombre}
																			className="w-full h-full object-cover"
																		/>
																		<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
																		<div className="absolute bottom-3 left-6 right-6 flex items-end justify-between">
																			<label className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-xl transition-all cursor-pointer border border-white/30 group">
																				<input
																					type="file"
																					className="hidden"
																					accept="image/*"
																					onChange={(e) => handleImageUpload(e, 'preciosAdultos', idx)}
																				/>
																				<Upload size={16} />
																				<span className="font-display font-black text-[10px] uppercase tracking-wider">Cambiar Foto</span>
																			</label>
																		</div>
																	</>
																) : (
																	<label className="w-full h-full cursor-pointer flex flex-col items-center justify-center gap-2 group/empty bg-neverland-green/5">
																		<input
																			type="file"
																			className="hidden"
																			accept="image/*"
																			onChange={(e) => handleImageUpload(e, 'preciosAdultos', idx)}
																		/>
																		<div className="w-10 h-10 rounded-xl bg-white text-neverland-green flex items-center justify-center shadow-sm group-hover/empty:scale-110 transition-all">
																			<ImageIcon size={20} />
																		</div>
																		<p className="text-[9px] font-black text-neverland-green uppercase tracking-widest">Subir Imagen</p>
																	</label>
																)}
																{uploadingId === (menu.id || idx) && (
																	<div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-2 z-20">
																		<Loader2 className="animate-spin text-neverland-green" size={24} />
																		<p className="text-[9px] font-black text-neverland-green uppercase">Subiendo...</p>
																	</div>
																)}
																	<button 
																		onClick={() => setEditingAdultMenuIdx(null)}
																		className="absolute top-3 right-3 z-30 p-1.5 bg-white/90 hover:bg-white text-text-black rounded-full shadow-lg transition-all border border-gray-100 group/close"
																	>
																		<X size={16} className="group-hover:scale-110 transition-transform" />
																	</button>
																</div>

															{/* Content Area */}
															<div className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto">
																<div className="flex items-center justify-between">
																	<div className="flex items-center gap-2">
																		{menu.suspended ? (
																			<span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
																				<EyeOff size={10} /> Oculta
																			</span>
																		) : (
																			<span className="px-2 py-0.5 bg-neverland-green/10 text-neverland-green rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
																				<Eye size={10} /> Activa
																			</span>
																		)}
																	</div>
																	<span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">ID #{idx + 1}</span>
																</div>

																<div className="w-full">
																	<label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5 px-1">
																		Nombre del Plato
																	</label>
																	<textarea
																		rows={1}
																		value={menu.nombre}
																		placeholder="Introduce un nombre..."
																		autoFocus={menu.isNew}
																		onChange={(e) => updateListItem('preciosAdultos', idx, 'nombre', e.target.value)}
																		className="w-full bg-transparent border-none font-display font-black text-lg sm:text-xl text-text-black outline-none placeholder:text-gray-100 focus:text-neverland-green transition-colors resize-none leading-tight"
																	/>
																</div>

																<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
																	<div className="flex flex-col gap-3">
																		<div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100/50">
																			<label className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Unidades / Ración</label>
																			<input
																				type="text"
																				value={menu.unidades}
																				placeholder="Ej: 12 uds / Bandeja"
																				onChange={(e) => updateListItem('preciosAdultos', idx, 'unidades', e.target.value)}
																				className="w-full bg-transparent p-0 font-display font-black text-gray-700 outline-none text-sm"
																			/>
																		</div>
																		<div className="bg-neverland-green/5 rounded-xl p-3 border border-neverland-green/10">
																			<label className="text-[8px] font-black text-neverland-green uppercase block mb-0.5">Precio</label>
																			<div className="flex items-center gap-0.5">
																				<input
																					type="number"
																					value={menu.precio}
																					onChange={(e) => updateListItem('preciosAdultos', idx, 'precio', parseFloat(e.target.value))}
																					className="w-full bg-transparent p-0 font-display font-black text-neverland-green outline-none text-sm"
																				/>
																				<span className="text-[9px] font-black text-neverland-green opacity-40">€</span>
																			</div>
																		</div>
																	</div>

																	<div className="flex flex-col gap-3">
																		<div className="flex items-center justify-between p-3 bg-gray-50/30 rounded-xl border border-gray-100/30 grow">
																			<div className="flex flex-col">
																				<span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Visibilidad</span>
																				<span className="text-[9px] font-bold text-gray-500">{menu.suspended ? 'Solo Admin' : 'Público'}</span>
																			</div>
																			<ToggleSwitch
																				active={!menu.suspended}
																				onChange={() => {
																					const newList = [...config.preciosAdultos];
																					newList[idx] = { ...newList[idx], suspended: !newList[idx].suspended };
																					setConfig({ ...config, preciosAdultos: newList });
																					handleSave({ ...config, preciosAdultos: newList });
																				}}
																			/>
																		</div>
																	</div>
																</div>

																<div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-1">
																	<button
																		onClick={() => removeItem('preciosAdultos', idx).then(() => setEditingAdultMenuIdx(null))}
																		className="flex items-center gap-1.5 px-2 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all font-display font-black text-[8px] uppercase tracking-wider"
																	>
																		<Trash2 size={12} /> Borrar
																	</button>
																	<div className="flex items-center gap-2">
																		<button
																			onClick={() => handleSave()}
																			className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all font-display font-black text-[9px] uppercase tracking-wider shadow-sm ${
																				isItemChanged('preciosAdultos', menu)
																					? 'bg-neverland-green text-white shadow-neverland-green/20 hover:scale-105 active:scale-95'
																					: 'bg-gray-100 text-gray-300 cursor-not-allowed'
																			}`}
																		>
																			<Save size={12} /> Guardar Cambios
																		</button>
																	</div>
																</div>
															</div>
														</div>
													);
												})()}
											</motion.div>
										</div>
									)}
								</AnimatePresence>
							</div>
						</AccordionSection>

						{/* Workshops */}
						<AccordionSection
							title="Actividades"
							subtitle="Extras por niño"
							icon={Sparkles}
							color="border-l-blue-400"
							isOpen={openSections.workshops}
							onToggle={() => {
								toggleSection('workshops');
								if (openSections.workshops) setEditingWorkshopIdx(null);
							}}
							action={
								<button
									onClick={(e) => {
										e.stopPropagation();
										const newIndex = addItem(
											'workshops',
											{
												name: '',
												priceBase: 0,
												pricePlus: 0,
												desc: '',
												isNew: true
											},
											'workshops',
										);
										setEditingWorkshopIdx(newIndex);
										toggleSection('workshops', true);
									}}
									className="p-1.5 bg-blue-400/10 text-blue-500 rounded-lg hover:bg-blue-400 hover:text-white transition-all shadow-sm shadow-blue-400/5 flex items-center justify-center"
								>
									<Plus size={18} />
								</button>
							}
						>
							<div className="py-2">
								{/* List View */}
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
									{(config.workshops || []).map((ws, idx) => (
										<button
											key={ws.id || idx}
											onClick={() => setEditingWorkshopIdx(idx)}
											className="group flex items-center gap-4 p-3 bg-gray-50/50 hover:bg-white border border-transparent hover:border-blue-100 rounded-3xl transition-all hover:shadow-xl hover:shadow-blue-500/5 text-left"
										>
											<div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-200 shrink-0 shadow-inner">
												{ws.imageUrl ? (
													<img src={ws.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
												) : (
													<div className="w-full h-full flex items-center justify-center text-gray-400">
														<ImageIcon size={20} />
													</div>
												)}
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-0.5">
													<h4 className="font-display font-black text-sm text-text-black truncate group-hover:text-blue-600 transition-colors">
														{ws.name || 'Sin nombre'}
													</h4>
													{ws.suspended && (
														<span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded-md text-[8px] font-black uppercase">Oculto</span>
													)}
												</div>
												<p className="text-[10px] font-medium text-gray-400 truncate">
													{ws.priceBase}€ / {ws.pricePlus}€
												</p>
											</div>
											<div className="p-2 text-blue-500/0 group-hover:text-blue-500 transition-all transform group-hover:translate-x-1">
												<Settings2 size={18} />
											</div>
										</button>
									))}
									
									{/* Empty State List */}
									{(!config.workshops || config.workshops.length === 0) && (
										<div className="col-span-full py-10 text-center bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
											<Sparkles className="mx-auto text-gray-300 mb-3" size={32} />
											<p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No hay actividades configuradas</p>
										</div>
									)}
								</div>

								{/* Modal Detail View */}
								<AnimatePresence>
									{editingWorkshopIdx !== null && (
										<div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
											{/* Backdrop */}
											<motion.div 
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
												onClick={() => setEditingWorkshopIdx(null)}
												className="absolute inset-0 bg-text-black/60 backdrop-blur-sm"
											/>

											{/* Modal Content */}
											<motion.div 
												initial={{ opacity: 0, scale: 0.95, y: 20 }}
												animate={{ opacity: 1, scale: 1, y: 0 }}
												exit={{ opacity: 0, scale: 0.95, y: 20 }}
												className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden overflow-y-auto max-h-[92vh] flex flex-col"
											>
												{(() => {
													const ws = config.workshops[editingWorkshopIdx];
													const idx = editingWorkshopIdx;
													return (
														<div className="flex flex-col h-full">
															<div className="relative w-full h-[140px] sm:h-[180px] bg-gray-50 overflow-hidden shrink-0">
																{ws.imageUrl ? (
																	<>
																		<img
																			src={ws.imageUrl}
																			alt={ws.name}
																			className="w-full h-full object-cover"
																		/>
																		<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
																		<div className="absolute bottom-3 left-6 right-6 flex items-end justify-between">
																			<label className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-xl transition-all cursor-pointer border border-white/30 group">
																				<input
																					type="file"
																					className="hidden"
																					accept="image/*"
																					onChange={(e) => handleImageUpload(e, 'workshops', idx)}
																				/>
																				<Upload size={16} />
																				<span className="font-display font-black text-[10px] uppercase tracking-wider">Cambiar Foto</span>
																			</label>
																		</div>
																	</>
																) : (
																	<label className="w-full h-full cursor-pointer flex flex-col items-center justify-center gap-2 group/empty bg-blue-50/20">
																		<input
																			type="file"
																			className="hidden"
																			accept="image/*"
																			onChange={(e) => handleImageUpload(e, 'workshops', idx)}
																		/>
																		<div className="w-10 h-10 rounded-xl bg-white text-blue-400 flex items-center justify-center shadow-sm group-hover/empty:scale-110 transition-all">
																			<ImageIcon size={20} />
																		</div>
																		<p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Subir Imagen</p>
																	</label>
																)}
																{uploadingId === (ws.id || idx) && (
																	<div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-2 z-20">
																		<Loader2 className="animate-spin text-blue-500" size={24} />
																		<p className="text-[9px] font-black text-blue-600 uppercase">Subiendo...</p>
																	</div>
																)}
																{/* Close Button UI Redesign - Top Right Floating */}
																<button 
																	onClick={() => setEditingWorkshopIdx(null)}
																	className="absolute top-3 right-3 z-30 p-1.5 bg-white/90 hover:bg-white text-text-black rounded-full shadow-lg transition-all border border-gray-100 group/close"
																>
																	<X size={16} className="group-hover:scale-110 transition-transform" />
																</button>
															</div>

															{/* Content Area - Compact Padding and Gaps */}
															<div className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto">
																{/* Header Info */}
																<div className="flex items-center justify-between">
																	<div className="flex items-center gap-2">
																		{ws.suspended ? (
																			<span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
																				<EyeOff size={10} /> Oculta
																			</span>
																		) : (
																			<span className="px-2 py-0.5 bg-neverland-green/10 text-neverland-green rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
																				<Eye size={10} /> Activa
																			</span>
																		)}
																	</div>
																	<span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">ID #{idx + 1}</span>
																</div>

																{/* Name Input */}
																<div className="w-full">
																	<label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5 px-1">
																		Título
																	</label>
																	<textarea
																		rows={1}
																		value={ws.name}
																		placeholder="Introduce un nombre..."
																		autoFocus={ws.isNew}
																		onChange={(e) => updateListItem('workshops', idx, 'name', e.target.value)}
																		className="w-full bg-transparent border-none font-display font-black text-lg sm:text-xl text-text-black outline-none placeholder:text-gray-100 focus:text-blue-600 transition-colors resize-none leading-tight"
																	/>
																</div>

																<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
																	{/* Description */}
																	<div className="relative">
																		<label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5 px-1">
																			Descripción
																		</label>
																		<textarea
																			value={ws.desc || ''}
																			onChange={(e) => {
																				if (e.target.value.length <= 150) {
																					updateListItem('workshops', idx, 'desc', e.target.value);
																				}
																			}}
																			placeholder="Máximo 150 caracteres..."
																			className="w-full bg-gray-50/50 p-3 rounded-xl text-[10px] font-medium text-gray-500 border border-transparent focus:bg-white focus:border-blue-100 outline-none resize-none transition-all h-[70px] leading-relaxed"
																		/>
																		<div className={`absolute bottom-2 right-3 text-[7px] font-black ${ (ws.desc?.length || 0) >= 140 ? 'text-red-400' : 'text-gray-200' }`}>
																			{ws.desc?.length || 0}/150
																		</div>
																	</div>

																	{/* Pricing & State */}
																	<div className="flex flex-col gap-3">
																		<div className="grid grid-cols-2 gap-2">
																			<div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100/50">
																				<label className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Precio Base</label>
																				<div className="flex items-center gap-0.5">
																					<input
																						type="number"
																						value={ws.priceBase}
																						onChange={(e) => updateListItem('workshops', idx, 'priceBase', parseFloat(e.target.value))}
																						className="w-full bg-transparent p-0 font-display font-black text-gray-700 outline-none text-sm"
																					/>
																					<span className="text-[9px] font-black text-gray-300">€</span>
																				</div>
																			</div>
																			<div className="bg-blue-50/30 rounded-xl p-3 border border-blue-100/20">
																				<label className="text-[8px] font-black text-blue-400 uppercase block mb-0.5">Precio Plus</label>
																				<div className="flex items-center gap-0.5">
																					<input
																						type="number"
																						value={ws.pricePlus}
																						onChange={(e) => updateListItem('workshops', idx, 'pricePlus', parseFloat(e.target.value))}
																						className="w-full bg-transparent p-0 font-display font-black text-blue-500 outline-none text-sm"
																					/>
																					<span className="text-[9px] font-black text-blue-300">€</span>
																				</div>
																			</div>
																		</div>

																		<div className="flex items-center justify-between p-3 bg-gray-50/30 rounded-xl border border-gray-100/30">
																			<div className="flex flex-col">
																				<span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Visibilidad</span>
																				<span className="text-[9px] font-bold text-gray-500">{ws.suspended ? 'Solo Admin' : 'Público'}</span>
																			</div>
																			<ToggleSwitch
																				active={!ws.suspended}
																				onChange={() => {
																					const newList = [...config.workshops];
																					newList[idx] = { ...newList[idx], suspended: !newList[idx].suspended };
																					setConfig({ ...config, workshops: newList });
																					handleSave({ ...config, workshops: newList });
																				}}
																			/>
																		</div>
																	</div>
																</div>

																{/* Footer Actions */}
																<div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-1">
																	<button
																		onClick={() => removeItem('workshops', idx).then(() => setEditingWorkshopIdx(null))}
																		className="flex items-center gap-1.5 px-2 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all font-display font-black text-[8px] uppercase tracking-wider"
																	>
																		<Trash2 size={12} /> Borrar
																	</button>
																	
																	<div className="flex items-center gap-2">
																		<button
																			onClick={() => handleSave()}
																			className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all font-display font-black text-[9px] uppercase tracking-wider shadow-sm ${
																				isItemChanged('workshops', ws)
																					? 'bg-blue-500 text-white shadow-blue-500/20 hover:scale-105 active:scale-95'
																					: 'bg-gray-100 text-gray-300 cursor-not-allowed'
																			}`}
																		>
																			<Save size={12} /> Guardar Cambios
																		</button>
																	</div>
																</div>
															</div>
														</div>
													);
												})()}
											</motion.div>
										</div>
									)}
								</AnimatePresence>
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
							action={
								<button
									onClick={(e) => {
										e.stopPropagation();
										toggleSection('characters', true);
										const newIdx = addItem('characters', {
											nombre: 'Nuevo Personaje',
											name: 'Nuevo Personaje',
											suspended: false,
											imageUrl: ''
										}, 'characters');
										setEditingCharacterIdx(newIdx);
									}}
									className="p-1.5 bg-purple-500 text-white rounded-lg hover:scale-110 active:scale-95 transition-all shadow-md shadow-purple-500/20"
								>
									<Plus size={18} />
								</button>
							}
						>
							<div className="py-2">
								{/* Characters Grid */}
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
									{(config.characters || []).map((char, idx) => (
										<button
											key={char.id || idx}
											onClick={() => setEditingCharacterIdx(idx)}
											className={`group flex items-center gap-4 p-3 bg-gray-50/50 hover:bg-white border border-transparent hover:border-purple-200/30 rounded-3xl transition-all hover:shadow-xl hover:shadow-purple-500/5 text-left ${
												char.suspended ? 'opacity-50' : ''
											}`}
										>
											<div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-200 shrink-0 shadow-inner">
												{char.imageUrl ? (
													<img src={char.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
												) : (
													<div className="w-full h-full flex items-center justify-center text-gray-400">
														<ImageIcon size={20} />
													</div>
												)}
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-0.5">
													<h4 className="font-display font-black text-sm text-text-black truncate group-hover:text-purple-600 transition-colors">
														{char.nombre || char.name || 'Sin nombre'}
													</h4>
													{char.suspended && (
														<span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded-md text-[8px] font-black uppercase">Oculto</span>
													)}
												</div>
												<p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
													Catálogo Animación
												</p>
											</div>
											<div className="p-2 text-purple-500/0 group-hover:text-purple-500 transition-all transform group-hover:translate-x-1">
												<Settings2 size={18} />
											</div>
										</button>
									))}
								</div>

								{/* Character Modal Editor */}
								<AnimatePresence>
									{editingCharacterIdx !== null && (() => {
										const char = config.characters[editingCharacterIdx];
										const idx = editingCharacterIdx;
										
										return (
											<motion.div
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
												className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-text-black/20 text-text-black"
												onClick={(e) => {
													if (e.target === e.currentTarget) {
														setEditingCharacterIdx(null);
														window.history.back();
													}
												}}
											>
												<motion.div
													initial={{ scale: 0.95, y: 20 }}
													animate={{ scale: 1, y: 0 }}
													exit={{ scale: 0.95, y: 20 }}
													className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
													onClick={(e) => e.stopPropagation()}
												>
													{/* Image Upload Area */}
													<div className="relative w-full h-[140px] sm:h-[180px] bg-gray-100 overflow-hidden shrink-0">
														{char.imageUrl ? (
															<>
																<img 
																	src={char.imageUrl} 
																	alt={char.nombre || char.name} 
																	className="w-full h-full object-cover"
																/>
																<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
																<div className="absolute bottom-3 left-6 right-6 flex items-end justify-between">
																	<label className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-xl transition-all cursor-pointer border border-white/30 group">
																		<input
																			type="file"
																			className="hidden"
																			accept="image/*"
																			onChange={(e) => handleImageUpload(e, 'characters', idx)}
																		/>
																		<Upload size={16} />
																		<span className="font-display font-black text-[10px] uppercase tracking-wider">Cambiar Foto</span>
																	</label>
																</div>
															</>
														) : (
															<label className="w-full h-full cursor-pointer flex flex-col items-center justify-center gap-2 group/empty bg-purple-50/20">
																<input
																	type="file"
																	className="hidden"
																	accept="image/*"
																	onChange={(e) => handleImageUpload(e, 'characters', idx)}
																/>
																<div className="w-10 h-10 rounded-2xl bg-white text-purple-400 flex items-center justify-center shadow-lg group-hover/empty:scale-110 transition-all">
																	<ImageIcon size={20} />
																</div>
																<p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Añadir Foto del Personaje</p>
															</label>
														)}
														
														{uploadingId === (char.id || idx) && (
															<div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-2 z-20">
																<Loader2 className="animate-spin text-purple-500" size={32} />
																<p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Subiendo imagen...</p>
															</div>
														)}

														<button 
															onClick={() => {
																setEditingCharacterIdx(null);
																window.history.back();
															}}
															className="absolute top-3 right-3 z-30 p-1.5 bg-white/90 hover:bg-white text-text-black rounded-full shadow-lg transition-all border border-gray-100 group/close"
														>
															<X size={16} className="group-hover:scale-110 transition-transform" />
														</button>
													</div>

													{/* Content Area */}
													<div className="p-5 sm:p-7 flex flex-col gap-4 overflow-y-auto min-h-0">
														<div className="flex justify-between items-center -mb-1">
															<div className="w-full">
																<label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1 px-1">Nombre del Personaje</label>
																<input
																	type="text"
																	value={char.nombre || char.name}
																	onChange={(e) => {
																		updateListItem('characters', idx, {
																			nombre: e.target.value,
																			name: e.target.value,
																		});
																	}}
																	className="w-full bg-transparent border-none font-display font-black text-2xl text-text-black outline-none placeholder:text-gray-100 focus:text-purple-600 transition-colors"
																	placeholder="Nombre del personaje..."
																/>
															</div>
														</div>

														<div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mt-2">
															<div className="flex items-center justify-between mb-1">
																<div className="flex flex-col">
																	<label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Visibilidad</label>
																	<span className="text-[9px] font-bold text-gray-500">{char.suspended ? 'Oculto en Reserva' : 'Público'}</span>
																</div>
																<ToggleSwitch
																	active={!char.suspended}
																	onChange={() => updateListItem('characters', idx, 'suspended', !char.suspended)}
																/>
															</div>
															<p className="text-[7px] font-bold text-gray-400 leading-tight">Si lo ocultas, no aparecerá en el catálogo de visitas durante la reserva.</p>
														</div>

														<div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
															<button
																onClick={async () => {
																	if (await removeItem('characters', idx)) {
																		setEditingCharacterIdx(null);
																		window.history.back();
																	}
																}}
																className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all font-display font-black text-[9px] uppercase tracking-wider"
															>
																<Trash2 size={12} /> Eliminar Personaje
															</button>
															
															<button
																onClick={() => {
																	handleSave();
																	setEditingCharacterIdx(null);
																	window.history.back();
																}}
																className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl transition-all font-display font-black text-[10px] uppercase tracking-widest shadow-lg ${
																	isItemChanged('characters', char)
																		? 'bg-purple-600 text-white shadow-purple-200 hover:scale-105 active:scale-95'
																		: 'bg-gray-100 text-gray-300 cursor-not-allowed'
																}`}
															>
																<Save size={14} /> Guardar
															</button>
														</div>
													</div>
												</motion.div>
											</motion.div>
										);
									})()}
								</AnimatePresence>
							</div>
						</AccordionSection>

						{/* Extras Adicionales */}
						<AccordionSection
							title="Extras Adicionales"
							subtitle="Catálogo Genérico"
							icon={Gift}
							color="border-l-pink-500"
							isOpen={openSections.extrasCatalogo}
							onToggle={() => toggleSection('extrasCatalogo')}
							action={
								<button
									onClick={(e) => {
										e.stopPropagation();
										const newIdx = addItem(
											'extrasCatalogo',
											{
												nombre: 'Nuevo Extra',
												slug: '',
												descripcion: '',
												precio: 0,
												imageUrl: '',
												suspended: false,
												active: true,
												isNew: true,
											},
											'extrasCatalogo',
										);
										setEditingExtraCatalogoIdx(newIdx);
										toggleSection('extrasCatalogo', true);
									}}
									className="p-1.5 bg-pink-500 text-white rounded-lg hover:scale-110 active:scale-95 transition-all shadow-md shadow-pink-500/20"
								>
									<Plus size={18} />
								</button>
							}
						>
								<div className="py-2">
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
										{(config.extrasCatalogo || []).map((item, idx) => (
											<button
												key={item.id || idx}
												onClick={() => setEditingExtraCatalogoIdx(idx)}
												className={`group flex items-center gap-4 p-3 bg-gray-50/50 hover:bg-white border border-transparent hover:border-pink-200/30 rounded-3xl transition-all hover:shadow-xl hover:shadow-pink-500/5 text-left ${
													item.suspended || !item.active ? 'opacity-50' : ''
												}`}
											>
												<div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-200 shrink-0 shadow-inner">
													{item.imageUrl ? (
														<img src={item.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
													) : (
														<div className="w-full h-full flex items-center justify-center text-gray-400">
															<ImageIcon size={20} />
														</div>
													)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-0.5">
														<h4 className="font-display font-black text-sm text-text-black truncate group-hover:text-pink-600 transition-colors">
															{item.nombre || 'Sin nombre'}
														</h4>
														{item.suspended && (
															<span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded-md text-[8px] font-black uppercase">Oculto</span>
														)}
														{!item.active && !item.suspended && (
															<span className="px-1.5 py-0.5 bg-red-100 text-red-500 rounded-md text-[8px] font-black uppercase">Inactivo</span>
														)}
													</div>
													<p className="text-[10px] font-medium text-gray-400 truncate">
															{item.precio}€
														</p>
												</div>
												<div className="p-2 text-pink-500/0 group-hover:text-pink-500 transition-all transform group-hover:translate-x-1">
													<Settings2 size={18} />
												</div>
											</button>
										))}
									</div>

									{/* Modal Editor */}
									<AnimatePresence>
										{editingExtraCatalogoIdx !== null && (() => {
											const item = config.extrasCatalogo[editingExtraCatalogoIdx];
											const idx = editingExtraCatalogoIdx;
											const isEditing = !item.isNew;

											const handleSaveCatalogItem = () => {
												if (!String(item.nombre || '').trim()) {
													toast.error('El nombre es obligatorio');
													return;
												}
												if (!String(item.slug || '').trim()) {
													toast.error('El slug es obligatorio');
													return;
												}
												if (item.precio < 0) {
													toast.error('El precio no puede ser negativo');
													return;
												}
												const duplicate = (config.extrasCatalogo || []).some(
													(it, i) => i !== idx && String(it.slug).trim() === String(item.slug).trim()
												);
												if (duplicate) {
													toast.error('El slug ya existe en el catálogo');
													return;
												}
												const cleaned = { ...item, isNew: undefined };
												handleSave({ ...config, extrasCatalogo: config.extrasCatalogo.map((it, i) => (i === idx ? cleaned : it)) });
												setEditingExtraCatalogoIdx(null);
												window.history.back();
											};

											const generateSlug = (name) => {
												return String(name || '')
													.toLowerCase()
													.normalize('NFD')
													.replace(/[\u0300-\u036f]/g, '')
													.replace(/[^a-z0-9]+/g, '-')
													.replace(/^-+|-+$/g, '')
													.substring(0, 50);
											};

											return (
												<motion.div
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-text-black/20 text-text-black"
													onClick={(e) => {
														if (e.target === e.currentTarget) {
															setEditingExtraCatalogoIdx(null);
															window.history.back();
														}
													}}
												>
													<motion.div
														initial={{ scale: 0.95, y: 20 }}
														animate={{ scale: 1, y: 0 }}
														exit={{ scale: 0.95, y: 20 }}
														className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
														onClick={(e) => e.stopPropagation()}
													>
														{/* Image Upload Area */}
														<div className="relative w-full h-[140px] sm:h-[180px] bg-gray-100 overflow-hidden shrink-0">
															{item.imageUrl ? (
																<>
																	<img
																		src={item.imageUrl}
																		alt={item.nombre}
																		className="w-full h-full object-cover"
																	/>
																	<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
																	<div className="absolute bottom-3 left-6 right-6 flex items-end justify-between">
																		<label className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-xl transition-all cursor-pointer border border-white/30 group">
																			<input
																				type="file"
																				className="hidden"
																				accept="image/*"
																				onChange={(e) => handleImageUpload(e, 'extrasCatalogo', idx)}
																			/>
																			<Upload size={16} />
																			<span className="font-display font-black text-[10px] uppercase tracking-wider">Cambiar Foto</span>
																		</label>
																	</div>
																</>
															) : (
																<label className="w-full h-full cursor-pointer flex flex-col items-center justify-center gap-2 group/empty bg-pink-50/20">
																	<input
																		type="file"
																		className="hidden"
																		accept="image/*"
																		onChange={(e) => handleImageUpload(e, 'extrasCatalogo', idx)}
																	/>
																	<div className="w-10 h-10 rounded-xl bg-white text-pink-400 flex items-center justify-center shadow-sm group-hover/empty:scale-110 transition-all">
																		<ImageIcon size={20} />
																	</div>
																	<p className="text-[9px] font-black text-pink-400 uppercase tracking-widest">Subir Imagen</p>
																</label>
															)}
															{uploadingId === (item.id || idx) && (
																<div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-2 z-20">
																	<Loader2 className="animate-spin text-pink-500" size={24} />
																	<p className="text-[9px] font-black text-pink-600 uppercase">Subiendo...</p>
																</div>
															)}
															<button
																onClick={() => {
																	setEditingExtraCatalogoIdx(null);
																	window.history.back();
																}}
																className="absolute top-3 right-3 z-30 p-1.5 bg-white/90 hover:bg-white text-text-black rounded-full shadow-lg transition-all border border-gray-100 group/close"
															>
																<X size={16} className="group-hover:scale-110 transition-transform" />
															</button>
														</div>

														{/* Content Area */}
														<div className="p-5 sm:p-7 flex flex-col gap-4 overflow-y-auto min-h-0">
															<div className="flex justify-between items-center -mb-1">
																<div className="w-full max-w-[70%]">
																	<label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nombre</label>
																	<input
																		type="text"
																		value={item.nombre || ''}
																		onChange={(e) => {
																			const nombre = e.target.value;
																			const updates = { nombre };
																			if (!isEditing) {
																				updates.slug = generateSlug(nombre);
																			}
																			updateListItem('extrasCatalogo', idx, updates);
																		}}
																		className="w-full bg-transparent border-none font-display font-black text-xl text-text-black outline-none placeholder:text-gray-100 focus:text-pink-600 transition-colors"
																		placeholder="Ej: Snack Bar..."
																	/>
																</div>
																<div className="bg-pink-50 px-4 py-1.5 rounded-2xl border border-pink-100/50 text-right">
																	<label className="text-[8px] font-black text-pink-500 uppercase tracking-widest block mb-0.5">Precio</label>
																	<div className="flex items-center gap-1 justify-end">
																		<input
																			type="number"
																			value={item.precio}
																			min={0}
																			step="0.5"
																			onChange={(e) => updateListItem('extrasCatalogo', idx, 'precio', parseFloat(e.target.value))}
																			className="w-14 bg-transparent text-right font-display font-black text-xl text-pink-500 outline-none"
																		/>
																		<span className="font-display font-black text-lg text-pink-500 space-x-0">€</span>
																	</div>
																</div>
															</div>

															<div>
																<label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Slug</label>
																<input
																	type="text"
																	value={item.slug || ''}
																	disabled={isEditing}
																	onChange={(e) => updateListItem('extrasCatalogo', idx, 'slug', e.target.value)}
																	className={`w-full bg-gray-50 p-3 rounded-2xl text-xs font-bold text-text-black border border-transparent focus:bg-white focus:border-pink-200 outline-none transition-all ${
																		isEditing ? 'text-gray-400 cursor-not-allowed' : ''
																	}`}
																	placeholder="slug-del-extra"
																/>
																{isEditing && (
																	<p className="text-[7px] font-bold text-gray-400 mt-1">El slug no se puede editar una vez creado.</p>
																)}
															</div>

															<div>
																<label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Descripción</label>
																<textarea
																	rows={3}
																	value={item.descripcion || ''}
																	onChange={(e) => updateListItem('extrasCatalogo', idx, 'descripcion', e.target.value)}
																	className="w-full bg-gray-50/50 p-3 rounded-2xl text-xs font-bold text-gray-700 border border-transparent focus:bg-white focus:border-pink-200 outline-none resize-none transition-all leading-tight"
																	placeholder="Describe el extra..."
																/>
															</div>

															<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
																<div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
																	<div className="flex items-center justify-between mb-1">
																		<label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Activo</label>
																		<ToggleSwitch
																			active={!!item.active}
																			onChange={() => updateListItem('extrasCatalogo', idx, 'active', !item.active)}
																		/>
																	</div>
																	<p className="text-[7px] font-bold text-gray-400 leading-tight">Visible en la web y reservas.</p>
																</div>
																<div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
																	<div className="flex items-center justify-between mb-1">
																		<label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Suspendido</label>
																		<ToggleSwitch
																			active={!item.suspended}
																			onChange={() => updateListItem('extrasCatalogo', idx, 'suspended', !item.suspended)}
																		/>
																	</div>
																	<p className="text-[7px] font-bold text-gray-400 leading-tight">Oculto temporalmente sin borrar.</p>
																</div>
															</div>

															<div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
																<button
																	onClick={async () => {
																		if (await removeItem('extrasCatalogo', idx)) {
																			setEditingExtraCatalogoIdx(null);
																			window.history.back();
																		}
																	}}
																	className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all font-display font-black text-[9px] uppercase tracking-wider"
																>
																	<Trash2 size={14} /> Eliminar
																</button>
																<button
																	onClick={handleSaveCatalogItem}
																	className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl transition-all font-display font-black text-[10px] uppercase tracking-wider shadow-lg ${
																		isItemChanged('extrasCatalogo', item) || item.isNew
																			? 'bg-pink-500 text-white shadow-pink-500/20 hover:scale-105 active:scale-95'
																			: 'bg-gray-100 text-gray-300 cursor-not-allowed'
																	}`}
																>
																	<Save size={14} /> Guardar
																</button>
															</div>
														</div>
													</motion.div>
												</motion.div>
											);
										})()}
									</AnimatePresence>
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
