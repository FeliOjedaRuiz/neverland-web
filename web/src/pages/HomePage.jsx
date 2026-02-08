import HeroSection from '../components/home/HeroSection';
import MenusSection from '../components/home/MenusSection';
import WorkshopsSection from '../components/home/WorkshopsSection';
import ServicesSection from '../components/home/ServicesSection';
import WorkflowSection from '../components/home/WorkflowSection';
import FAQSection from '../components/home/FAQSection';

function HomePage() {
	return (
		<>
			<HeroSection />
			<ServicesSection />
			<WorkshopsSection />
			<WorkflowSection />
			<MenusSection />
			<FAQSection />
		</>
	);
}

export default HomePage;
