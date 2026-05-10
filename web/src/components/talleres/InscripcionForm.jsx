import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Send, AlertCircle, User, Cake, Phone, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { inscribirATaller } from '../../services/api';

const FIELD_ICONS = {
	nombreNiño: Cake,
	edadNiño: Cake,
	nombreResponsable: User,
	telefonoResponsable: Phone,
	emailResponsable: Mail,
};

const InscripcionForm = ({ taller, onSuccess }) => {
	const [form, setForm] = useState({
		nombreNiño: '',
		edadNiño: '',
		nombreResponsable: '',
		telefonoResponsable: '',
		emailResponsable: '',
		privacyPolicyConsent: false,
		marketingConsent: false,
	});
	const [errors, setErrors] = useState({});
	const [saving, setSaving] = useState(false);
	const [submitError, setSubmitError] = useState('');

	const handleChange = (field, value) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => ({ ...prev, [field]: '' }));
		setSubmitError('');
	};

	const validate = () => {
		const newErrors = {};

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

		const cleanPhone = form.telefonoResponsable.replace(/\s/g, '');
		if (!cleanPhone) {
			newErrors.telefonoResponsable = 'El teléfono es obligatorio';
		} else if (cleanPhone.length < 9) {
			newErrors.telefonoResponsable = 'Mínimo 9 dígitos';
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
			try {
				window.scrollTo({ top: 0, behavior: 'smooth' });
			} catch (_) {
				window.scrollTo(0, 0);
			}
			toast.error('Corrige los errores del formulario');
			return;
		}

		setSaving(true);
		try {
			const payload = {
				nombreNiño: form.nombreNiño.trim(),
				edadNiño: form.edadNiño ? parseInt(form.edadNiño) : undefined,
				nombreResponsable: form.nombreResponsable.trim(),
				telefonoResponsable: form.telefonoResponsable.trim(),
				emailResponsable: form.emailResponsable.trim(),
				privacyPolicyConsent: form.privacyPolicyConsent,
				marketingConsent: form.marketingConsent,
			};

			await inscribirATaller(taller.id || taller._id, payload);
			toast.success('¡Inscripción realizada con éxito!');

			if (onSuccess) {
				onSuccess({
					inscripcionData: payload,
					taller,
				});
			}
		} catch (err) {
			console.error('Error al inscribir:', err);
			const msg =
				err.response?.data?.error ||
				err.response?.data?.message ||
				'Error al procesar la inscripción';
			setSubmitError(msg);
			toast.error(msg);
		} finally {
			setSaving(false);
		}
	};

	const FieldIcon = (fieldName) => FIELD_ICONS[fieldName] || User;

	return (
		<motion.form
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			onSubmit={handleSubmit}
			className="bg-white rounded-[40px] p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5"
		>
			{/* Header */}
			<div className="mb-2">
				<h3 className="text-xl font-display font-black text-text-black">
					Inscribir niño
				</h3>
				<p className="text-[10px] text-gray-400 font-medium mt-0.5">
					Completa los datos del niño y del responsable
				</p>
			</div>

			{/* Error de submit */}
			{submitError && (
				<div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
					<AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
					<p className="text-sm text-red-600 font-medium">{submitError}</p>
				</div>
			)}

			{/* Datos del niño */}
			<div className="space-y-4">
				<p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
					Datos del niño
				</p>

				<div>
					<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
						Nombre del niño <span className="text-red-400">*</span>
					</label>
					<input
						type="text"
						value={form.nombreNiño}
						onChange={(e) => handleChange('nombreNiño', e.target.value)}
						placeholder="Ej: Pepito"
						className={`w-full bg-gray-50/50 p-4 rounded-2xl text-sm font-bold text-text-black border outline-none transition-all min-text-[16px] ${
							errors.nombreNiño
								? 'border-red-200 bg-red-50/30'
								: 'border-transparent focus:bg-white focus:border-neverland-green/20'
						}`}
					/>
					{errors.nombreNiño && (
						<p className="text-[10px] text-red-500 font-medium mt-1 ml-1">
							{errors.nombreNiño}
						</p>
					)}
				</div>

				<div>
					<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
						Edad del niño
					</label>
					<input
						type="number"
						min="1"
						max="99"
						value={form.edadNiño}
						onChange={(e) => handleChange('edadNiño', e.target.value)}
						placeholder="Ej: 6"
						className={`w-full bg-gray-50/50 p-4 rounded-2xl text-sm font-bold text-text-black border outline-none transition-all min-text-[16px] ${
							errors.edadNiño
								? 'border-red-200 bg-red-50/30'
								: 'border-transparent focus:bg-white focus:border-neverland-green/20'
						}`}
					/>
					{errors.edadNiño && (
						<p className="text-[10px] text-red-500 font-medium mt-1 ml-1">
							{errors.edadNiño}
						</p>
					)}
				</div>
			</div>

			{/* Datos del responsable */}
			<div className="space-y-4 pt-2 border-t border-gray-50">
				<p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
					Datos del responsable
				</p>

				<div>
					<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
						Nombre del responsable <span className="text-red-400">*</span>
					</label>
					<input
						type="text"
						value={form.nombreResponsable}
						onChange={(e) => handleChange('nombreResponsable', e.target.value)}
						placeholder="Ej: María García"
						className={`w-full bg-gray-50/50 p-4 rounded-2xl text-sm font-bold text-text-black border outline-none transition-all min-text-[16px] ${
							errors.nombreResponsable
								? 'border-red-200 bg-red-50/30'
								: 'border-transparent focus:bg-white focus:border-neverland-green/20'
						}`}
					/>
					{errors.nombreResponsable && (
						<p className="text-[10px] text-red-500 font-medium mt-1 ml-1">
							{errors.nombreResponsable}
						</p>
					)}
				</div>

				<div>
					<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
						Teléfono <span className="text-red-400">*</span>
					</label>
					<input
						type="tel"
						value={form.telefonoResponsable}
						onChange={(e) =>
							handleChange('telefonoResponsable', e.target.value)
						}
						placeholder="Ej: 600 000 000"
						className={`w-full bg-gray-50/50 p-4 rounded-2xl text-sm font-bold text-text-black border outline-none transition-all min-text-[16px] ${
							errors.telefonoResponsable
								? 'border-red-200 bg-red-50/30'
								: 'border-transparent focus:bg-white focus:border-neverland-green/20'
						}`}
					/>
					{errors.telefonoResponsable && (
						<p className="text-[10px] text-red-500 font-medium mt-1 ml-1">
							{errors.telefonoResponsable}
						</p>
					)}
				</div>

				<div>
					<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
						Email <span className="text-red-400">*</span>
					</label>
					<input
						type="email"
						value={form.emailResponsable}
						onChange={(e) => handleChange('emailResponsable', e.target.value)}
						placeholder="Ej: mariagarcia@email.com"
						className={`w-full bg-gray-50/50 p-4 rounded-2xl text-sm font-bold text-text-black border outline-none transition-all min-text-[16px] ${
							errors.emailResponsable
								? 'border-red-200 bg-red-50/30'
								: 'border-transparent focus:bg-white focus:border-neverland-green/20'
						}`}
					/>
					{errors.emailResponsable && (
						<p className="text-[10px] text-red-500 font-medium mt-1 ml-1">
							{errors.emailResponsable}
						</p>
					)}
				</div>
			</div>

			{/* Checkboxes de consentimiento */}
			<div className="space-y-3 pt-2 border-t border-gray-50">
				<label className="flex items-start gap-3 cursor-pointer group">
					<input
						type="checkbox"
						checked={form.privacyPolicyConsent}
						onChange={(e) =>
							handleChange('privacyPolicyConsent', e.target.checked)
						}
						className="mt-1 w-4 h-4 rounded border-gray-300 text-neverland-green focus:ring-neverland-green"
					/>
					<div className="flex-1">
						<span className="text-xs font-bold text-gray-600 group-hover:text-text-black transition-colors">
							Acepto la{' '}
							<a
								href="/politica-privacidad"
								target="_blank"
								rel="noopener noreferrer"
								className="text-neverland-green underline hover:no-underline"
								onClick={(e) => e.stopPropagation()}
							>
								política de privacidad
							</a>{' '}
							<span className="text-red-400">*</span>
						</span>
						{errors.privacyPolicyConsent && (
							<p className="text-[10px] text-red-500 font-medium mt-0.5">
								{errors.privacyPolicyConsent}
							</p>
						)}
					</div>
				</label>

				<label className="flex items-start gap-3 cursor-pointer group">
					<input
						type="checkbox"
						checked={form.marketingConsent}
						onChange={(e) =>
							handleChange('marketingConsent', e.target.checked)
						}
						className="mt-1 w-4 h-4 rounded border-gray-300 text-neverland-green focus:ring-neverland-green"
					/>
					<span className="text-xs font-bold text-gray-400 group-hover:text-gray-600 transition-colors">
						Acepto recibir comunicaciones comerciales sobre novedades y eventos
						(opcional)
					</span>
				</label>
			</div>

			{/* Botón submit */}
			<button
				type="submit"
				disabled={saving}
				className="w-full flex items-center justify-center gap-2 py-4 bg-neverland-green text-white rounded-2xl font-display font-black text-sm uppercase tracking-wider shadow-lg shadow-neverland-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{saving ? (
					<>
						<Loader2 size={18} className="animate-spin" />
						Inscribiendo...
					</>
				) : (
					<>
						<Send size={18} />
						Inscribir niño
					</>
				)}
			</button>
		</motion.form>
	);
};

export default InscripcionForm;
