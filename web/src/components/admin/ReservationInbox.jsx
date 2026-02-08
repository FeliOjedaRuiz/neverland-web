import React, { useState, useEffect } from 'react';
import {
	PlusCircle,
	Check,
	X,
	Loader2,
	Phone,
	Calendar as CalendarIcon,
} from 'lucide-react';
import {
	getReservations,
	updateReservation,
	deleteReservation,
} from '../../services/api';

const ReservationInbox = () => {
	const [reservations, setReservations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState('pendiente'); // pendiente, confirmado

	const fetchReservations = async () => {
		setLoading(true);
		try {
			const res = await getReservations();
			setReservations(res.data);
		} catch (err) {
			console.error('Error fetching reservations:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchReservations();
	}, []);

	const handleStatusChange = async (id, newStatus) => {
		try {
			await updateReservation(id, { estado: newStatus });
			fetchReservations();
		} catch (err) {
			console.error('Error updating reservation:', err);
			alert('Error al actualizar la reserva');
		}
	};

	const handleDelete = async (id) => {
		if (window.confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
			try {
				await deleteReservation(id);
				fetchReservations();
			} catch (err) {
				console.error('Error deleting reservation:', err);
				alert('Error al eliminar la reserva');
			}
		}
	};

	const filteredReservations = reservations.filter((r) => r.estado === filter);

	const formatDate = (dateString) => {
		const options = {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		};
		return new Date(dateString).toLocaleDateString('es-ES', options);
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div className="flex gap-2 bg-gray-100 p-1 rounded-full">
					<button
						onClick={() => setFilter('pendiente')}
						className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${filter === 'pendiente' ? 'bg-white text-neverland-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
					>
						Pendientes
					</button>
					<button
						onClick={() => setFilter('confirmado')}
						className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${filter === 'confirmado' ? 'bg-white text-neverland-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
					>
						Confirmadas
					</button>
				</div>
				<button className="flex items-center gap-2 px-4 py-2 bg-energy-orange text-white rounded-lg text-sm font-bold shadow-md hover:bg-opacity-90 transition-all">
					<PlusCircle size={16} />
					Bloquear Día
				</button>
			</div>

			<div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm min-h-[400px]">
				{loading ? (
					<div className="flex flex-col items-center justify-center h-96 text-gray-400 gap-4">
						<Loader2 className="animate-spin text-neverland-green" size={48} />
						<p className="font-medium">Cargando reservas...</p>
					</div>
				) : filteredReservations.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-96 text-gray-400 gap-4">
						<CalendarIcon size={64} className="opacity-10" />
						<p className="italic">No hay reservas {filter}s en este momento.</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead className="bg-gray-50 text-gray-500 text-xs font-black uppercase tracking-wider">
								<tr>
									<th className="px-6 py-4">Fecha / Turno</th>
									<th className="px-6 py-4">Cliente</th>
									<th className="px-6 py-4 text-center">Niños</th>
									<th className="px-6 py-4">Menú</th>
									<th className="px-6 py-4">Total</th>
									<th className="px-6 py-4 text-right">Acciones</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100 text-sm">
								{filteredReservations.map((item) => (
									<tr
										key={item.id}
										className="hover:bg-gray-50 transition-colors"
									>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="font-bold text-text-black">
												{formatDate(item.fecha)}
											</div>
											<div className="text-xs text-energy-orange font-bold uppercase">
												{item.turno}
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="font-bold text-text-black">
												{item.cliente?.nombreNiño}
											</div>
											<div className="text-xs text-gray-500 flex items-center gap-1">
												<Users size={12} /> {item.cliente?.nombrePadre}
											</div>
											<a
												href={`https://wa.me/${item.cliente?.telefono?.replace(/\s/g, '')}`}
												target="_blank"
												rel="noreferrer"
												className="text-xs text-neverland-green hover:underline flex items-center gap-1 mt-1"
											>
												<Phone size={12} /> {item.cliente?.telefono}
											</a>
										</td>
										<td className="px-6 py-4 text-center font-bold">
											{item.detalles?.niños?.cantidad}
										</td>
										<td className="px-6 py-4 uppercase font-medium">
											Menú {item.detalles?.niños?.menuId}
										</td>
										<td className="px-6 py-4 font-black text-neverland-green text-lg">
											{item.precioTotal}€
										</td>
										<td className="px-6 py-4 text-right whitespace-nowrap">
											<div className="flex justify-end gap-2">
												{item.estado === 'pendiente' && (
													<button
														onClick={() =>
															handleStatusChange(item.id, 'confirmado')
														}
														className="p-2 text-white bg-neverland-green rounded-lg hover:bg-opacity-90 shadow-sm transition-all hover:scale-105"
														title="Confirmar"
													>
														<Check size={18} />
													</button>
												)}
												<button
													onClick={() => handleDelete(item.id)}
													className="p-2 text-white bg-red-400 rounded-lg hover:bg-opacity-90 shadow-sm transition-all hover:scale-105"
													title="Rechazar/Eliminar"
												>
													<X size={18} />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
};

export default ReservationInbox;
