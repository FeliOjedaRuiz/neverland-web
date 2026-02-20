import {
	BrowserRouter as Router,
	Routes,
	Route,
	useLocation,
} from 'react-router-dom';
import React, { useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import MinimalFooter from './components/layout/MinimalFooter';
import WhatsAppButton from './components/common/WhatsAppButton';
import HomePage from './pages/HomePage';

import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ErrorPage from './pages/ErrorPage';
import RequireAuth from './components/admin/RequireAuth';
import { Toaster } from 'react-hot-toast';

function Layout() {
	const location = useLocation();
	const isAdminPath = location.pathname.startsWith('/admin');
	const isBookingPath = location.pathname === '/booking';
	const isHomePage = location.pathname === '/';

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
			{!isAdminPath && <Navbar />}
			<main className="grow">
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/booking" element={<BookingPage />} />
					<Route path="/admin/login" element={<LoginPage />} />
					<Route
						path="/admin/dashboard"
						element={
							<RequireAuth>
								<AdminDashboard />
							</RequireAuth>
						}
					/>

					{/* Rutas de prueba para errores (puedes borrarlas luego) */}
					<Route path="/test-404" element={<ErrorPage code={404} />} />
					<Route path="/test-500" element={<ErrorPage code={500} />} />

					<Route path="*" element={<ErrorPage code={404} />} />
				</Routes>
			</main>

			{!isAdminPath && !isBookingPath && <Footer />}
			{/* {isBookingPath && <MinimalFooter />} */}
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
			return <ErrorPage code={500} />;
		}
		return this.props.children;
	}
}

function App() {
	return (
		<GlobalErrorBoundary>
			<Router>
				<Layout />
			</Router>
		</GlobalErrorBoundary>
	);
}

export default App;
