import React, { useState } from 'react';
import {
	BarChart,
	Calendar as CalendarIcon,
	Inbox,
	Settings,
	LogOut,
	Search,
	Menu,
	X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReservationInbox from '../components/admin/ReservationInbox';
import ConfigurationPanel from '../components/admin/ConfigurationPanel';

import CalendarView from '../components/admin/CalendarView';
import DayDetailView from '../components/admin/DayDetailView';
import ReservationDetailView from '../components/admin/ReservationDetailView';
import ErrorPage from './ErrorPage';

const SidebarContent = ({
	activeTab,
	setActiveTab,
	setIsMobileMenuOpen,
	sidebarItems,
	navigate,
	handleLogout,
}) => (
	<>
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
					onClick={() => {
						setActiveTab(item.id);
						setIsMobileMenuOpen(false);
					}}
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
	</>
);

const AdminDashboard = () => {
	const [activeTab, setActiveTab] = useState('reservas');
	const [selectedDate, setSelectedDate] = useState(null);
	const [selectedReservation, setSelectedReservation] = useState(null);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const navigate = useNavigate();

	// Reset details when changing tab
	React.useEffect(() => {
		setSelectedDate(null);
		setSelectedReservation(null);
	}, [activeTab]);

	// Handle browser back button
	React.useEffect(() => {
		const handlePopState = () => {
			if (selectedReservation) {
				setSelectedReservation(null);
			} else if (selectedDate) {
				setSelectedDate(null);
			}
		};

		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	}, [selectedDate, selectedReservation]);

	const handleDateSelect = (date) => {
		setSelectedDate(date);
		window.history.pushState(
			{ view: 'dayDetail' },
			'',
			window.location.pathname,
		);
	};

	const handleReservationSelect = (res) => {
		setSelectedReservation(res);
		window.history.pushState(
			{ view: 'resDetail' },
			'',
			window.location.pathname,
		);
	};

	const handleBack = () => {
		window.history.back();
	};

	const sidebarItems = [
		{ id: 'reservas', label: 'Bandeja de Entrada', icon: Inbox },
		{ id: 'calendario', label: 'Calendario', icon: CalendarIcon },
		{ id: 'config', label: 'Configuración', icon: Settings },
	];

	const handleLogout = () => {
		localStorage.removeItem('token');
		navigate('/admin/login');
	};

	const commonProps = {
		activeTab,
		setActiveTab,
		setIsMobileMenuOpen,
		sidebarItems,
		navigate,
		handleLogout,
	};

	return (
		<div className="flex h-screen bg-white overflow-hidden font-sans">
			{/* Sidebar Desktop */}
			<aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col">
				<SidebarContent {...commonProps} />
			</aside>

			{/* Sidebar Mobile Overlay */}
			{isMobileMenuOpen && (
				<div
					className="fixed inset-0 bg-black/20 z-50 md:hidden backdrop-blur-md flex justify-end animate-in fade-in duration-300"
					onClick={() => setIsMobileMenuOpen(false)}
				>
					<aside
						className="w-[280px] h-full bg-white flex flex-col shadow-2xl shadow-black/10 animate-in slide-in-from-right duration-300 ease-out rounded-l-[32px]"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex justify-end p-4">
							<button
								onClick={() => setIsMobileMenuOpen(false)}
								className="p-2 text-gray-400 hover:text-neverland-green"
							>
								<X size={24} />
							</button>
						</div>
						<SidebarContent {...commonProps} />
					</aside>
				</div>
			)}

			{/* Main Content */}
			<main className="flex-1 flex flex-col overflow-hidden">
				{/* Header Content */}
				<header className="bg-white border-b border-gray-100 p-4 flex justify-between items-center shadow-soft relative z-10">
					{activeTab && (
						<div className="flex items-center gap-3">
							<div className="p-2.5 bg-neverland-green/5 text-neverland-green rounded-2xl">
								{React.createElement(
									sidebarItems.find((i) => i.id === activeTab)?.icon || Inbox,
									{ size: 24 },
								)}
							</div>
							<div>
								<h3 className="text-xl font-display font-black text-text-black leading-tight">
									{selectedReservation
										? 'Detalle de Reserva'
										: sidebarItems.find((i) => i.id === activeTab)?.label}
								</h3>
								<p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
									{selectedReservation
										? 'Información Completa'
										: activeTab === 'reservas'
											? 'Gestión de Reservas'
											: activeTab === 'calendario'
												? 'Vista Mensual y Agenda'
												: 'Precios, Menús y Catálogo'}
								</p>
							</div>
						</div>
					)}
					<button
						onClick={() => setIsMobileMenuOpen(true)}
						className="p-2 text-gray-600 hover:text-neverland-green md:hidden"
					>
						<Menu size={24} />
					</button>
				</header>

				{/* Scrollable Content Area */}
				<div className="flex-1 overflow-y-auto p-0">
					{selectedReservation ? (
						<ErrorBoundary>
							<ReservationDetailView
								reservation={selectedReservation}
								onBack={handleBack}
							/>
						</ErrorBoundary>
					) : activeTab === 'reservas' ? (
						<ErrorBoundary>
							<ReservationInbox onViewReservation={handleReservationSelect} />
						</ErrorBoundary>
					) : activeTab === 'config' ? (
						<ErrorBoundary>
							<ConfigurationPanel />
						</ErrorBoundary>
					) : activeTab === 'calendario' ? (
						<ErrorBoundary>
							{selectedDate ? (
								<DayDetailView
									date={selectedDate}
									onBack={handleBack}
									onViewReservation={handleReservationSelect}
								/>
							) : (
								<CalendarView onDayClick={handleDateSelect} />
							)}
						</ErrorBoundary>
					) : null}
				</div>
			</main>
		</div>
	);
};

// Simple local error boundary
class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}
	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}
	render() {
		if (this.state.hasError) {
			return (
				<div className="h-full overflow-y-auto">
					<ErrorPage
						code={500}
						message="Hubo un error crítico al cargar esta sección del panel."
					/>
				</div>
			);
		}
		return this.props.children;
	}
}

export default AdminDashboard;
