import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
console.log('Framer Motion ready:', !!motion);
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
import {
	calculateBookingTotal,
	validateBookingStep,
} from '../utils/bookingUtils';

// --- Constants & Data ---

const CHILDREN_MENUS = [
	{ id: 1, nombre: 'Menú 1', precio: 9, principal: '', resto: '' },
	{ id: 2, nombre: 'Menú 2', precio: 9, principal: '', resto: '' },
	{ id: 3, nombre: 'Menú 3', precio: 10, principal: '', resto: '' },
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

const BookingPage = () => {
	const [step, setStep] = useState(1);
	const [prices, setPrices] = useState(DEFAULT_CONFIG);
	const [loading, setLoading] = useState(false);
	const [createdEventId, setCreatedEventId] = useState(null);

	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [monthlyOccupied, setMonthlyOccupied] = useState([]);
	const [view, setView] = useState('calendar');
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
			cantidad: 12,
			menuId: 1,
		},
		adultos: {
			cantidad: 0,
			comida: [],
		},
		extras: {
			taller: 'ninguno',
			personaje: 'ninguno',
			pinata: false,
			observaciones: '',
			extension: 0,
			extensionType: 'default',
		},
	});

	const [charSearch, setCharSearch] = useState('');
	const scrollContainerRef = useRef(null);

	useEffect(() => {
		if (scrollContainerRef.current) {
			try {
				scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
			} catch {
				scrollContainerRef.current.scrollTop = 0;
			}
		}
	}, [step, view]);

	useEffect(() => {
		getConfig()
			.then((res) => {
				if (res.data) {
					const data = res.data;
					// Normalización simplificada
					const normalizeList = (list) =>
						(list || []).map((item) => ({
							...item,
							id: String(item.id || item._id || ''),
						}));

					if (data.menusNiños) data.menusNiños = normalizeList(data.menusNiños);
					if (data.workshops) data.workshops = normalizeList(data.workshops);
					if (data.preciosAdultos)
						data.preciosAdultos = normalizeList(data.preciosAdultos);

					setPrices((prev) => ({ ...prev, ...data }));

					if (data.menusNiños?.length > 0) {
						const firstId = data.menusNiños[0].id;
						setFormData((prev) => ({
							...prev,
							niños: {
								...prev.niños,
								menuId: prev.niños.menuId === 1 ? firstId : prev.niños.menuId,
							},
						}));
					}
				}
			})
			.catch((err) => console.log('Error loading config:', err));
	}, []);

	const [availabilityCache, setAvailabilityCache] = useState({});

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

			if (availabilityCache[key]) {
				setMonthlyOccupied(availabilityCache[key]);
				preloadAdjacentMonths(currentMonth);
				return;
			}

			setAvailabilityLoading(true);
			setAvailabilityError(false);
			try {
				const res = await getMonthlyAvailability(year, month);
				const occupied = res.data.occupied || [];
				setMonthlyOccupied(occupied);
				setAvailabilityCache((prev) => ({ ...prev, [key]: occupied }));
				preloadAdjacentMonths(currentMonth);
			} catch (err) {
				console.error(err);
				setAvailabilityError(true);
			} finally {
				setAvailabilityLoading(false);
			}
		};
		fetchAsyncAvailability();
	}, [currentMonth, availabilityCache, preloadAdjacentMonths]);

	const childrenMenusWithPrices =
		(prices.menusNiños?.length > 0 ? prices.menusNiños : CHILDREN_MENUS)?.map(
			(menu) => ({
				...menu,
				id: menu.id || menu._id,
				name: menu.nombre || 'Menú',
				price: menu.precio || 0,
			}),
		) || [];

	const nextStep = () => setStep((s) => s + 1);
	const prevStep = () => setStep((s) => s - 1);

	const handleBack = () => {
		if (step === 1 && view === 'dayDetails') {
			setView('calendar');
		} else {
			prevStep();
		}
	};

	const validateStep = () => validateBookingStep(step, formData);

	const calculateTotal = () =>
		calculateBookingTotal(formData, prices, childrenMenusWithPrices);

	const getTurnoLabel = (t) => {
		const labels = {
			T1: '17:00 - 19:00',
			T2: '18:00 - 20:00',
			T3: '19:15 - 21:15',
		};
		return labels[t] || '';
	};

	const getExtendedTime = () => {
		const base = formData.turno;
		const ext = formData.extras.extension;
		const type = formData.extras.extensionType;
		if (ext === 0) return getTurnoLabel(base);
		if (base === 'T1') return ext === 30 ? '16:30 - 19:00' : '16:00 - 19:00';
		if (base === 'T2') {
			if (ext === 30)
				return type === 'before' ? '17:30 - 20:00' : '18:00 - 20:30';
			if (type === 'before') return '17:00 - 20:00';
			if (type === 'both') return '17:30 - 20:30';
			return '18:00 - 21:00';
		}
		if (base === 'T3') return ext === 30 ? '19:15 - 21:45' : '19:15 - 22:15';
		return getTurnoLabel(base);
	};

	const handleSubmit = async () => {
		setLoading(true);
		try {
			const scheduleString = getExtendedTime();
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
			const response = await createBooking(finalData);
			setCreatedEventId(response.data.publicId);
			setLoading(false);
			nextStep();
		} catch (error) {
			console.error(error);
			setLoading(false);
			const errorMsg =
				error.response?.data?.message ||
				'Error al reservar. Por favor intenta de nuevo.';
			alert(errorMsg);
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
		if (step === 3 || step === 4) return 3;
		if (step >= 5 && step <= 7) return 4;
		if (step >= 8) return 5;
		return 1;
	})();

	return (
		<div className="pt-16 sm:pt-20 pb-0 flex flex-col bg-surface sm:bg-cream-bg overflow-hidden fixed inset-0 w-full">
			<BookingHeader stage={currentStage} stepsList={stepsList} />
			<div className="flex-1 px-0 sm:px-4 pb-0 min-h-0 relative flex flex-col">
				<div className="bg-surface sm:rounded-3xl sm:shadow-soft h-full flex flex-col relative overflow-hidden sm:border-t sm:border-x sm:border-white/50">
					<div
						ref={scrollContainerRef}
						className={`flex-1 min-h-0 relative ${step === 1 && view === 'calendar' ? 'overflow-hidden pt-0 pb-2' : 'overflow-y-auto overflow-x-hidden pb-8 pt-4'} px-4 sm:p-6 no-scrollbar`}
					>
						<AnimatePresence mode="wait">
							<motion.div
								key={`${step}-${view}`}
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.3 }}
								className="flex flex-col min-h-full"
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
					<div className="z-50 shrink-0 pb-[env(safe-area-inset-bottom)] bg-white sm:rounded-b-3xl w-full">
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
