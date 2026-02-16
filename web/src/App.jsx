import {
	BrowserRouter as Router,
	Routes,
	Route,
	useLocation,
} from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import MinimalFooter from './components/layout/MinimalFooter';
import WhatsAppButton from './components/common/WhatsAppButton';
import HomePage from './pages/HomePage';

import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
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
				</Routes>
			</main>

			{!isAdminPath && !isBookingPath && <Footer />}
			{/* {isBookingPath && <MinimalFooter />} */}
			{isHomePage && <WhatsAppButton />}
		</div>
	);
}

function App() {
	return (
		<Router>
			<Layout />
		</Router>
	);
}

export default App;
