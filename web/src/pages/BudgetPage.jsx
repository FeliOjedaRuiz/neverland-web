import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
	Utensils,
	Sparkles,
	Calculator,
	Calendar,
	Users,
	CheckCircle,
} from 'lucide-react';
import {
	createBooking,
	getConfig,
	getMonthlyAvailability,
} from '../services/api';
import {
	calculateBookingTotal,
} from '../utils/bookingUtils';
import SEO from '../components/common/SEO';

// Components
import BookingHeader from '../components/booking/BookingHeader';
import BookingNavigation from '../components/booking/BookingNavigation';
import StepInstructions from '../components/booking/StepInstructions';
import Step1Date from '../components/booking/Step1Date';
import Step2Responsible from '../components/booking/Step2Responsible';
import Step3Kids from '../components/booking/Step3Kids';
import Step4Adults from '../components/booking/Step4Adults';
import Step5Workshops from '../components/booking/Step5Workshops';
import Step6Characters from '../components/booking/Step6Characters';
import Step7Extras from '../components/booking/Step7Extras';
import StepBudgetSummary from '../components/booking/StepBudgetSummary';
import BookingSuccess from '../components/booking/BookingSuccess';
import DataProtectionModal from '../components/booking/DataProtectionModal';

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

const BudgetPage = () => {
	const [step, setStep] = useState(1);
	const [prices, setPrices] = useState(DEFAULT_CONFIG);
	const [configStatus, setConfigStatus] = useState('loading'); // 'loading', 'success', 'error'
	const [loading, setLoading] = useState(false);
	const [createdEventId, setCreatedEventId] = useState(null);
	const [showProtectionModal, setShowProtectionModal] = useState(false);

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
			menuId: null,
		},
		adultos: {
			cantidad: 1,
			comida: [],
		},
		extras: {
			taller: null,
			personaje: null,
			pinata: false,
			observaciones: '',
			alergenos: '',
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

	const loadConfig = () => {
		setConfigStatus('loading');
		getConfig()
			.then((res) => {
				if (res.data) {
					const data = res.data;
					// Normalización simplificada
					const normalizeList = (list) =>
						(list || []).map((item) => {
							if (typeof item === 'string') {
								return {
									id: Date.now().toString() + Math.random(),
									nombre: item,
									name: item,
									suspended: false,
									imageUrl: '',
								};
							}
							return {
								...item,
								id: String(item.id || item._id || ''),
							};
						});

					if (data.menusNiños) data.menusNiños = normalizeList(data.menusNiños);
					if (data.workshops) data.workshops = normalizeList(data.workshops);
					if (data.preciosAdultos)
						data.preciosAdultos = normalizeList(data.preciosAdultos);
					if (data.characters)
						data.characters = normalizeList(data.characters);

					setPrices((prev) => ({ ...prev, ...data }));
				}
				setConfigStatus('success');
			})
			.catch((err) => {
				console.log('Error loading config:', err);
				setConfigStatus('error');
			});
	};

	useEffect(() => {
		loadConfig();
	}, []);

	// --- Navigation & Browser Back Button Handling ---
	useEffect(() => {
		// Set initial state if not present
		if (!window.history.state || window.history.state.step === undefined) {
			window.history.replaceState({ step: 1 }, 'Paso 1');
		}

		const handlePopState = (event) => {
			if (event.state && typeof event.state.step === 'number') {
				setStep(event.state.step);
			}
		};

		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	}, []);

	const nextStep = () => {
		const targetStep = step + 1;
		window.history.pushState({ step: targetStep }, `Paso ${targetStep}`);
		setStep(targetStep);
	};

	const prevStep = () => {
		if (step > 1) {
			window.history.back();
		}
	};

	// --- Exit Guard (Prevent accidental data loss) ---
	useEffect(() => {
		const isDirty =
			step > 1 ||
			(formData.niños.menuId !== null) ||
			(formData.extras.taller !== null);

		const handleBeforeUnload = (e) => {
			if (isDirty && !createdEventId) {
				e.preventDefault();
				e.returnValue = '';
				return '';
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [
		step,
		formData.niños.menuId,
		formData.extras.taller,
		createdEventId,
	]);

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
		// Solo cargar disponibilidad cuando llegamos al paso de fecha (step 8)
		if (step !== 8) return;

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
	}, [step, currentMonth, availabilityCache, preloadAdjacentMonths]);

	const childrenMenusWithPrices =
		(prices.menusNiños?.length > 0 ? prices.menusNiños : CHILDREN_MENUS)?.map(
			(menu) => ({
				...menu,
				id: menu.id || menu._id,
				name: menu.nombre || 'Menú',
				price: menu.precio || 0,
			}),
		) || [];

	const handleBack = () => {
		if (step === 8 && view === 'dayDetails') {
			setView('calendar');
		} else {
			prevStep();
		}
	};

	// --- Validación por paso para el flujo de presupuesto ---
	const validateStep = () => {
		// Step 1: Instrucciones - siempre válido
		if (step === 1) return true;

		// Step 2: Menú infantil (Kids)
		if (step === 2) {
			const kids = formData.niños?.cantidad || 0;
			const menuId = formData.niños?.menuId;
			return kids >= 12 && kids <= 50 && !!menuId;
		}

		// Step 3: Adultos
		if (step === 3) {
			const adults = formData.adultos?.cantidad || 0;
			return adults > 0 && adults <= 40;
		}

		// Steps 4-6: Actividades, Personajes, Extras - opcionales
		if (step >= 4 && step <= 6) {
			if (step === 6) {
				const obs = formData.extras?.observaciones || '';
				const alg = formData.extras?.alergenos || '';
				return obs.length <= 500 && alg.length <= 500;
			}
			return true;
		}

		// Step 7: Presupuesto - siempre válido (es lectura)
		if (step === 7) return true;

		// Step 8: Fecha y turno
		if (step === 8) return !!(formData.fecha && formData.turno);

		// Step 9: Datos del responsable
		if (step === 9) {
			const { nombreNiño, edadNiño, nombrePadre, telefono, email } = formData.cliente || {};
			const cleanPhone = (telefono || '').replace(/\s/g, '');
			let isPhoneValid = cleanPhone.length >= 9 && cleanPhone.length <= 16;
			if (cleanPhone.startsWith('+')) {
				const isSpain = cleanPhone.startsWith('+34');
				if (isSpain) {
					isPhoneValid = cleanPhone.length === 12;
				} else {
					isPhoneValid = cleanPhone.length >= 11 && cleanPhone.length <= 20;
				}
			}
			const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') && (email || '').length <= 100;
			const isNameValid = (nombreNiño || '').length > 0 && (nombreNiño || '').length <= 100 && (nombrePadre || '').length > 0 && (nombrePadre || '').length <= 100;

			return !!(
				isNameValid &&
				edadNiño &&
				parseInt(edadNiño) > 0 &&
				parseInt(edadNiño) <= 99 &&
				isPhoneValid &&
				isEmailValid
			);
		}

		return true;
	};

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

	const getValidationMsg = () => {
		if (step === 2) return 'Elige cantidad y menú infantil';
		if (step === 3) return 'Mínimo 1 adulto responsable';
		if (step === 8) return 'Selecciona fecha y turno';
		if (step === 9) return 'Completa todos los datos';
		return '';
	};

	const handlePreSubmit = () => {
		setShowProtectionModal(true);
	};

	const handleSubmit = async (consentData) => {
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
				cliente: {
					...formData.cliente,
					privacyPolicyConsent: consentData.privacyPolicy,
					marketingConsent: consentData.marketing,
					fechaConsentimiento: new Date().toISOString(),
				},
				precioTotal: calculateTotal(),
				detalles: {
					niños: formData.niños,
					adultos: {
						cantidad: formData.adultos.cantidad,
						comida: formData.adultos.comida,
					},
					extras: {
						...formData.extras,
					},
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
			setShowProtectionModal(false);
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

	// --- Header stages for budget flow ---
	const budgetStepsList = [
		{ id: 1, icon: Utensils, label: 'Menús' },
		{ id: 2, icon: Sparkles, label: 'Extras' },
		{ id: 3, icon: Calculator, label: 'Precio' },
	];

	const reservationStepsList = [
		{ id: 1, icon: Calendar, label: 'Fecha' },
		{ id: 2, icon: Users, label: 'Datos' },
		{ id: 3, icon: CheckCircle, label: 'Listo' },
	];

	const isReservePhase = step >= 8;
	const currentStepsList = isReservePhase ? reservationStepsList : budgetStepsList;
	const headerTitle = isReservePhase ? "Completa tu Reserva" : "Calcula tu Presupuesto";

	const currentStage = (() => {
		if (isReservePhase) {
			if (step === 8) return 1; // Fecha
			if (step === 9) return 2; // Datos
			if (step >= 10) return 3; // Success
		} else {
			if (step === 1) return 0; // Instrucciones — antes de la barra
			if (step === 2 || step === 3) return 1; // Menús
			if (step >= 4 && step <= 6) return 2; // Extras
			if (step === 7) return 3; // Presupuesto
		}
		return 0;
	})();

	// Total steps antes del success
	const TOTAL_STEPS = 9;
	const SUCCESS_STEP = 10;

	return (
		<div className="pt-16 sm:pt-20 pb-0 flex flex-col booking-vignette overflow-hidden fixed inset-0 w-full">
			<SEO
				title="Presupuesto para tu Fiesta"
				description="Calcula el presupuesto para tu celebración en Neverland Cúllar Vega. Configura menús, actividades y extras, y consulta el precio sin compromiso."
			/>
			{step !== 1 && (
				<div className="mb-2 sm:mb-4">
					<BookingHeader
						stage={currentStage}
						stepsList={currentStepsList}
						title={headerTitle}
					/>
				</div>
			)}
			<div className="flex-1 px-0 sm:px-4 pb-0 min-h-0 relative flex flex-col">
				<div className="bg-calendar-bg sm:rounded-t-3xl sm:shadow-[0_-8px_40px_-15px_rgba(0,0,0,0.15)] h-full flex flex-col relative overflow-hidden sm:border-t sm:border-x sm:border-white/60 max-w-5xl mx-auto w-full">
					<div
						ref={scrollContainerRef}
						className={`flex-1 min-h-0 relative ${step === 8 && view === 'calendar' ? 'overflow-hidden pt-0 pb-2' : 'overflow-y-auto overflow-x-hidden pb-8 pt-4'} px-4 sm:p-6 ${step === 7 ? '!pb-0' : ''} no-scrollbar`}
					>
						{step === SUCCESS_STEP ? (
							<div className="flex flex-col min-h-full">
								<BookingSuccess
									formData={formData}
									createdId={createdEventId}
									getExtendedTime={getExtendedTime}
								/>
							</div>
						) : configStatus === 'loading' ? (
							<div className="flex flex-col items-center justify-center h-full min-h-[300px]">
								<div className="w-12 h-12 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin mb-4"></div>
								<p className="text-gray-500 font-medium animate-pulse">Cargando experiencia...</p>
							</div>
						) : configStatus === 'error' ? (
							<div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-4">
								<div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
									<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
									</svg>
								</div>
								<h3 className="text-xl font-bold text-gray-800 mb-2">Ups, algo salió mal</h3>
								<p className="text-gray-500 mb-6 max-w-md">
									No hemos podido conectar con la base de datos para cargar las opciones. 
									Por favor, comprueba tu conexión y vuelve a intentarlo.
								</p>
								<button 
									onClick={loadConfig}
									className="px-6 py-3 bg-brand-green text-white font-bold rounded-xl shadow-md hover:bg-brand-green/90 transition-colors"
								>
									Reintentar conexión
								</button>
							</div>
						) : (
							<AnimatePresence mode="wait">
								<motion.div
									key={`${step}-${view}`}
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									transition={{ duration: 0.3 }}
									className="flex flex-col min-h-full"
								>
									{step === 1 && <StepInstructions />}
									{step === 2 && (
										<Step3Kids
											formData={formData}
											setFormData={setFormData}
											CHILDREN_MENUS={childrenMenusWithPrices}
										/>
									)}
									{step === 3 && (
										<Step4Adults
											formData={formData}
											setFormData={setFormData}
											ADULT_MENU_OPTIONS={prices.preciosAdultos}
										/>
									)}
									{step === 4 && (
										<Step5Workshops
											formData={formData}
											setFormData={setFormData}
											WORKSHOPS={prices.workshops}
										/>
									)}
									{step === 5 && (
										<Step6Characters
											formData={formData}
											setFormData={setFormData}
											CHARACTERS={prices.characters}
											charSearch={charSearch}
											setCharSearch={setCharSearch}
											prices={prices}
										/>
									)}
									{step === 6 && (
										<Step7Extras
											formData={formData}
											setFormData={setFormData}
											prices={prices}
										/>
									)}
									{step === 7 && (
										<StepBudgetSummary
											formData={formData}
											prices={prices}
											calculateTotal={calculateTotal}
											childrenMenusWithPrices={childrenMenusWithPrices}
											workshops={prices.workshops}
											onNext={nextStep}
										/>
									)}
									{step === 8 && (
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
									{step === 9 && (
										<Step2Responsible
											formData={formData}
											setFormData={setFormData}
										/>
									)}
								</motion.div>
							</AnimatePresence>
						)}
					</div>
					<div className="z-50 shrink-0 pb-[env(safe-area-inset-bottom)] bg-white sm:rounded-b-3xl w-full">
						{configStatus === 'success' && (
							<BookingNavigation
								step={step}
								loading={loading}
								onNext={nextStep}
								onBack={handleBack}
								showBack={step > 1 || (step === 8 && view === 'dayDetails')}
								onSubmit={handlePreSubmit}
								isValid={validateStep()}
								totalSteps={TOTAL_STEPS}
								submitLabel="Solicitar reserva"
								hideNext={step === 7}
								validationMsg={getValidationMsg()}
							/>
						)}
					</div>
				</div>
			</div>

			<DataProtectionModal
				isOpen={showProtectionModal}
				onClose={() => setShowProtectionModal(false)}
				onAccept={handleSubmit}
				loading={loading}
			/>
		</div>
	);
};

export default BudgetPage;
