import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle2, Calendar, Clock, User, ExternalLink, ArrowLeft, X, MessageCircle, Banknote } from 'lucide-react';
import { safeParseDate } from '../../utils/safeDate';
import { getConfig } from '../../services/api';
import SEO from '../common/SEO';

// Número principal de Neverland (el del botón flotante). El otro número del
// repo es del desarrollador y NO se usa aquí.
const WHATSAPP_NEVERLAND = '34651707985';

const formatFecha = (fechaStr) => {
	const date = safeParseDate(fechaStr);
	if (!date) return '';
	const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' }).replace(/^\w/, (c) => c.toUpperCase());
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = String(date.getFullYear()).slice(-2);
	return `${weekday}, ${day}/${month}/${year}`;
};

const generarGoogleCalendarUrl = (taller) => {
	if (!taller.fecha || !taller.horario?.inicio || !taller.horario?.fin) return '#';
	const fechaObj = safeParseDate(taller.fecha);
	if (!fechaObj) return '#';
	const [hI, mI] = taller.horario.inicio.split(':').map(Number);
	const [hF, mF] = taller.horario.fin.split(':').map(Number);
	const inicio = new Date(fechaObj); inicio.setHours(hI, mI, 0, 0);
	const fin = new Date(fechaObj); fin.setHours(hF, mF, 0, 0);
	const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: `Taller: ${taller.nombre}`,
		dates: `${fmt(inicio)}/${fmt(fin)}`,
		details: `Taller: ${taller.nombre}\n${taller.descripcion || ''}`,
		location: 'Neverland - C/ Las Palmeras, Cúllar Vega, Granada',
	});
	return `https://www.google.com/calendar/render?${params.toString()}`;
};

