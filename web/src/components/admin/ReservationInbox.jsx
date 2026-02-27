import React, { useState, useEffect, useCallback } from 'react';
import {
	Eye,
	MessageCircle,
	Loader2,
	Calendar as CalendarIcon,
	ChevronLeft,
	ChevronRight,
	Clock,
	ArrowUpWideNarrow,
	ArrowDownWideNarrow,
	Search,
	X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getReservations } from '../../services/api';
import { formatSafeDate } from '../../utils/safeDate';

const ReservationInbox = () => {
	const navigate = useNavigate();
	const [reservations, setReservations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState('pendiente'); // pendiente, confirmado, historial
	const [sortBy, setSortBy] = useState('createdAt'); // createdAt (reciente), fecha (evento)
	const [order, setOrder] = useState('desc');
	const [page, setPage] = useState(1);
	const [pagination, setPagination] = useState({ total: 0, pages: 1 });
	const [searchTerm, setSearchTerm] = useState('');
	const limit = 10;

	const fetchReservations = useCallback(async () => {
		setLoading(true);
		try {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const params = {
				estado: filter === 'historial' ? 'confirmado' : filter,
				tipo: 'reserva',
				page,
				limit,
				sortBy,
				order,
				search: searchTerm,
			};

			if (filter === 'confirmado') {
				params.from = today.toISOString();
			} else if (filter === 'historial') {
				const yesterday = new Date(today);
				yesterday.setMilliseconds(-1); // End of yesterday
				params.to = yesterday.toISOString();
			}

			const res = await getReservations(params);

			if (res.data && res.data.data) {
				setReservations(res.data.data);
				setPagination(res.data.meta);
			} else {
				setReservations(Array.isArray(res.data) ? res.data : []);
			}
		} catch (err) {
			console.error('Error fetching reservations:', err);
			setReservations([]);
		} finally {
			setLoading(false);
		}
	}, [filter, page, sortBy, order, searchTerm]);

	useEffect(() => {
		const delayDebounceFn = setTimeout(() => {
			fetchReservations();
		}, 300);

		return () => clearTimeout(delayDebounceFn);
	}, [fetchReservations]);

	const toggleSort = (newSortBy) => {
		if (sortBy === newSortBy) {
			setOrder(order === 'asc' ? 'desc' : 'asc');
		} else {
			setSortBy(newSortBy);
			setOrder('desc');
		}
		setPage(1);
	};

	const handleFilterChange = (newFilter) => {
		setFilter(newFilter);
		if (newFilter === 'pendiente') {
			setSortBy('createdAt');
			setOrder('desc');
		} else if (newFilter === 'confirmado') {
			setSortBy('fecha');
			setOrder('asc'); // Closest future events first
		} else {
			setSortBy('fecha');
			setOrder('desc'); // Most recent past events first
		}
		setPage(1);
	};

	return (
		<div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
			{/* Filters Header - Compacted for Mobile */}
			<div className="px-3 py-2.5 sm:px-6 sm:py-4 bg-gray-50/50 border-b border-gray-100 flex flex-col xl:flex-row justify-between items-center shrink-0 gap-3 sm:gap-4">
				<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full xl:w-auto">
					<div className="flex gap-1 bg-gray-200/50 p-1 rounded-2xl w-full sm:w-auto shadow-inner">
						<button
							onClick={() => handleFilterChange('pendiente')}
							className={`flex-1 sm:flex-none px-2 sm:px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
								filter === 'pendiente'
									? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 active:scale-95'
									: 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
							}`}
						>
							Pendientes
						</button>
						<button
							onClick={() => handleFilterChange('confirmado')}
							className={`flex-1 sm:flex-none px-2 sm:px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
								filter === 'confirmado'
									? 'bg-neverland-green text-white shadow-lg shadow-neverland-green/20 active:scale-95'
									: 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
							}`}
						>
							Confirmadas
						</button>
						<button
							onClick={() => handleFilterChange('historial')}
							className={`flex-1 sm:flex-none px-2 sm:px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
								filter === 'historial'
									? 'bg-gray-600 text-white shadow-lg shadow-gray-500/20 active:scale-95'
									: 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
							}`}
						>
							Historial
						</button>
					</div>

					{/* Search Bar */}
					<div className="relative flex-1 sm:min-w-[300px]">
						<Search
							size={18}
							className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
						/>
						<input
							type="text"
							placeholder="Buscar por nombre o ID..."
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setPage(1);
							}}
							className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-text-black placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-neverland-green/20 focus:border-neverland-green transition-all shadow-sm"
						/>
						{searchTerm && (
							<button
								onClick={() => setSearchTerm('')}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
							>
								<X size={16} />
							</button>
						)}
					</div>
				</div>

				<div className="flex items-center gap-3 sm:gap-4 w-full xl:w-auto justify-between sm:justify-end">
					<div className="flex items-center gap-1.5 sm:gap-2 bg-white rounded-xl p-1 border border-gray-100 shadow-sm">
						{filter === 'pendiente' && (
							<button
								onClick={() => toggleSort('createdAt')}
								className={`p-1.5 sm:p-2 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 ${sortBy === 'createdAt' ? 'bg-neverland-green/10 text-neverland-green' : 'text-gray-400 hover:text-gray-600'}`}
								title="Ordenar por fecha de solicitud"
							>
								<div className="flex items-center gap-1">
									<Clock size={16} />
									{sortBy === 'createdAt' &&
										(order === 'asc' ? (
											<ArrowUpWideNarrow size={12} />
										) : (
											<ArrowDownWideNarrow size={12} />
										))}
								</div>
								<span className="text-[9px] sm:text-[10px] font-black uppercase">
									Reciente
								</span>
							</button>
						)}
						<button
							onClick={() => toggleSort('fecha')}
							className={`p-1.5 sm:p-2 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 ${sortBy === 'fecha' ? 'bg-neverland-green/10 text-neverland-green' : 'text-gray-400 hover:text-gray-600'}`}
							title="Ordenar por fecha del evento"
						>
							<div className="flex items-center gap-1">
								<CalendarIcon size={16} />
								{sortBy === 'fecha' &&
									(order === 'asc' ? (
										<ArrowUpWideNarrow size={12} />
									) : (
										<ArrowDownWideNarrow size={12} />
									))}
							</div>
							<span className="text-[9px] sm:text-[10px] font-black uppercase">
								Por fecha
							</span>
						</button>
					</div>
					<p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">
						Total: {pagination.total}
					</p>
				</div>
			</div>

			{/* List Area */}
			<div className="flex-1 overflow-y-auto min-h-0 bg-white">
				{loading ? (
					<div className="flex flex-col items-center justify-center h-full py-20 text-gray-300 gap-4">
						<Loader2
							className="animate-spin text-neverland-green/40"
							size={48}
						/>
						<p className="font-display font-black uppercase tracking-widest text-[10px]">
							Sincronizando reservas...
						</p>
					</div>
				) : reservations.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-gray-300 gap-4 py-20 px-6">
						<CalendarIcon size={48} className="opacity-10" />
						<p className="font-display font-black uppercase tracking-widest text-[10px] text-center">
							No hay reservas {filter}as
						</p>
					</div>
				) : (
					<div className="divide-y divide-gray-50">
						{reservations.map((item) => (
							<div
								key={item.id}
								className="group flex items-center justify-between p-3.5 sm:p-5 hover:bg-neverland-green/5 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-neverland-green"
								onClick={() => navigate(`/admin/evento/${item.id}`)}
							>
								<div className="flex-1 min-w-0 pr-4">
									{/* Principal Area: Name */}
									<h4
										className={`font-display font-black text-xl truncate leading-tight mb-2 transition-colors ${
											filter === 'pendiente'
												? 'text-orange-500'
												: filter === 'confirmado'
													? 'text-neverland-green'
													: 'text-gray-600'
										}`}
									>
										{item.cliente?.nombreNiño}
										{item.cliente?.edadNiño && (
											<span className="text-gray-300 font-bold ml-2 text-sm uppercase tracking-tighter">
												{item.cliente.edadNiño} años
											</span>
										)}
									</h4>

									{/* Primary Info: Date & Turn */}
									<div className="flex items-center gap-3 mb-3">
										<div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-[11px] font-black text-gray-700">
											<CalendarIcon
												size={12}
												className="text-neverland-green"
											/>
											{formatSafeDate(item.fecha)}
										</div>
										<div className="flex items-center gap-1.5 px-3 py-1 bg-orange-100/30 rounded-full text-[10px] font-black text-orange-600 uppercase border border-orange-100/50">
											<Clock size={12} />
											{item.turno} |{' '}
											{item.horario?.inicio && item.horario?.fin
												? `${item.horario.inicio} - ${item.horario.fin}`
												: item.turno === 'T1'
													? '17:00 - 19:00'
													: item.turno === 'T2'
														? '18:00 - 20:00'
														: '19:15 - 21:15'}
										</div>
									</div>

									{/* Secondary Info Area */}
									<div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-gray-400">
										<div className="flex items-center gap-1">
											<span className="opacity-50">ID:</span>
											<span className="text-neverland-green/60">
												{item.publicId}
											</span>
										</div>
										<div className="flex items-center gap-1">
											<span className="opacity-50">Solicitado:</span>
											<span>{formatSafeDate(item.createdAt)}</span>
										</div>
									</div>
								</div>

								<div className="flex items-center gap-2 shrink-0">
									<a
										href={`https://wa.me/${String(item.cliente?.telefono || '').replace(/\s/g, '')}`}
										target="_blank"
										rel="noreferrer"
										onClick={(e) => e.stopPropagation()}
										className="p-2 sm:p-2.5 text-white bg-[#25D366] rounded-xl hover:bg-[#128C7E] hover:scale-110 active:scale-95 transition-all shadow-md shadow-green-500/20"
										title="Contactar por WhatsApp"
									>
										<svg
											viewBox="0 0 24 24"
											className="w-5 h-5 sm:w-6 sm:h-6 fill-current"
										>
											<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.81 9.81 0 017.008 2.895 9.835 9.835 0 012.876 7.003c-.001 5.45-4.436 9.884-9.885 9.884m8.413-18.293A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
										</svg>
									</a>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Pagination Footer */}
			{!loading && pagination.pages > 1 && (
				<div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between shrink-0">
					<button
						disabled={page === 1}
						onClick={() => setPage(page - 1)}
						className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-neverland-green hover:border-neverland-green disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all"
					>
						<ChevronLeft size={20} />
					</button>

					<div className="flex items-center gap-2">
						<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
							Página {page} de {pagination.pages}
						</span>
					</div>

					<button
						disabled={page === pagination.pages}
						onClick={() => setPage(page + 1)}
						className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-neverland-green hover:border-neverland-green disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all"
					>
						<ChevronRight size={20} />
					</button>
				</div>
			)}
		</div>
	);
};

export default ReservationInbox;
