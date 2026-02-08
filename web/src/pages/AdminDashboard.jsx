import React, { useState } from 'react';
import {
	BarChart,
	Calendar as CalendarIcon,
	Inbox,
	Settings,
	LogOut,
	Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReservationInbox from '../components/admin/ReservationInbox';
import ConfigurationPanel from '../components/admin/ConfigurationPanel';

const AdminDashboard = () => {
	const [activeTab, setActiveTab] = useState('reservas');
	const navigate = useNavigate();

	const sidebarItems = [
		{ id: 'reservas', label: 'Bandeja de Entrada', icon: Inbox },
		{ id: 'calendario', label: 'Calendario', icon: CalendarIcon },
		{ id: 'config', label: 'Configuración', icon: Settings },
	];

	const handleLogout = () => {
		localStorage.removeItem('token');
		navigate('/admin/login');
	};

	return (
		<div className="flex h-screen bg-cream-bg overflow-hidden font-sans">
			{/* Sidebar */}
			<aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col">
				<div className="p-6">
					<h2 className="text-xl font-display font-black text-neverland-green flex items-center gap-2">
						<BarChart size={24} />
						NEVERLAND{' '}
						<span className="text-text-muted font-light font-sans text-xs">
							ADMIN
						</span>
					</h2>
				</div>

				<nav className="flex-1 px-4 space-y-2 mt-4">
					{sidebarItems.map((item) => (
						<button
							key={item.id}
							onClick={() => setActiveTab(item.id)}
							className={`w-full flex items-center gap-3 px-4 py-3 rounded-full font-medium transition-all font-display ${
								activeTab === item.id
									? 'bg-neverland-green text-white shadow-md'
									: 'text-gray-600 hover:bg-gray-50'
							}`}
						>
							<item.icon size={20} />
							{item.label}
						</button>
					))}
				</nav>

				<div className="p-4 border-t border-gray-100 space-y-1">
					<button
						onClick={() => navigate('/')}
						className="w-full flex items-center gap-3 px-4 py-3 rounded-full font-medium text-gray-400 hover:text-neverland-green hover:bg-gray-50 transition-all group font-display"
					>
						<LogOut
							size={20}
							className="rotate-180 group-hover:-translate-x-1 transition-transform"
						/>
						Volver a Inicio
					</button>
					<button
						onClick={handleLogout}
						className="w-full flex items-center gap-3 px-4 py-3 rounded-full font-medium text-red-600 hover:bg-red-50 transition-all font-display"
					>
						<LogOut size={20} />
						Cerrar Sesión
					</button>
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 flex flex-col overflow-hidden">
				{/* Header Content */}
				<header className="bg-white border-b border-gray-100 p-6 flex justify-between items-center shadow-soft relative z-10">
					<h3 className="text-xl font-display font-bold text-text-black capitalize">
						{activeTab.replace('-', ' ')}
					</h3>
					<div className="flex items-center gap-4">
						<div className="relative hidden sm:block">
							<Search
								className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
								size={16}
							/>
							<input
								type="text"
								placeholder="Buscar..."
								className="pl-10 pr-4 py-2 bg-cream-bg/50 border-none rounded-full text-sm focus:ring-2 focus:ring-neverland-green/50 outline-none w-64 font-sans text-text-black"
							/>
						</div>
						<button className="p-2 bg-neverland-green text-white rounded-full sm:hidden">
							<Search size={20} />
						</button>
						<div className="w-10 h-10 rounded-full bg-neverland-green/20 text-neverland-green flex items-center justify-center font-display font-bold">
							AD
						</div>
					</div>
				</header>

				{/* Scrollable Content Area */}
				<div className="flex-1 overflow-y-auto p-6">
					{activeTab === 'reservas' && <ReservationInbox />}
					{activeTab === 'config' && <ConfigurationPanel />}

					{activeTab === 'calendario' && (
						<div className="flex flex-col items-center justify-center h-full text-gray-400">
							<CalendarIcon size={48} className="mb-4 opacity-20" />
							<p className="italic">Calendario interactivo en desarrollo...</p>
						</div>
					)}
				</div>
			</main>
		</div>
	);
};

export default AdminDashboard;
