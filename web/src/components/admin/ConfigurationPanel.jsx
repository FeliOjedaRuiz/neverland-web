import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Loader2, X } from 'lucide-react';
import { getConfig, updateConfig } from '../../services/api';

const ConfigurationPanel = () => {
	const [config, setConfig] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const res = await getConfig();
				setConfig(res.data);
			} catch (err) {
				console.error('Error fetching data:', err);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	const handleSaveConfig = async () => {
		setSaving(true);
		try {
			await updateConfig(config);
			alert('Configuración guardada correctamente');
		} catch (err) {
			console.error('Error saving config:', err);
			alert('Error al guardar la configuración');
		} finally {
			setSaving(false);
		}
	};

	const addItem = (field, defaultObj) => {
		setConfig({
			...config,
			[field]: [...(config[field] || []), defaultObj],
		});
	};

	const removeItem = (field, index) => {
		const newList = [...config[field]];
		newList.splice(index, 1);
		setConfig({ ...config, [field]: newList });
	};

	const updateListItem = (field, index, key, value) => {
		const newList = [...config[field]];
		newList[index] = { ...newList[index], [key]: value };
		setConfig({ ...config, [field]: newList });
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-96 text-gray-400 gap-4">
				<Loader2 className="animate-spin text-neverland-green" size={48} />
				<p className="font-medium">Cargando configuración...</p>
			</div>
		);
	}

	return (
		<div className="space-y-10 pb-20">
			{/* Top Bar with Global Save */}
			<div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-0 z-20">
				<div>
					<h3 className="text-xl font-display font-black text-neverland-green">
						Configuración del Sitio
					</h3>
					<p className="text-xs text-gray-400 font-medium">
						Gestiona precios, menús y opciones de reserva
					</p>
				</div>
				<button
					onClick={handleSaveConfig}
					disabled={saving}
					className="flex items-center gap-2 px-8 py-3 bg-neverland-green text-white rounded-2xl font-bold shadow-lg hover:bg-[#1f554d] disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
				>
					{saving ? (
						<Loader2 className="animate-spin" size={20} />
					) : (
						<Save size={20} />
					)}
					{saving ? 'Guardando...' : 'Guardar Cambios Globales'}
				</button>
			</div>

			{config && (
				<>
					{/* Prices for Kids */}
					<section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
						<h4 className="text-lg font-bold text-text-black mb-6 flex items-center gap-2">
							<span className="w-2 h-8 bg-neverland-green rounded-full"></span>
							Precios Menú Infantil & Fin de Semana
						</h4>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
							{[1, 2, 3, 4].map((id) => (
								<div key={id} className="space-y-2">
									<label className="text-xs font-black text-gray-400 uppercase">
										Menú {id}
									</label>
									<div className="relative">
										<input
											type="number"
											value={config.preciosNiños[id]}
											onChange={(e) =>
												setConfig({
													...config,
													preciosNiños: {
														...config.preciosNiños,
														[id]: parseFloat(e.target.value),
													},
												})
											}
											className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:ring-2 focus:ring-neverland-green outline-none"
										/>
										<span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
											€
										</span>
									</div>
								</div>
							))}
							<div className="space-y-2">
								<label className="text-xs font-black text-gray-400 uppercase">
									Plus Fin de Semana
								</label>
								<div className="relative">
									<input
										type="number"
										value={config.preciosNiños.plusFinDeSemana}
										onChange={(e) =>
											setConfig({
												...config,
												preciosNiños: {
													...config.preciosNiños,
													plusFinDeSemana: parseFloat(e.target.value),
												},
											})
										}
										className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:ring-2 focus:ring-neverland-green outline-none"
									/>
									<span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
										€
									</span>
								</div>
							</div>
						</div>
					</section>

					{/* Adult Menus */}
					<section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
						<div className="flex justify-between items-center mb-6">
							<h4 className="text-lg font-bold text-text-black flex items-center gap-2">
								<span className="w-2 h-8 bg-energy-orange rounded-full"></span>
								Opciones Menú Adultos
							</h4>
							<button
								onClick={() =>
									addItem('preciosAdultos', {
										id: Date.now().toString(),
										nombre: '',
										precio: 0,
										unidades: '',
									})
								}
								className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
							>
								<Plus size={14} />
								Añadir Opción
							</button>
						</div>
						<div className="space-y-4">
							{(config.preciosAdultos || []).map((menu, idx) => (
								<div
									key={idx}
									className="flex flex-wrap md:flex-nowrap gap-4 items-end p-4 bg-gray-50 rounded-2xl border border-gray-100"
								>
									<div className="flex-1 min-w-[200px] space-y-1">
										<label className="text-[10px] font-black text-gray-400 uppercase">
											Nombre del Plato
										</label>
										<input
											type="text"
											value={menu.nombre}
											onChange={(e) =>
												updateListItem(
													'preciosAdultos',
													idx,
													'nombre',
													e.target.value,
												)
											}
											className="w-full p-2 bg-white border border-gray-100 rounded-lg text-sm font-bold outline-none"
										/>
									</div>
									<div className="w-24 space-y-1">
										<label className="text-[10px] font-black text-gray-400 uppercase">
											Precio
										</label>
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
											className="w-full p-2 bg-white border border-gray-100 rounded-lg text-sm font-bold outline-none"
										/>
									</div>
									<div className="w-32 space-y-1">
										<label className="text-[10px] font-black text-gray-400 uppercase">
											Ración/Unidades
										</label>
										<input
											type="text"
											value={menu.unidades}
											onChange={(e) =>
												updateListItem(
													'preciosAdultos',
													idx,
													'unidades',
													e.target.value,
												)
											}
											className="w-full p-2 bg-white border border-gray-100 rounded-lg text-sm font-bold outline-none"
										/>
									</div>
									<button
										onClick={() => removeItem('preciosAdultos', idx)}
										className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all mb-0.5"
									>
										<Trash2 size={18} />
									</button>
								</div>
							))}
						</div>
					</section>

					{/* Workshops Management */}
					<section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
						<div className="flex justify-between items-center mb-6">
							<h4 className="text-lg font-bold text-text-black flex items-center gap-2">
								<span className="w-2 h-8 bg-blue-400 rounded-full"></span>
								Gestión de Talleres
							</h4>
							<button
								onClick={() =>
									addItem('workshops', {
										id: Date.now().toString(),
										name: '',
										priceBase: 0,
										pricePlus: 0,
										desc: '',
									})
								}
								className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
							>
								<Plus size={14} />
								Nuevo Taller
							</button>
						</div>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{(config.workshops || []).map((ws, idx) => (
								<div
									key={idx}
									className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4 relative"
								>
									<div className="grid grid-cols-2 gap-4">
										<div className="col-span-2 space-y-1">
											<label className="text-[10px] font-black text-gray-400 uppercase">
												Nombre del Taller
											</label>
											<input
												type="text"
												value={ws.name}
												onChange={(e) =>
													updateListItem(
														'workshops',
														idx,
														'name',
														e.target.value,
													)
												}
												className="w-full p-2 bg-white border border-gray-100 rounded-lg text-sm font-bold outline-none"
											/>
										</div>
										<div className="space-y-1">
											<label className="text-[10px] font-black text-gray-400 uppercase">
												Precio Base (≤25 niños)
											</label>
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
												className="w-full p-2 bg-white border border-gray-100 rounded-lg text-sm font-bold outline-none"
											/>
										</div>
										<div className="space-y-1">
											<label className="text-[10px] font-black text-gray-400 uppercase">
												Precio Plus ({'>'}25 niños)
											</label>
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
												className="w-full p-2 bg-white border border-gray-100 rounded-lg text-sm font-bold outline-none"
											/>
										</div>
									</div>
									<button
										onClick={() => removeItem('workshops', idx)}
										className="absolute top-2 right-2 p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"
									>
										<Trash2 size={16} />
									</button>
								</div>
							))}
						</div>
					</section>

					{/* Characters section */}
					<section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
						<div className="flex justify-between items-center mb-6">
							<h4 className="text-lg font-bold text-text-black flex items-center gap-2">
								<span className="w-2 h-8 bg-purple-400 rounded-full"></span>
								Personajes Disponibles
							</h4>
							<button
								onClick={() => {
									const name = window.prompt('Nombre del nuevo personaje:');
									if (name) {
										setConfig({
											...config,
											characters: [...config.characters, name],
										});
									}
								}}
								className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
							>
								<Plus size={14} />
								Añadir Personaje
							</button>
						</div>
						<div className="flex flex-wrap gap-2">
							{(config.characters || []).map((char, idx) => (
								<div
									key={idx}
									className="group flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-sm font-bold text-gray-700 hover:border-purple-200 hover:bg-purple-50 transition-all"
								>
									{char}
									<button
										onClick={() => {
											const newList = [...config.characters];
											newList.splice(idx, 1);
											setConfig({ ...config, characters: newList });
										}}
										className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
									>
										<X size={14} />
									</button>
								</div>
							))}
						</div>
					</section>

					{/* Extras Prices section */}
					<section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
						<h4 className="text-lg font-bold text-text-black mb-6 flex items-center gap-2">
							<span className="w-2 h-8 bg-neverland-green rounded-full"></span>
							Otros Precios de Extras
						</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
							{Object.entries(config.preciosExtras).map(([key, value]) => (
								<div key={key} className="flex flex-col gap-2">
									<label className="text-[10px] font-black text-gray-400 uppercase">
										{key.replace(/([A-Z])/g, ' $1')}
									</label>
									<div className="relative">
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
											className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:ring-2 focus:ring-neverland-green outline-none"
										/>
										<span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
											€
										</span>
									</div>
								</div>
							))}
						</div>
					</section>
				</>
			)}
		</div>
	);
};

export default ConfigurationPanel;
