import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Calendar,
	Users,
	Utensils,
	Sparkles,
	CheckCircle,
	Clock,
} from 'lucide-react';
import {
	createBooking,
	getConfig,
	getMonthlyAvailability,
} from '../services/api';

// Components
import BookingHeader from '../components/booking/BookingHeader';
import BookingNavigation from '../components/booking/BookingNavigation';
import Step1Date from '../components/booking/Step1Date';
import Step2Responsible from '../components/booking/Step2Responsible';
import Step3Kids from '../components/booking/Step3Kids';
import Step4Adults from '../components/booking/Step4Adults';
import Step5Workshops from '../components/booking/Step5Workshops';
import Step6Characters from '../components/booking/Step6Characters';
import Step7Extras from '../components/booking/Step7Extras';
import Step8Summary from '../components/booking/Step8Summary';
import BookingSuccess from '../components/booking/BookingSuccess';

// --- Constants & Data ---

// Constants (Static data for UI structure, Prices/Options loaded from API)
const CHILDREN_MENUS = [
	{
		id: 1,
		name: 'Menú Clásico',
		price: 9, // Default/Fallback
		main: '2 ½ Sándwiches (Dulces/Salados)',
		desc: 'Ideal para amantes de lo tradicional.',
	},
	{
		id: 2,
		name: 'Menú Hot Dog',
		price: 9,
		main: 'Perrito Caliente',
		desc: 'Un favorito que nunca falla.',
	},
	{
		id: 3,
		name: 'Menú Pizza',
		price: 10,
		main: 'Porción de Pizza (Jamón y Queso)',
		desc: 'La opción más popular.',
	},
	{
		id: 4,
		name: 'Menú Premium',
		price: 12,
		main: 'Hamburguesa con Queso',
		desc: 'Para los más exigentes.',
	},
];

const DEFAULT_CONFIG = {
	preciosNiños: { 1: 9, 2: 9, 3: 10, 4: 12, plusFinDeSemana: 1.5 },
	preciosAdultos: [],
	workshops: [],
	characters: [],
	preciosExtras: {
		tallerBase: 25,
		tallerPlus: 30,
		personaje: 40,
		pinata: 15,
		extension30: 30,
		extension60: 50,
	},
};

// --- Component ---

