import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SEO from '../components/common/SEO';
import HeroSection from '../components/home/HeroSection';
import MenusSection from '../components/home/MenusSection';
import WorkshopsSection from '../components/home/WorkshopsSection';
import TalleresSection from '../components/home/TalleresSection';
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
			<SEO 
				title="Inicio" 
				schema={{
					"@context": "https://schema.org",
					"@type": "LocalBusiness",
					"name": "Neverland",
					"url": "https://neverlandcullarvega.es",
					"image": "https://neverlandcullarvega.es/neverland_og.png",
					"description": "El mejor parque infantil y centro de celebraciones en Cúllar Vega (Granada).",
					"address": {
						"@type": "PostalAddress",
						"streetAddress": "C/ Las Palmeras", 
						"addressLocality": "Cúllar Vega",
						"addressRegion": "Granada",
						"postalCode": "18195",
						"addressCountry": "ES"
					}
				}}
			/>
			<HeroSection />
			<ServicesSection />
			<MenusSection />
			<FacilitiesSection />
			<TalleresSection />
			<WorkshopsSection />
			<WorkflowSection />
			<FAQSection />
		</>
	);
}

export default HomePage;
