import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, Loader2 } from 'lucide-react';
import {
	getConfig,
	updateConfig,
	getWorkshops,
	deleteWorkshop,
} from '../../services/api';

const ConfigurationPanel = () => {
	const [config, setConfig] = useState(null);
	const [workshops, setWorkshops] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const [configRes, workshopsRes] = await Promise.all([
					getConfig(),
					getWorkshops(),
				]);
				setConfig(configRes.data);
				setWorkshops(workshopsRes.data);
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

	const handleDeleteWorkshop = async (id) => {
		if (window.confirm('¿Deseas eliminar este taller?')) {
			try {
				await deleteWorkshop(id);
				setWorkshops(workshops.filter((ws) => ws.id !== id));
			} catch (err) {
				console.error('Error deleting workshop:', err);
				alert('Error al eliminar taller');
			}
		}
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
		<div className="space-y-10">
			{/* Prices for Kids */}
			{config && (
				<>
					<section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
						<div className="flex justify-between items-center mb-6">
							<h4 className="text-lg font-bold text-text-black">
								Precios por Menú (Niños)
							</h4>
							<button
								onClick={handleSaveConfig}
								disabled={saving}
								className="flex items-center gap-2 px-6 py-2 bg-neverland-green text-white rounded-xl text-sm font-bold shadow-md hover:bg-opacity-90 disabled:opacity-50 transition-all"
							>
								{saving ? (
									<Loader2 className="animate-spin" size={16} />
								) : (
									<Save size={16} />
								)}
								{saving ? 'Guardando...' : 'Guardar Precios'}
							</button>
						</div>
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
								<label className="text-xs font-black text-gray-400 uppercase text-[10px]">
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

					{/* Extras Config */}
					<section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
						<h4 className="text-lg font-bold text-text-black mb-6">
							Extras y Extensiones
						</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
							{Object.entries(config.preciosExtras).map(([key, value]) => (
								<div key={key} className="flex flex-col gap-2">
									<label className="text-xs font-black text-gray-400 uppercase text-[10px]">
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

			{/* Workshops Management */}
			<section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
				<div className="flex justify-between items-center mb-6">
					<h4 className="text-lg font-bold text-text-black">
						Catálogo de Talleres
					</h4>
					<button className="flex items-center gap-2 px-4 py-2 bg-energy-orange text-white rounded-xl text-sm font-bold shadow-md hover:bg-opacity-90">
						<Plus size={16} />
						Añadir Taller
					</button>
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{workshops.length === 0 ? (
						<p className="text-gray-400 italic text-center col-span-2 py-8">
							No hay talleres configurados.
						</p>
					) : (
						workshops.map((ws) => (
							<div
								key={ws.id}
								className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-neverland-green/30 transition-all group"
							>
								<div>
									<p className="font-bold text-text-black group-hover:text-neverland-green transition-colors">
										{ws.nombre}
									</p>
									<p className="text-xs text-gray-500 font-medium">
										{ws.duracionMinutos} min | {ws.capacidadMaxima || '∞'} niños
									</p>
								</div>
								<div className="flex items-center gap-4">
									<span className="font-black text-neverland-green text-lg">
										{ws.precio}€
									</span>
									<div className="flex gap-1">
										<button className="p-2 text-gray-400 hover:text-neverland-green hover:bg-white rounded-lg transition-all">
											<Edit2 size={16} />
										</button>
										<button
											onClick={() => handleDeleteWorkshop(ws.id)}
											className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
										>
											<Trash2 size={16} />
										</button>
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</section>
		</div>
	);
};

export default ConfigurationPanel;