const BookingPage = () => {
	// Steps:
	// 1: Calendar/Time, 2: Responsibility Data, 3: Kids Data, 4: Adults Data,
	// 5: Workshops, 6: Characters, 7: Extras (Time/Pinata), 8: Summary
	const [step, setStep] = useState(1);
	const [prices, setPrices] = useState(DEFAULT_CONFIG);
	const [loading, setLoading] = useState(false);

	// Calendar State
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [monthlyOccupied, setMonthlyOccupied] = useState([]);
	const [view, setView] = useState('calendar'); // 'calendar' | 'dayDetails'
	const [availabilityError, setAvailabilityError] = useState(false);

	const [formData, setFormData] = useState({
		fecha: '',
		turno: '',
		cliente: {
			nombreNiño: '',
			edadNiño: '',
			nombrePadre: '',
			telefono: '',
		},
		niños: {
			cantidad: 12, // Min 12
			menuId: 1,
		},
		adultos: {
			cantidad: 0,
			comida: {}, // { 'salaillas': 2, 'tortilla': 1 }
		},
		extras: {
			taller: 'ninguno',
			personaje: 'ninguno',
			pinata: false,
			extension: 0, // 0, 30, 60
		},
	});

	// Helper for character search
	const [charSearch, setCharSearch] = useState('');

	useEffect(() => {
		getConfig()
			.then((res) => {
				if (res.data) setPrices((prev) => ({ ...prev, ...res.data }));
			})
			.catch(() => console.log('Using default config'));
	}, []);

	useEffect(() => {
		setAvailabilityError(false);
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth() + 1;
		getMonthlyAvailability(year, month)
			.then((res) => setMonthlyOccupied(res.data?.occupied || []))
			.catch((err) => {
				console.error(err);
				setAvailabilityError(true);
			});
	}, [currentMonth]);

	const nextStep = () => setStep((s) => s + 1);
	const prevStep = () => setStep((s) => s - 1);

	const handleBack = () => {
		if (step === 1 && view === 'dayDetails') {
			setView('calendar');
		} else {
			prevStep();
		}
	};

	// Validations
	const validateStep = () => {
		if (step === 1) return formData.fecha && formData.turno;
		if (step === 2)
			return (
				formData.cliente.nombreNiño &&
				formData.cliente.edadNiño &&
				formData.cliente.nombrePadre &&
				formData.cliente.telefono
			);
		return true;
	};

	// Calculations
	const calculateTotal = () => {
		let total = 0;
		const childPrice = prices.preciosNiños[formData.niños.menuId] || 0;
		let subTotalNiños = childPrice * formData.niños.cantidad;

		// Weekend Plus
		if (formData.fecha) {
			const date = new Date(formData.fecha);
			if (!isNaN(date.getTime())) {
				const day = date.getDay();
				if (day === 0 || day === 5 || day === 6) {
					// Fri, Sat, Sun
					subTotalNiños +=
						(prices.preciosNiños.plusFinDeSemana || 1.5) *
						formData.niños.cantidad;
				}
			}
		}
		total += subTotalNiños;

		// Adults Food
		Object.entries(formData.adultos.comida).forEach(([id, qty]) => {
			const item = prices.preciosAdultos.find((opt) => opt.id === id);
			if (item) total += item.precio * qty;
		});

		// Extras: Taller
		if (formData.extras.taller !== 'ninguno') {
			const tallerPrice =
				formData.niños.cantidad > 25
					? prices.preciosExtras.tallerPlus || 30
					: prices.preciosExtras.tallerBase || 25;
			total += tallerPrice;
		}

		// Extras: Personaje
		if (formData.extras.personaje !== 'ninguno') {
			total += prices.preciosExtras.personaje || 40;
		}

		// Extras: Pinata
		if (formData.extras.pinata) {
			total += prices.preciosExtras.pinata || 15;
		}

		// Extras: Extension
		if (formData.extras.extension === 30)
			total += prices.preciosExtras.extension30 || 30;
		if (formData.extras.extension === 60)
			total += prices.preciosExtras.extension60 || 50;

		return total;
	};

	const getTurnoLabel = (t) => {
		if (t === 'T1') return '17:00 - 19:00';
		if (t === 'T2') return '18:00 - 20:00';
		if (t === 'T3') return '19:15 - 21:15';
		return '';
	};

	const getExtendedTime = () => {
		const base = formData.turno;
		const ext = formData.extras.extension;
		if (ext === 0) return getTurnoLabel(base);

		// Logic based on rules
		if (base === 'T1') {
			if (ext === 30) return '16:30 - 19:00';
			if (ext === 60) return '16:00 - 19:00';
		}
		if (base === 'T2') {
			// T2 flexible, assume extension extends end for display simply, or explain interaction
			if (ext === 30) return '18:00 - 20:30 (o antes)';
			if (ext === 60) return '17:30 - 20:30 (Ejemplo)';
		}
		if (base === 'T3') {
			if (ext === 30) return '19:15 - 21:45';
			if (ext === 60) return '19:15 - 22:15';
		}
		return getTurnoLabel(base);
	};

	const handleSubmit = async () => {
		setLoading(true);
		try {
			const finalData = {
				tipo: 'reserva',
				fecha: formData.fecha,
				turno: formData.turno,
				cliente: formData.cliente,
				precioTotal: calculateTotal(),
				detalles: {
					niños: formData.niños,
					adultos: {
						cantidad: formData.adultos.cantidad,
						comida: Object.entries(formData.adultos.comida).map(([k, v]) => ({
							item: k,
							cantidad: v,
						})),
					},
					extras: formData.extras,
				},
				horario: {
					extensionMinutos: formData.extras.extension,
					horaFinalEstimada: getExtendedTime(),
					costoExtension:
						formData.extras.extension === 30
							? prices.preciosExtras.extension30 || 30
							: formData.extras.extension === 60
								? prices.preciosExtras.extension60 || 50
								: 0,
				},
			};

			console.log('Sending:', finalData);
			await createBooking(finalData);
			setLoading(false);
			nextStep();
		} catch (error) {
			console.error(error);
			setLoading(false);
			alert('Error al reservar. Por favor intenta de nuevo.');
		}
	};

	const stepsList = [
		{ id: 1, icon: Calendar },
		{ id: 2, icon: Users },
		{ id: 3, icon: Utensils }, // Kids
		{ id: 4, icon: Utensils }, // Adults
		{ id: 5, icon: Sparkles }, // Taller
		{ id: 6, icon: Users }, // Personajes
		{ id: 7, icon: Clock }, // Extras
		{ id: 8, icon: CheckCircle },
	];

	return (
		<div className="pt-16 sm:pt-20 pb-0 h-[100dvh] flex flex-col bg-surface sm:bg-cream-bg overflow-hidden nav-no-touch-callout">
			{/* Header */}
			<BookingHeader step={step} stepsList={stepsList} />

			{/* Main Content */}
			<div className="flex-1 px-0 sm:px-4 pb-0 min-h-0 relative flex flex-col">
				<div className="bg-surface sm:rounded-3xl sm:shadow-soft h-full flex flex-col relative overflow-hidden sm:border-t sm:border-x sm:border-white/50">
					<div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 pb-24 sm:pb-6 no-scrollbar">
						<AnimatePresence mode="popLayout">
							<motion.div
								key={step + view}
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.3 }}
								className="flex flex-col h-full"
							>
								{step === 1 && (
									<Step1Date
										formData={formData}
										setFormData={setFormData}
										currentMonth={currentMonth}
										setCurrentMonth={setCurrentMonth}
										view={view}
										setView={setView}
										monthlyOccupied={monthlyOccupied}
										availabilityError={availabilityError}
									/>
								)}
								{step === 2 && (
									<Step2Responsible
										formData={formData}
										setFormData={setFormData}
									/>
								)}
								{step === 3 && (
									<Step3Kids
										formData={formData}
										setFormData={setFormData}
										CHILDREN_MENUS={CHILDREN_MENUS}
									/>
								)}
								{step === 4 && (
									<Step4Adults
										formData={formData}
										setFormData={setFormData}
										ADULT_MENU_OPTIONS={prices.preciosAdultos}
									/>
								)}
								{step === 5 && (
									<Step5Workshops
										formData={formData}
										setFormData={setFormData}
										WORKSHOPS={prices.workshops}
									/>
								)}
								{step === 6 && (
									<Step6Characters
										formData={formData}
										setFormData={setFormData}
										CHARACTERS={prices.characters}
										charSearch={charSearch}
										setCharSearch={setCharSearch}
									/>
								)}
								{step === 7 && (
									<Step7Extras
										formData={formData}
										setFormData={setFormData}
										getExtendedTime={getExtendedTime}
									/>
								)}
								{step === 8 && (
									<Step8Summary
										formData={formData}
										prices={prices}
										calculateTotal={calculateTotal}
										getExtendedTime={getExtendedTime}
										CHILDREN_MENUS={CHILDREN_MENUS}
										WORKSHOPS={prices.workshops}
										ADULT_MENU_OPTIONS={prices.preciosAdultos}
									/>
								)}
								{step === 9 && <BookingSuccess formData={formData} />}
							</motion.div>
						</AnimatePresence>
					</div>

					{/* Fixed Navigation Footer */}
					<BookingNavigation
						step={step}
						loading={loading}
						onNext={nextStep}
						onBack={handleBack}
						showBack={step > 1 || (step === 1 && view === 'dayDetails')}
						onSubmit={handleSubmit}
						isValid={validateStep()}
					/>
				</div>
			</div>
		</div>
	);
};

export default BookingPage;
