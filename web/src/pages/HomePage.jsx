import HeroSection from '../components/home/HeroSection';
import MenusSection from '../components/home/MenusSection';
import WorkshopsSection from '../components/home/WorkshopsSection';
import ServicesSection from '../components/home/ServicesSection';
import FacilitiesSection from '../components/home/FacilitiesSection';
import WorkflowSection from '../components/home/WorkflowSection';
import FAQSection from '../components/home/FAQSection';

function HomePage() {
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
