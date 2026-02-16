import React, { useState } from 'react';
import { Sparkles, Info, Users, CheckCircle, ChevronDown } from 'lucide-react';

const PREFIXES = [
	{ code: '+34', country: 'ES', flag: '🇪🇸' },
	{ code: '+1', country: 'US', flag: '🇺🇸' },
	{ code: '+44', country: 'UK', flag: '🇬🇧' },
	{ code: '+33', country: 'FR', flag: '🇫🇷' },
	{ code: '+49', country: 'DE', flag: '🇩🇪' },
	{ code: '+39', country: 'IT', flag: '🇮🇹' },
	{ code: '+351', country: 'PT', flag: '🇵🇹' },
	{ code: '+41', country: 'CH', flag: '🇨🇭' },
	// Add more if needed
];

const getInitialPhoneData = (fullPhone) => {
	if (!fullPhone) return { prefix: '+34', phone: '' };
	// Try to find matching prefix
	const foundPrefix = PREFIXES.find((p) => fullPhone.startsWith(p.code));
	if (foundPrefix) {
		return {
			prefix: foundPrefix.code,
			phone: fullPhone.slice(foundPrefix.code.length).trim(),
		};
	}
	// Fallback
	return { prefix: '+34', phone: fullPhone };
};

const Step2Responsible = ({ formData, setFormData }) => {
	// Initialize directly from formData to avoid sync useEffect issues
	const [phoneState, setPhoneState] = useState(() =>
		getInitialPhoneData(formData.cliente.telefono),
	);
	const { prefix, phone } = phoneState;

	const handlePhoneChange = (newPhone) => {
		setPhoneState((prev) => ({ ...prev, phone: newPhone }));
		const fullPhone = `${prefix} ${newPhone}`;
		setFormData({
			...formData,
			cliente: { ...formData.cliente, telefono: fullPhone },
		});
	};

	const handlePrefixChange = (newPrefix) => {
		setPhoneState((prev) => ({ ...prev, prefix: newPrefix }));
		const fullPhone = `${newPrefix} ${phone}`;
		setFormData({
			...formData,
			cliente: { ...formData.cliente, telefono: fullPhone },
		});
	};

	// Track touched fields to show errors only after interaction
	const [touched, setTouched] = useState({});

	const handleBlur = (field) => {
		setTouched((prev) => ({ ...prev, [field]: true }));
	};

	const getError = (field, value) => {
		if (!value) return 'Este campo es obligatorio';
		if (field === 'nombreNiño' || field === 'nombrePadre') {
			if (value.length < 3) return 'Mínimo 3 caracteres';
			if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value))
				return 'Solo se permiten letras';
		}
		if (field === 'edadNiño') {
			if (parseInt(value) <= 0) return 'Mayor a 0';
			if (value.toString().length > 2) return 'Máximo 2 cifras';
		}
		if (field === 'phone') {
			// Strict check: exactly 9 digits
			const cleanPhone = value.replace(/\D/g, '');
			if (cleanPhone.length !== 9) return 'Debe tener 9 dígitos exactos';
		}
		if (field === 'email') {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(value)) return 'Email inválido';
		}
		return '';
	};

	// Fields for Child (Compact Row)
	const childFields = [
		{
			id: 'nombreNiño',
			label: 'Cumpleañero/a',
			icon: Sparkles,
			ph: 'Nombre',
			type: 'text',
			flex: 'flex-[3]',
		},
		{
			id: 'edadNiño',
			label: 'Edad',
			icon: Info,
			ph: 'Ej: 5',
			type: 'number',
			min: 1,
			flex: 'flex-[1]',
		},
	];

	const parentField = {
		id: 'nombrePadre',
		label: 'Nombre Padre/Madre',
		icon: Users,
		ph: 'Ej: Carlos Ruiz',
		type: 'text',
	};

	const emailField = {
		id: 'email',
		label: 'Email de Contacto',
		icon: CheckCircle,
		ph: 'ejemplo@correo.com',
		type: 'email',
	};

	const renderField = (f) => {
		const value = formData.cliente[f.id];
		const error = getError(f.id, value);
		const showError = touched[f.id] && error;

		return (
			<div key={f.id} className={f.flex || 'w-full'}>
				<div
					className={`bg-white p-2 rounded-xl border transition-all ${
						showError
							? 'border-red-500 bg-red-50/10'
							: 'border-gray-100 focus-within:ring-2 focus-within:ring-neverland-green'
					}`}
				>
					<label
						className={`block text-[10px] font-bold mb-0.5 ${showError ? 'text-red-500' : 'text-gray-400'}`}
					>
						{f.label}
					</label>
					<div className="flex items-center gap-2">
						<f.icon
							size={14}
							className={showError ? 'text-red-400' : 'text-gray-300'}
						/>
						<input
							type={f.type || 'text'}
							min={f.min}
							className="w-full bg-transparent outline-none text-sm font-medium text-gray-800 placeholder:text-gray-300"
							placeholder={f.ph}
							value={value || ''}
							onBlur={() => handleBlur(f.id)}
							onChange={(e) => {
								const val = e.target.value;
								if (f.id === 'edadNiño' && val.length > 2) return;
								if (f.type === 'number' && parseInt(val) < 0) return;
								if (
									f.type === 'text' &&
									val &&
									!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(val)
								)
									return;
								setFormData({
									...formData,
									cliente: { ...formData.cliente, [f.id]: val },
								});
							}}
						/>
					</div>
				</div>
				{showError && (
					<p className="text-[9px] text-red-500 font-bold ml-1 mt-0.5 animate-in slide-in-from-top-1">
						{error}
					</p>
				)}
			</div>
		);
	};

	const phoneError = getError('phone', phone);
	const showPhoneError = touched.phone && phoneError;

	return (
		<div className="space-y-2">
			<h2 className="text-lg font-display font-bold text-text-black text-center">
				Datos del Responsable
			</h2>

			{/* Row 1: Child info */}
			<div className="flex gap-2">{childFields.map(renderField)}</div>

			{/* Row 2: Parent Name */}
			{renderField(parentField)}

			{/* Row 3: Mobile Phone */}
			<div>
				<div
					className={`bg-white p-2 rounded-xl border transition-all ${
						showPhoneError
							? 'border-red-500 bg-red-50/10'
							: 'border-gray-100 focus-within:ring-2 focus-within:ring-neverland-green'
					}`}
				>
					<label
						className={`block text-[10px] font-bold mb-0.5 ${showPhoneError ? 'text-red-500' : 'text-gray-400'}`}
					>
						Móvil (Whatsapp)
					</label>
					<div className="flex items-center gap-2">
						<CheckCircle
							size={14}
							className={`shrink-0 ${showPhoneError ? 'text-red-400' : 'text-gray-300'}`}
						/>
						<div className="flex items-center gap-1.5 w-full">
							<input
								type="text"
								value={prefix}
								onChange={(e) => {
									let val = e.target.value;
									if (!val.startsWith('+')) val = '+' + val.replace(/^\+/, '');
									if (val.length > 5) return;
									if (!/^\+[\d]*$/.test(val)) return;
									handlePrefixChange(val);
								}}
								className="w-12 bg-gray-50 px-1 py-0.5 rounded-lg text-xs font-bold text-gray-700 outline-none border border-transparent focus:border-neverland-green text-center"
							/>
							<input
								type="tel"
								className="flex-1 bg-transparent outline-none text-sm font-medium text-gray-800"
								placeholder="600 000 000"
								value={phone}
								onBlur={() => handleBlur('phone')}
								onChange={(e) => {
									const val = e.target.value;
									if (/^[\d\s]*$/.test(val)) {
										if (val.replace(/\s/g, '').length > 9) return;
										handlePhoneChange(val);
									}
								}}
							/>
						</div>
					</div>
				</div>
				{showPhoneError && (
					<p className="text-[9px] text-red-500 font-bold ml-1 mt-0.5 animate-in slide-in-from-top-1">
						{phoneError}
					</p>
				)}
			</div>

			{/* Row 4: Email */}
			{renderField(emailField)}
		</div>
	);
};

export default Step2Responsible;