const InscripcionResumen = () => {
	const location = useLocation();
	const { inscripcionData, taller } = location.state || {};

	// Modal de aviso de pago: se abre solo tras una inscripción exitosa.
	// Hooks SIEMPRE antes del early-return de Navigate (Rules of Hooks).
	const [modalAbierto, setModalAbierto] = useState(true);
	const [config, setConfig] = useState(null);
	const [configCargada, setConfigCargada] = useState(false);
	const dialogRef = useRef(null);

	// IBAN desde Config (mismo servicio que usan las demás pantallas).
	// Si falla o aún no está configurado, se muestra el aviso de fallback.
	useEffect(() => {
		// Sin state (se va a redirigir con Navigate): no hay nada que pagar.
		if (!inscripcionData || !taller) return undefined;
		let cancelado = false;
		(async () => {
			try {
				const res = await getConfig();
				if (!cancelado) setConfig(res?.data ?? null);
			} catch (err) {
				console.error('Error cargando Config para el aviso de pago:', err);
				if (!cancelado) setConfig(null);
			} finally {
				if (!cancelado) setConfigCargada(true);
			}
		})();
		return () => { cancelado = true; };
	}, [inscripcionData, taller]);

	// Accesibilidad del modal: foco al abrir y cierre con Escape.
	// Los handlers van en try/catch (regla del repo: todo evento se protege).
	useEffect(() => {
		if (!modalAbierto) return undefined;
		try {
			dialogRef.current?.focus();
		} catch (_) { /* Safari antiguo: sin foco programático */ }
		const onKeyDown = (e) => {
			try {
				if (e.key === 'Escape') setModalAbierto(false);
			} catch (_) { /* noop */ }
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [modalAbierto]);

	// Sin state (recarga directa o navegación manual): fuera, como antes.
	if (!inscripcionData || !taller) {
		return <Navigate to="/talleres" replace />;
	}

	const fechaFormateada = formatFecha(taller.fecha);
	const horaStr = taller.horario?.inicio ? `${taller.horario.inicio} – ${taller.horario.fin}` : '';

	// Concepto de la transferencia del TALLER: "<nombre del taller> <nombre
	// del niño>" (ej: "Pintacaras Dina"). Distinto del de las reservas, que
	// lleva la fecha: aquí el taller ya tiene fecha propia y lo que hay que
	// conciliar es la inscripción concreta de cada niño.
	const concepto = [taller.nombre, inscripcionData.nombreNiño].filter(Boolean).join(' ');

	const iban = (config?.datosBancarios?.iban || '').trim();
	const hayIban = iban.length > 0;

	// Mensaje pre-rellenado: pide el comprobante e incluye niño y taller.
	const mensajeWhatsApp = [
		'Hola Neverland, os envío el comprobante de la transferencia:',
		`Taller: ${taller.nombre}`,
		`Niño/a: ${inscripcionData.nombreNiño}`,
		concepto ? `Concepto: "${concepto}"` : null,
		`Importe: ${taller.precio}€`,
	].filter(Boolean).join('\n');

	const whatsappUrl = `https://wa.me/${WHATSAPP_NEVERLAND}?text=${encodeURIComponent(mensajeWhatsApp)}`;

	return (
		<>
			<SEO title="Inscripción Confirmada" />

			<div className="min-h-dvh bg-cream-bg">
				<div className="pt-24 sm:pt-28 pb-16 px-4">
					<div className="max-w-lg mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-soft space-y-5">

						{/* Éxito */}
						<div className="text-center space-y-3">
							<CheckCircle2 size={44} className="text-neverland-green mx-auto" />
							<h1 className="text-2xl sm:text-3xl font-display font-black text-text-black">
								¡Inscripción confirmada!
							</h1>
							<p className="text-sm text-gray-500">
								Te hemos enviado un email de confirmación a{' '}
								<span className="font-bold text-text-black">{inscripcionData.emailResponsable}</span>
							</p>
						</div>

						<div className="border-t border-gray-100" />

						{/* Nombre del taller — destacado */}
						<h2 className="text-2xl sm:text-3xl font-display font-black text-energy-orange text-center leading-tight">
							{taller.nombre}
						</h2>

						{/* Datos — iconos sin fondo */}
						<div className="space-y-3">
							<div className="flex items-center gap-2.5">
								<Calendar size={17} className="text-neverland-green shrink-0" />
								<span className="text-sm text-gray-700">{fechaFormateada}</span>
							</div>

							{horaStr && (
								<div className="flex items-center gap-2.5">
									<Clock size={17} className="text-neverland-green shrink-0" />
									<span className="text-sm text-gray-700">{horaStr}</span>
								</div>
							)}

							<div className="flex items-center gap-2.5">
								<User size={17} className="text-neverland-green shrink-0" />
								<span className="text-sm text-gray-700">
									{inscripcionData.nombreNiño}
									{inscripcionData.edadNiño ? ` (${inscripcionData.edadNiño} años)` : ''}
								</span>
							</div>
						</div>

						<div className="border-t border-gray-100" />

						{/* Precio */}
						<div className="text-center">
							<p className="font-display font-black text-base text-energy-orange">
								Precio {taller.precio}€
							</p>
						</div>

						{/* Google Calendar */}
						<a
							href={generarGoogleCalendarUrl(taller)}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center justify-center gap-2 w-full py-3 bg-neverland-green text-white rounded-2xl font-display font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
						>
							<Calendar size={16} />
							Añadir a Google Calendar
							<ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
						</a>

						{/* Volver */}
						<div className="text-center">
							<Link
								to="/talleres"
								className="inline-flex items-center gap-2 text-gray-400 hover:text-neverland-green transition-colors font-display font-bold text-[10px] uppercase tracking-wider"
							>
								<ArrowLeft size={12} />
								Volver a talleres
							</Link>
						</div>

					</div>
				</div>
			</div>

			{/* ── MODAL: aviso de pago por transferencia ──────────────────────
			    Se renderiza ENCIMA de la pantalla de confirmación con un
			    overlay; al cerrarlo (Escape, botón o clic en el fondo) queda
			    visible el contenido de abajo, así que no lo tapa para siempre. */}
			{modalAbierto && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
					onClick={() => setModalAbierto(false)}
					role="presentation"
				>
					<div
						ref={dialogRef}
						role="dialog"
						aria-modal="true"
						aria-labelledby="modal-pago-taller-titulo"
						tabIndex={-1}
						onClick={(e) => e.stopPropagation()}
						className="w-full max-w-lg bg-white rounded-3xl p-6 border border-gray-100 shadow-soft outline-none max-h-[90dvh] overflow-y-auto"
					>
						{/* Cabecera */}
						<div className="flex items-start justify-between gap-3 mb-4">
							<div className="flex items-center gap-2.5 min-w-0">
								<Banknote size={22} className="text-energy-orange shrink-0" />
								<h2
									id="modal-pago-taller-titulo"
									className="text-lg sm:text-xl font-display font-black text-text-black leading-tight"
								>
									Confirma tu plaza
								</h2>
							</div>
							<button
								type="button"
								onClick={() => setModalAbierto(false)}
								aria-label="Cerrar aviso de pago"
								className="p-1.5 text-gray-400 hover:text-text-black hover:bg-gray-100 rounded-lg transition-colors shrink-0"
							>
								<X size={18} />
							</button>
						</div>

						{/* Importe total */}
						<p className="text-sm text-gray-600 leading-relaxed mb-4">
							Para la <strong className="text-text-black">confirmación de la plaza</strong> debe
							abonarse el <strong className="text-energy-orange">{taller.precio}€</strong> (importe
							total del taller) por transferencia.
						</p>

						{/* Concepto de la transferencia */}
						<div className="bg-cream-bg rounded-2xl p-4 border border-gray-100 mb-4">
							<p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
								Concepto de la transferencia
							</p>
							<p className="text-sm font-bold text-text-black break-words">"{concepto}"</p>
						</div>

						{/* IBAN desde Config, o aviso de fallback (sin IBAN vacío) */}
						{!configCargada ? (
							<p className="text-xs text-gray-400 font-medium mb-4" role="status">
								Cargando datos bancarios…
							</p>
						) : hayIban ? (
							<div className="bg-cream-bg rounded-2xl p-4 border border-gray-100 mb-4">
								<p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
									IBAN
								</p>
								<p className="text-sm font-bold text-text-black break-all">{iban}</p>
							</div>
						) : (
							<div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 mb-4" role="status">
								<p className="text-sm font-bold text-amber-800 leading-relaxed">
									Los datos bancarios no están disponibles en este momento. Contacta con
									Neverland por WhatsApp para completar el pago.
								</p>
							</div>
						)}

						{/* Botón WhatsApp — envío del comprobante */}
						<a
							href={whatsappUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center justify-center gap-2 w-full py-3 bg-neverland-green text-white rounded-2xl font-display font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 mb-3"
						>
							<MessageCircle size={16} />
							Enviar comprobante por WhatsApp
						</a>

						{/* Cerrar */}
						<button
							type="button"
							onClick={() => setModalAbierto(false)}
							className="w-full py-3 bg-white border border-gray-200 text-gray-500 rounded-2xl font-display font-black text-xs uppercase tracking-wider hover:text-text-black hover:border-gray-300 transition-colors"
						>
							Entendido
						</button>
					</div>
				</div>
			)}
		</>
	);
};

export default InscripcionResumen;
