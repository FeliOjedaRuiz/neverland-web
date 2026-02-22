import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
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
// Initial static placeholder (will be overwritten by API)
const CHILDREN_MENUS = [
	{ id: 1, name: 'Menú 1', price: 9, main: '', desc: '' },
	{ id: 2, name: 'Menú 2', price: 9, main: '', desc: '' },
	{ id: 3, name: 'Menú 3', price: 10, main: '', desc: '' },
];

const DEFAULT_CONFIG = {
	menusNiños: [],
	plusFinDeSemana: 1.5,
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
	const [createdEventId, setCreatedEventId] = useState(null);

	// Calendar State
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [monthlyOccupied, setMonthlyOccupied] = useState([]);
	const [view, setView] = useState('calendar'); // 'calendar' | 'dayDetails'
	const [availabilityError, setAvailabilityError] = useState(false);
	const [availabilityLoading, setAvailabilityLoading] = useState(false);

	const [formData, setFormData] = useState({
		fecha: '',
		turno: '',
		cliente: {
			nombreNiño: '',
			edadNiño: '',
			nombrePadre: '',
			telefono: '',
			email: '',
		},
		niños: {
			cantidad: 12, // Min 12
			menuId: 1,
		},
		adultos: {
			cantidad: 0,
			comida: [], // Unified: [{item, cantidad, precioUnitario}]
		},
		extras: {
			taller: 'ninguno',
			personaje: 'ninguno',
			pinata: false,
			extension: 0, // 0, 30, 60
			extensionType: 'default', // For Turn 2: 'before', 'after', 'both'
		},
	});

	// Helper for character search
	const [charSearch, setCharSearch] = useState('');

	const scrollContainerRef = useRef(null);

	// Scroll to top when step or view changes
	useEffect(() => {
		if (scrollContainerRef.current) {
			try {
				scrollContainerRef.current.scrollTo({
					top: 0,
					behavior: 'smooth',
				});
			} catch {
				// Fallback for older browsers
				scrollContainerRef.current.scrollTop = 0;
			}
		}
	}, [step, view]);

	useEffect(() => {
		getConfig()
			.then((res) => {
				if (res.data) setPrices((prev) => ({ ...prev, ...res.data }));
			})
			.catch(() => console.log('Using default config'));
	}, []);

	// Cache for availability: { 'YYYY-M': { occupied: [] } }
	const [availabilityCache, setAvailabilityCache] = useState({});

	// Add preload logic
	const preloadAdjacentMonths = useCallback(
		async (date) => {
			const offsets = [-1, 1];
			offsets.forEach(async (offset) => {
				const targetDate = new Date(date);
				targetDate.setMonth(targetDate.getMonth() + offset);
				const y = targetDate.getFullYear();
				const m = targetDate.getMonth() + 1;
				const key = `${y}-${m}`;

				if (!availabilityCache[key]) {
					try {
						const res = await getMonthlyAvailability(y, m);
						setAvailabilityCache((prev) => ({
							...prev,
							[key]: res.data.occupied || [],
						}));
					} catch (err) {
						console.warn(`Failed to preload ${key}`, err);
					}
				}
			});
		},
		[availabilityCache],
	);

	useEffect(() => {
		const fetchAsyncAvailability = async () => {
			const year = currentMonth.getFullYear();
			const month = currentMonth.getMonth() + 1;
			const key = `${year}-${month}`;

			// Check Cache First
			if (availabilityCache[key]) {
				setMonthlyOccupied(availabilityCache[key]);
				preloadAdjacentMonths(currentMonth); // Trigger preload for next/prev
				return;
			}

			setAvailabilityError(false);
			setAvailabilityLoading(true);
			try {
				const res = await getMonthlyAvailability(year, month);
				const data = res.data.occupied || [];
				setMonthlyOccupied(data);
				// Update Cache
				setAvailabilityCache((prev) => ({ ...prev, [key]: data }));
				// Trigger Preload
				preloadAdjacentMonths(currentMonth);
			} catch (err) {
				console.error(err);
				setAvailabilityError(true);
			} finally {
				setAvailabilityLoading(false);
			}
		};
		fetchAsyncAvailability();
	}, [currentMonth, availabilityCache, preloadAdjacentMonths]); // Cache is read-only inside connection, but we use ref pattern or just rely on state closures provided key is unique.

	// Calculate current children menus with database data
	const childrenMenusWithPrices = (
		prices.menusNiños?.length > 0 ? prices.menusNiños : CHILDREN_MENUS
	).map((menu) => ({
		id: menu.id || menu._id, // Keep the original ID as provided by DB or default
		name: menu.nombre || menu.name,
		price: menu.precio || menu.price,
		main: menu.principal || menu.main,
		desc: menu.resto || menu.desc,
	}));

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
		if (step === 2) {
			const { nombreNiño, edadNiño, nombrePadre, telefono, email } =
				formData.cliente;

			// Strict phone validation: Must have exactly 9 digits after prefix
			let isPhoneValid = false;
			if (telefono) {
				const parts = telefono.split(' ');
				if (parts.length >= 2) {
					const numberPart = parts.slice(1).join('');
					isPhoneValid = numberPart.replace(/\D/g, '').length === 9;
				} else {
					isPhoneValid = telefono.replace(/\D/g, '').length >= 11;
				}
			}

			// Email validation
			const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

			return (
				nombreNiño &&
				edadNiño &&
				parseInt(edadNiño) > 0 &&
				nombrePadre &&
				isPhoneValid &&
				isEmailValid
			);
		}
		if (step === 4) return formData.adultos.cantidad > 0;
		return true;
	};

	// Calculations
	const calculateTotal = () => {
		let total = 0;
		const menu = childrenMenusWithPrices.find(
			(m) => String(m.id) === String(formData.niños.menuId),
		);
		const childPrice = Number(menu ? menu.price : 0) || 0;
		let subTotalNiños = childPrice * (Number(formData.niños.cantidad) || 0);

		// Weekend Plus
		if (formData.fecha) {
			const date = new Date(formData.fecha);
			if (!isNaN(date.getTime())) {
				const day = date.getDay();
				if (day === 0 || day === 5 || day === 6) {
					// Fri, Sat, Sun
					subTotalNiños +=
						(prices.plusFinDeSemana || 1.5) * formData.niños.cantidad;
				}
			}
		}
		total += subTotalNiños;

		// Adults Food
		formData.adultos.comida.forEach((item) => {
			total += (item.precioUnitario || 0) * item.cantidad;
		});

		// Extras: Taller
		if (formData.extras.taller !== 'ninguno') {
			const workshop = prices.workshops?.find(
				(w) => w.name.toLowerCase() === formData.extras.taller.toLowerCase(),
			);
			if (workshop) {
				const tallerPrice =
					formData.niños.cantidad >= 15
						? workshop.pricePlus
						: workshop.priceBase;
				total += tallerPrice;
			} else {
				const tallerPrice =
					formData.niños.cantidad >= 15
						? prices.preciosExtras.tallerPlus || 30
						: prices.preciosExtras.tallerBase || 25;
				total += tallerPrice;
			}
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
		const type = formData.extras.extensionType;

		if (ext === 0) return getTurnoLabel(base);

		if (base === 'T1') {
			if (ext === 30) return '16:30 - 19:00';
			if (ext === 60) return '16:00 - 19:00';
		}

		if (base === 'T2') {
			if (ext === 30) {
				if (type === 'before') return '17:30 - 20:00';
				return '18:00 - 20:30'; // Default is 'after'
			}
			if (ext === 60) {
				if (type === 'before') return '17:00 - 20:00';
				if (type === 'both') return '17:30 - 20:30';
				return '18:00 - 21:00'; // Default is 'after'
			}
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
			const scheduleString = getExtendedTime(); // Ej: "17:30 - 20:30"
			const [startTime, endTime] = scheduleString
				.split(' - ')
				.map((t) => t.trim());

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
						comida: formData.adultos.comida,
					},
					extras: formData.extras,
				},
				horario: {
					inicio: startTime,
					fin: endTime,
					extensionMinutos: formData.extras.extension,
					horaFinalEstimada: scheduleString,
					costoExtension:
						formData.extras.extension === 30
							? prices.preciosExtras.extension30 || 30
							: formData.extras.extension === 60
								? prices.preciosExtras.extension60 || 50
								: 0,
				},
			};

			console.log('Sending:', finalData);
			const response = await createBooking(finalData);
			setCreatedEventId(response.data.publicId);
			setLoading(false);
			nextStep();
		} catch (error) {
			console.error(error);
			setLoading(false);
			alert('Error al reservar. Por favor intenta de nuevo.');
		}
	};

	const stepsList = [
		{ id: 1, icon: Calendar, label: 'Horario' },
		{ id: 2, icon: Users, label: 'Datos' },
		{ id: 3, icon: Utensils, label: 'Menús' },
		{ id: 4, icon: Sparkles, label: 'Extras' },
		{ id: 5, icon: CheckCircle, label: 'Listo' },
	];

	const currentStage = (() => {
		if (step === 1) return 1;
		if (step === 2) return 2;
		if (step === 3 || step === 4) return 3; // Kids & Adults -> Menus
		if (step >= 5 && step <= 7) return 4; // Workshops, Characters, Extras -> Extras
		if (step >= 8) return 5; // Summary & Success -> Ready
		return 1;
	})();

	return (
		<div className="pt-16 sm:pt-20 pb-0 flex flex-col bg-surface sm:bg-cream-bg overflow-hidden nav-no-touch-callout min-h-screen h-dvh">
			{' '}
			{/* Header */}
			<BookingHeader stage={currentStage} stepsList={stepsList} />
			{/* Main Content */}
			<div className="flex-1 px-0 sm:px-4 pb-0 min-h-0 relative flex flex-col">
				<div className="bg-surface sm:rounded-3xl sm:shadow-soft h-full flex flex-col relative overflow-hidden sm:border-t sm:border-x sm:border-white/50">
					<div
						ref={scrollContainerRef}
						className={`flex-1 ${step === 1 && view === 'calendar' ? 'overflow-hidden pt-0 pb-24' : 'overflow-y-auto overflow-x-hidden pb-32 pt-4'} px-4 sm:p-6 no-scrollbar`}
					>
						<AnimatePresence mode="wait">
							<motion.div
								key={`${step}-${view}`}
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
										availabilityLoading={availabilityLoading}
										availabilityCache={availabilityCache}
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
										CHILDREN_MENUS={childrenMenusWithPrices}
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
										prices={prices}
									/>
								)}
								{step === 8 && (
									<Step8Summary
										formData={formData}
										prices={prices}
										calculateTotal={calculateTotal}
										getExtendedTime={getExtendedTime}
										childrenMenusWithPrices={childrenMenusWithPrices}
										workshops={prices.workshops}
									/>
								)}
								{step === 9 && (
									<BookingSuccess
										formData={formData}
										createdId={createdEventId}
										getExtendedTime={getExtendedTime}
									/>
								)}
							</motion.div>
						</AnimatePresence>
					</div>

					{/* Fixed Navigation Footer */}
					<div className="fixed bottom-0 left-0 right-0 z-50 bg-surface sm:absolute sm:bottom-0 sm:left-0 sm:right-0">
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
		</div>
	);
};

export default BookingPage;
