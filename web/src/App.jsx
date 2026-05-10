import {
	BrowserRouter as Router,
	Routes,
	Route,
	useLocation,
	Navigate,
} from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import React, { useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import MinimalFooter from './components/layout/MinimalFooter';
import WhatsAppButton from './components/common/WhatsAppButton';
import HomePage from './pages/HomePage';
import PwaUpdater from './components/common/PwaUpdater';

import BookingPage from './pages/BookingPage';
import BudgetPage from './pages/BudgetPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import CancelacionPage from './pages/CancelacionPage';
import ServerError from './pages/ServerError';
import InvitationPage from './pages/InvitationPage';
import PricingPage from './pages/PricingPage';
// import CustomerReservationDetail from './pages/CustomerReservationDetail'; // Removed unified view
import RequireAuth from './components/admin/RequireAuth';
import { Toaster } from 'react-hot-toast';

// Admin Components
import ReservationInbox from './components/admin/ReservationInbox';
import CalendarView from './components/admin/CalendarView';
import DayDetailView from './components/admin/DayDetailView';
import ReservationDetailView from './components/admin/ReservationDetailView';
import ConfigurationPanel from './components/admin/ConfigurationPanel';

// Talleres Components
import TalleresList from './components/admin/TalleresList';
import TallerForm from './components/admin/TallerForm';
import TallerDetail from './components/admin/TallerDetail';
import TalleresListPage from './pages/TalleresListPage';
import TallerPublicDetail from './components/talleres/TallerPublicDetail';
import InscripcionResumen from './components/talleres/InscripcionResumen';

function Layout() {
	const location = useLocation();
	const isAdminPath = location.pathname.startsWith('/admin');
	const isBookingPath = location.pathname === '/booking';
	const isBudgetPath = location.pathname === '/presupuesto';
	const isHomePage = location.pathname === '/';
	const isInvitationPath = location.pathname.startsWith('/invitacion');

	useEffect(() => {
		const scrollToHash = (behavior = 'smooth') => {
			if (location.hash) {
				const id = location.hash.replace('#', '');
				const element = document.getElementById(id);
				if (element) {
					element.scrollIntoView({ behavior });
					return true;
				}
			}
			return false;
		};

		if (location.hash) {
			// Intento inmediato (auto para que sea instantáneo en carga inicial)
			scrollToHash('auto');

			// Re-intentos con retraso para compensar cambios de layout (imágenes, secciones dinámicas como Menús)
			const timers = [
				setTimeout(() => scrollToHash('smooth'), 100),
				setTimeout(() => scrollToHash('smooth'), 500),
				setTimeout(() => scrollToHash('smooth'), 1000),
				setTimeout(() => scrollToHash('smooth'), 2000), // Margen de seguridad para conexiones lentas
			];

			return () => timers.forEach(clearTimeout);
		} else {
			// Solo scroll al inicio si cambia la ruta y no hay ancla
			window.scrollTo(0, 0);
		}
	}, [location.pathname, location.hash]);

	return (
		<div className="min-h-dvh font-sans bg-cream-bg flex flex-col overflow-x-hidden">
			<Toaster position="top-center" reverseOrder={false} />
			<PwaUpdater />
			{!isAdminPath && !isInvitationPath && <Navbar />}
			<main className="grow">
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/booking" element={<BookingPage />} />
					<Route path="/precios" element={<PricingPage />} />
					<Route path="/presupuesto" element={<BudgetPage />} />
					<Route path="/talleres" element={<TalleresListPage />} />
					<Route path="/talleres/:id" element={<TallerPublicDetailWrapper />} />
					<Route path="/talleres/:id/confirmacion" element={<InscripcionResumen />} />
					<Route path="/talleres/cancelacion" element={<CancelacionPage />} />
					<Route path="/admin/login" element={<LoginPage />} />
					<Route path="/mi-reserva/:id" element={<ReservationDetailView />} />
					<Route path="/invitacion/:id" element={<InvitationPage />} />
					<Route
						path="/admin/dashboard"
						element={<Navigate to="/admin" replace />}
					/>
					<Route
						path="/admin"
						element={
							<RequireAuth>
								<AdminDashboard />
							</RequireAuth>
						}
					>
						<Route index element={<ReservationInbox />} />
						<Route path="reservas" element={<ReservationInbox />} />
						<Route path="calendario" element={<CalendarView />} />
						<Route path="calendario/:date" element={<DayDetailView />} />
						<Route path="evento/:id" element={<ReservationDetailView />} />
						<Route path="config" element={<ConfigurationPanel />} />
						<Route path="talleres" element={<TalleresList />} />
						<Route path="talleres/nuevo" element={<TallerForm />} />
						<Route path="talleres/:id" element={<TallerDetail />} />
						<Route path="talleres/:id/editar" element={<TallerForm />} />
					</Route>

					{/* Rutas de prueba para errores (puedes borrarlas luego) */}
					<Route path="/test-404" element={<NotFound />} />
					<Route path="/test-500" element={<ServerError />} />

					<Route path="*" element={<NotFound />} />
				</Routes>
			</main>

			{!isAdminPath && !isBookingPath && !isBudgetPath && !isInvitationPath && <Footer />}
			{isHomePage && <WhatsAppButton />}
		</div>
	);
}

class GlobalErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false };
	}
	static getDerivedStateFromError() {
		return { hasError: true };
	}
	render() {
		if (this.state.hasError) {
			return <ServerError />;
		}
		return this.props.children;
	}
}

function App() {
	return (
		<Router>
			<GlobalErrorBoundary>
				<Layout />
				<Analytics />
			</GlobalErrorBoundary>
		</Router>
	);
}

export default App;
