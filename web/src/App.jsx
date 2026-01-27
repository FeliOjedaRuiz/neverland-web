import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import PacksSection from './components/PacksSection';
import MenusSection from './components/MenusSection';
import WorkshopsSection from './components/WorkshopsSection';
import ServicesSection from './components/ServicesSection';
import WorkflowSection from './components/WorkflowSection';
import FAQSection from './components/FAQSection';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';

function App() {
	return (
		<div className="min-h-screen font-sans bg-cream-bg flex flex-col overflow-x-hidden">
			<Navbar />
			<main className="grow">
				{/* Hero already has its own internal animations */}
				<HeroSection />

				{/* Sections order: Services -> Workshops -> Workflow -> Menus -> FAQ -> Packs */}
				<ServicesSection />
				<WorkshopsSection />
				<WorkflowSection />
				<MenusSection />
				<FAQSection />
				<PacksSection />
			</main>
			<Footer />
			<WhatsAppButton />
		</div>
	);
}

export default App;
