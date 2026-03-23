import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HeroSection from '../components/home/HeroSection';
import MenusSection from '../components/home/MenusSection';
import WorkshopsSection from '../components/home/WorkshopsSection';
import ServicesSection from '../components/home/ServicesSection';
import FacilitiesSection from '../components/home/FacilitiesSection';
import WorkflowSection from '../components/home/WorkflowSection';
import FAQSection from '../components/home/FAQSection';

function HomePage() {
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const token = localStorage.getItem('token');
		
		// If launching from PWA and logged in, redirect directly to admin for agility
		if (params.get('pwa') === '1' && token) {
			navigate('/admin', { replace: true });
		}
	}, [location, navigate]);

	return (
		<>
			<HeroSection />
			<ServicesSection />
			<FacilitiesSection />
			<WorkshopsSection />
			<WorkflowSection />
			<MenusSection />
			<FAQSection />
		</>
	);
}

export default HomePage;
