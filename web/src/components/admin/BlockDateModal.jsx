import React, { useState } from 'react';
import { X, Calendar, Clock, Lock, Loader2 } from 'lucide-react';
import { createBooking } from '../../services/api';

const BlockDateModal = ({ isOpen, onClose, onBlockCreated }) => {
	const [fecha, setFecha] = useState('');
	const [selectedTurns, setSelectedTurns] = useState(['T1']);
	const [notasAdmin, setNotasAdmin] = useState('');
	const [loading, setLoading] = useState(false);

	if (!isOpen) return null;

	const toggleTurn = (id) => {
		if (selectedTurns.includes(id)) {
			if (selectedTurns.length > 1) {
				setSelectedTurns(selectedTurns.filter((t) => t !== id));
			}
		} else {
			setSelectedTurns([...selectedTurns, id]);
		}
	};

	const selectAllTurns = () => {
		setSelectedTurns(['T1', 'T2', 'T3']);
	};

	const handleBlock = async (e) => {
		e.preventDefault();
		if (!fecha) return alert('Por favor selecciona una fecha');
		if (selectedTurns.length === 0)
			return alert('Selecciona al menos un turno');

		setLoading(true);
		try {
			// Iterate through selected turns and create blocks
			await Promise.all(
				selectedTurns.map((t) =>
					createBooking({
						tipo: 'bloqueo',
						fecha: fecha,
						turno: t,
						estado: 'confirmado',
						notasAdmin: notasAdmin,
						detalles: {
							niños: { cantidad: 12, menuId: 1 },
							extras: {
								taller: 'ninguno',
								personaje: 'ninguno',
								pinata: false,
							},
							adultos: [],
						},
					}),
				),
			);
			onBlockCreated();
			onClose();
		} catch (err) {
			console.error('Error creating block:', err);
			alert(err.response?.data?.message || 'Error al crear el bloqueo');
		} finally {
			setLoading(false);
		}
	};

	const SHIFTS_DATA = [
		{ id: 'T1', label: 'T1', time: '17:00' },
		{ id: 'T2', label: 'T2', time: '18:00' },
		{ id: 'T3', label: 'T3', time: '19:15' },
	];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
			<div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
				<div className="p-6 bg-energy-orange text-white flex justify-between items-center">
					<div className="flex items-center gap-3">
						<Lock size={24} />
						<h3 className="text-xl font-display font-black">Bloquear Turnos</h3>
					</div>
					<button
						onClick={onClose}
						className="p-2 hover:bg-white/20 rounded-full transition-all"
					>
						<X size={24} />
					</button>
				</div>

				<form onSubmit={handleBlock} className="p-8 space-y-6">
					<div className="space-y-2">
						<label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
							<Calendar size={14} /> Fecha a Bloquear
						</label>
						<input
							type="date"
							required
							min={new Date().toISOString().split('T')[0]}
							value={fecha}
							onChange={(e) => setFecha(e.target.value)}
							className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-energy-orange/10 focus:border-energy-orange outline-none transition-all"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
							<Lock size={14} /> Asunto (Opcional)
						</label>
						<input
							type="text"
							placeholder="Mantenimiento, limpieza, etc."
							value={notasAdmin}
							onChange={(e) => setNotasAdmin(e.target.value)}
							className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-energy-orange/10 focus:border-energy-orange outline-none transition-all"
						/>
					</div>

					<div className="space-y-4">
						<div className="flex justify-between items-end">
							<label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
								<Clock size={14} /> Seleccionar Turnos
							</label>
							<button
								type="button"
								onClick={selectAllTurns}
								className="text-[10px] font-black uppercase text-energy-orange hover:underline px-2 py-1 bg-energy-orange/5 rounded-lg"
							>
								Día completo
							</button>
						</div>
						<div className="grid grid-cols-3 gap-3">
							{SHIFTS_DATA.map((t) => (
								<button
									key={t.id}
									type="button"
									onClick={() => toggleTurn(t.id)}
									className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
										selectedTurns.includes(t.id)
											? 'border-energy-orange bg-energy-orange/5 text-energy-orange shadow-md'
											: 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
									}`}
								>
									<span className="font-black text-base">{t.label}</span>
									<span className="text-[10px] uppercase font-bold">
										{t.time}
									</span>
								</button>
							))}
						</div>
						<p className="text-[9px] text-gray-300 font-medium">
							* Puedes seleccionar varios turnos a la vez.
						</p>
					</div>

					<div className="pt-4">
						<button
							type="submit"
							disabled={loading}
							className="w-full py-4 bg-energy-orange text-white rounded-full font-display font-bold text-lg shadow-lg hover:shadow-xl hover:bg-[#e65a00] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
						>
							{loading ? (
								<Loader2 className="animate-spin" size={24} />
							) : (
								<>
									<Lock size={20} />
									Bloquear {selectedTurns.length}{' '}
									{selectedTurns.length === 1 ? 'Turno' : 'Turnos'}
								</>
							)}
						</button>
						<p className="text-center text-[10px] text-gray-400 mt-4 font-medium italic">
							* Los turnos seleccionados dejarán de estar disponibles.
						</p>
					</div>
				</form>
			</div>
		</div>
	);
};

export default BlockDateModal;
