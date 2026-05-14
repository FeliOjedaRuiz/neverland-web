import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Send, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { inscribirATaller } from '../../services/api';

const PREFIXES = [
	{ code: '+34', flag: '🇪🇸' },
	{ code: '+1',  flag: '🇺🇸' },
	{ code: '+44', flag: '🇬🇧' },
	{ code: '+33', flag: '🇫🇷' },
	{ code: '+49', flag: '🇩🇪' },
	{ code: '+39', flag: '🇮🇹' },
	{ code: '+351',flag: '🇵🇹' },
	{ code: '+41', flag: '🇨🇭' },
];

const getDefaultPhone = (fullPhone) => {
	if (!fullPhone) return { prefix: '+34', phone: '' };
	const found = PREFIXES.find((p) => fullPhone.startsWith(p.code));
	if (found) {
		return { prefix: found.code, phone: fullPhone.slice(found.code.length).trim() };
	}
	// Si empieza con +, extraer el prefijo manualmente
	const match = fullPhone.match(/^(\+\d{1,4})\s?(.*)$/);
	if (match) {
		return { prefix: match[1], phone: match[2].trim() };
	}
	return { prefix: '+34', phone: fullPhone };
};

const InscripcionForm = ({ taller, onSuccess, plain = false }) => {
	const [form, setForm] = useState({
		nombreNiño: '',
		edadNiño: '',
		nombreResponsable: '',
		telefono: getDefaultPhone(''),
		emailResponsable: '',
		privacyPolicyConsent: false,
		marketingConsent: false,
	});
	const [errors, setErrors] = useState({});
	const [saving, setSaving] = useState(false);
	const [submitError, setSubmitError] = useState('');
	const [showPrefixes, setShowPrefixes] = useState(false);
	const prefixRef = useRef(null);

	useEffect(() => {
		if (!showPrefixes) return;
		const handler = (e) => {
			if (prefixRef.current && !prefixRef.current.contains(e.target)) {
				setShowPrefixes(false);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [showPrefixes]);

	const handleChange = (field, value) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => ({ ...prev, [field]: '' }));
		setSubmitError('');
	};

	const handlePrefixChange = (newPrefix) => {
		setForm((prev) => ({
			...prev,
			telefono: { ...prev.telefono, prefix: newPrefix },
		}));
		setErrors((prev) => ({ ...prev, telefono: '' }));
		setShowPrefixes(false);
	};

	const handlePhoneChange = (newPhone) => {
		// Solo dígitos y espacios
		if (!/^[\d\s]*$/.test(newPhone)) return;
		if (newPhone.replace(/\s/g, '').length > 15) return;
		setForm((prev) => ({
			...prev,
			telefono: { ...prev.telefono, phone: newPhone },
		}));
		setErrors((prev) => ({ ...prev, telefono: '' }));
	};

	const getFullPhone = () => {
		const { prefix, phone } = form.telefono;
		return `${prefix} ${phone}`.trim();
	};

	const validate = () => {
		const newErrors = {};
		const { prefix, phone } = form.telefono;

		if (!form.nombreNiño.trim()) {
			newErrors.nombreNiño = 'El nombre del niño es obligatorio';
		} else if (form.nombreNiño.trim().length > 100) {
			newErrors.nombreNiño = 'Máximo 100 caracteres';
		}

		if (form.edadNiño) {
			const edad = parseInt(form.edadNiño);
			if (isNaN(edad) || edad < 1 || edad > 99) {
				newErrors.edadNiño = 'Edad inválida (1-99)';
			}
		}

		if (!form.nombreResponsable.trim()) {
			newErrors.nombreResponsable = 'El nombre del responsable es obligatorio';
		} else if (form.nombreResponsable.trim().length > 100) {
			newErrors.nombreResponsable = 'Máximo 100 caracteres';
		}

		// Validación de teléfono con prefijo (misma lógica que booking)
		const localNumber = phone.replace(/\s/g, '');
		if (!localNumber) {
			newErrors.telefono = 'El teléfono es obligatorio';
		} else if (prefix === '+34') {
			if (localNumber.length < 9) newErrors.telefono = 'Mínimo 9 dígitos';
			if (localNumber.length > 9) newErrors.telefono = 'Máximo 9 dígitos';
		} else {
			if (localNumber.length < 8) newErrors.telefono = 'Número demasiado corto';
			if (localNumber.length > 15) newErrors.telefono = 'Número demasiado largo';
		}

		const email = form.emailResponsable.trim();
		if (!email) {
			newErrors.emailResponsable = 'El email es obligatorio';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) {
			newErrors.emailResponsable = 'Email inválido';
		}

		if (!form.privacyPolicyConsent) {
			newErrors.privacyPolicyConsent = 'Debes aceptar la política de privacidad';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSubmitError('');

		if (!validate()) {
			try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) { window.scrollTo(0, 0); }
			toast.error('Corrige los errores del formulario');
			return;
		}

		setSaving(true);
		try {
			const payload = {
				nombreNiño: form.nombreNiño.trim(),
				edadNiño: form.edadNiño ? parseInt(form.edadNiño) : undefined,
				nombreResponsable: form.nombreResponsable.trim(),
				telefonoResponsable: getFullPhone(),
				emailResponsable: form.emailResponsable.trim(),
				privacyPolicyConsent: form.privacyPolicyConsent,
				marketingConsent: form.marketingConsent,
			};

			await inscribirATaller(taller.id || taller._id, payload);
			toast.success('¡Inscripción realizada con éxito!');

			if (onSuccess) {
				onSuccess({ inscripcionData: payload, taller });
			}
		} catch (err) {
			console.error('Error al inscribir:', err);
			const msg = err.response?.data?.error || err.response?.data?.message || 'Error al procesar la inscripción';
			setSubmitError(msg);
			toast.error(msg);
		} finally {
			setSaving(false);
		}
	};

	const inputBase =
		'w-full bg-white px-4 py-2.5 rounded-xl border text-sm font-bold text-text-black outline-none transition-all duration-200 min-text-[16px]';
	const inputNormal = `${inputBase} border-gray-200 hover:border-gray-300 focus:border-neverland-green focus:ring-2 focus:ring-neverland-green/10 placeholder:text-gray-300`;
	const inputError = `${inputBase} border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-400/10`;

	const wrapperClass = plain
		? ''
		: 'bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-sm';

	return (
		<div className={wrapperClass}>
			<form onSubmit={handleSubmit} className="space-y-4">
				{!plain && (
					<h3 className="text-lg font-display font-black text-text-black">
						Inscribir niño
					</h3>
				)}

				{submitError && (
					<div className="flex items-start gap-2.5 p-3 bg-red-50 rounded-xl border border-red-200">
						<AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
						<p className="text-[13px] text-red-600 font-bold">{submitError}</p>
					</div>
				)}

				{/* ── Nombre + Edad ── */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label className="text-[11px] font-bold text-gray-500 block mb-1">
							Nombre del niño <span className="text-red-400">*</span>
						</label>
						<input
							type="text" value={form.nombreNiño}
							onChange={(e) => handleChange('nombreNiño', e.target.value)}
							placeholder="Ej: Pepito" inputMode="text"
							className={errors.nombreNiño ? inputError : inputNormal}
						/>
						{errors.nombreNiño && <p className="text-[10px] text-red-500 font-bold mt-0.5 ml-1">{errors.nombreNiño}</p>}
					</div>
					<div>
						<label className="text-[11px] font-bold text-gray-500 block mb-1">Edad</label>
						<input
							type="number" min="1" max="99" value={form.edadNiño}
							onChange={(e) => handleChange('edadNiño', e.target.value)}
							placeholder="Ej: 6" inputMode="numeric"
							className={errors.edadNiño ? inputError : inputNormal}
						/>
						{errors.edadNiño && <p className="text-[10px] text-red-500 font-bold mt-0.5 ml-1">{errors.edadNiño}</p>}
					</div>
				</div>

				{/* ── Nombre responsable ── */}
				<div>
					<label className="text-[11px] font-bold text-gray-500 block mb-1">
						Nombre del responsable <span className="text-red-400">*</span>
					</label>
					<input
						type="text" value={form.nombreResponsable}
						onChange={(e) => handleChange('nombreResponsable', e.target.value)}
						placeholder="Ej: María García" inputMode="text"
						className={errors.nombreResponsable ? inputError : inputNormal}
					/>
					{errors.nombreResponsable && <p className="text-[10px] text-red-500 font-bold mt-0.5 ml-1">{errors.nombreResponsable}</p>}
				</div>

				{/* ── Teléfono (con prefijo) + Email ── */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label className="text-[11px] font-bold text-gray-500 block mb-1">
							Teléfono <span className="text-red-400">*</span>
						</label>
						<div className="flex gap-1.5">
							{/* Selector de prefijo */}
							<div className="relative shrink-0" ref={prefixRef}>
								<button
									type="button"
									onClick={() => setShowPrefixes(!showPrefixes)}
									className={`h-full px-2.5 rounded-xl border text-sm font-bold transition-all duration-200 min-text-[16px] flex items-center gap-1 ${
										errors.telefono
											? 'border-red-300 bg-red-50/30'
											: 'border-gray-200 hover:border-gray-300 bg-white'
									}`}
								>
									<span className="text-xs">{PREFIXES.find(p => p.code === form.telefono.prefix)?.flag || '🌐'}</span>
									<span className="text-gray-700">{form.telefono.prefix}</span>
									<svg className="w-2.5 h-2.5 text-gray-400" viewBox="0 0 10 6"><path d="M0 0l5 6 5-6z" fill="currentColor"/></svg>
								</button>

								{showPrefixes && (
									<div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 w-32">
										{PREFIXES.map((p) => (
											<button
												key={p.code}
												type="button"
												onClick={() => handlePrefixChange(p.code)}
												className={`w-full px-3 py-2 text-left text-sm font-bold hover:bg-gray-50 flex items-center gap-2 ${
													form.telefono.prefix === p.code ? 'text-neverland-green bg-neverland-green/5' : 'text-gray-700'
												}`}
											>
												<span>{p.flag}</span>
												<span>{p.code}</span>
											</button>
										))}
									</div>
								)}
							</div>

							{/* Input del número local */}
							<input
								type="tel"
								value={form.telefono.phone}
								onChange={(e) => handlePhoneChange(e.target.value)}
								placeholder="600 000 000"
								inputMode="tel"
								className={`flex-1 ${errors.telefono ? inputError : inputNormal}`}
							/>
						</div>
						{errors.telefono && <p className="text-[10px] text-red-500 font-bold mt-0.5 ml-1">{errors.telefono}</p>}
					</div>

					<div>
						<label className="text-[11px] font-bold text-gray-500 block mb-1">
							Email <span className="text-red-400">*</span>
						</label>
						<input
							type="email" value={form.emailResponsable}
							onChange={(e) => handleChange('emailResponsable', e.target.value)}
							placeholder="Ej: maria@email.com" inputMode="email"
							className={errors.emailResponsable ? inputError : inputNormal}
						/>
						{errors.emailResponsable && <p className="text-[10px] text-red-500 font-bold mt-0.5 ml-1">{errors.emailResponsable}</p>}
					</div>
				</div>

				{/* ── Checkboxes ── */}
				<div className="space-y-2">
					<label className="flex items-start gap-3 cursor-pointer group">
						<input
							type="checkbox" checked={form.privacyPolicyConsent}
							onChange={(e) => handleChange('privacyPolicyConsent', e.target.checked)}
							className="mt-0.5 w-4 h-4 rounded border-gray-300 text-neverland-green focus:ring-neverland-green/20"
							style={{ minWidth: '16px', minHeight: '16px' }}
						/>
						<div className="flex-1">
							<span className="text-xs font-bold text-gray-600 group-hover:text-text-black transition-colors">
								Acepto la{' '}
								<a href="/politica-privacidad" target="_blank" rel="noopener noreferrer"
								   className="text-neverland-green underline hover:no-underline"
								   onClick={(e) => e.stopPropagation()}>
									política de privacidad
								</a>{' '}
								<span className="text-red-400">*</span>
							</span>
							{errors.privacyPolicyConsent && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.privacyPolicyConsent}</p>}
						</div>
					</label>

					<label className="flex items-start gap-3 cursor-pointer group">
						<input
							type="checkbox" checked={form.marketingConsent}
							onChange={(e) => handleChange('marketingConsent', e.target.checked)}
							className="mt-0.5 w-4 h-4 rounded border-gray-300 text-neverland-green focus:ring-neverland-green/20"
							style={{ minWidth: '16px', minHeight: '16px' }}
						/>
						<span className="text-xs font-bold text-gray-400 group-hover:text-gray-500 transition-colors">
							Acepto recibir comunicaciones comerciales sobre novedades y eventos (opcional)
						</span>
					</label>
				</div>

				{/* ── Botón ── */}
				<button
					type="submit" disabled={saving}
					className="w-full flex items-center justify-center gap-2 py-3 bg-neverland-green text-white rounded-xl font-display font-black text-sm uppercase tracking-wider shadow-lg shadow-neverland-green/20 hover:shadow-xl hover:shadow-neverland-green/25 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
				>
					{saving ? (
						<><Loader2 size={18} className="animate-spin" />Inscribiendo...</>
					) : (
						<><Send size={18} />Inscribir niño</>
					)}
				</button>
			</form>
		</div>
	);
};

export default InscripcionForm;
