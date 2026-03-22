import {
	BrowserRouter as Router,
	Routes,
	Route,
	useLocation,
	Navigate,
} from 'react-router-dom';
import React, { useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import MinimalFooter from './components/layout/MinimalFooter';
import WhatsAppButton from './components/common/WhatsAppButton';
import HomePage from './pages/HomePage';
import PwaUpdater from './components/common/PwaUpdater';

import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import ServerError from './pages/ServerError';
import InvitationPage from './pages/InvitationPage';
// import CustomerReservationDetail from './pages/CustomerReservationDetail'; // Removed unified view
import RequireAuth from './components/admin/RequireAuth';
import { Toaster } from 'react-hot-toast';

// Admin Components
import ReservationInbox from './components/admin/ReservationInbox';
import CalendarView from './components/admin/CalendarView';
import DayDetailView from './components/admin/DayDetailView';
import ReservationDetailView from './components/admin/ReservationDetailView';
import ConfigurationPanel from './components/admin/ConfigurationPanel';

function Layout() {
	const location = useLocation();
	const isAdminPath = location.pathname.startsWith('/admin');
	const isBookingPath = location.pathname === '/booking';
	const isHomePage = location.pathname === '/';
	const isInvitationPath = location.pathname.startsWith('/invitacion');

	useEffect(() => {
		if (location.hash) {
			const element = document.querySelector(location.hash);
			if (element) {
				element.scrollIntoView({ behavior: 'smooth' });
			}
		} else {
			if (!location.hash) window.scrollTo(0, 0);
		}
	}, [location]);

	return (
		<div className="min-h-screen font-sans bg-cream-bg flex flex-col overflow-x-hidden">
			<Toaster position="top-center" reverseOrder={false} />
			<PwaUpdater />
			{!isAdminPath && !isInvitationPath && <Navbar />}
			<main className="grow">
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/booking" element={<BookingPage />} />
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
					</Route>

					{/* Rutas de prueba para errores (puedes borrarlas luego) */}
					<Route path="/test-404" element={<NotFound />} />
					<Route path="/test-500" element={<ServerError />} />

					<Route path="*" element={<NotFound />} />
				</Routes>
			</main>

			{!isAdminPath && !isBookingPath && !isInvitationPath && <Footer />}
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
			</GlobalErrorBoundary>
		</Router>
	);
}

export default App;
