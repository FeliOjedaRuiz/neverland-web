import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ShieldCheck } from 'lucide-react';

const DataProtectionModal = ({
	isOpen,
	onClose,
	onAccept,
	loading,
	readOnly = false,
}) => {
	const [acceptedBasic, setAcceptedBasic] = useState(false);
	const [acceptedCommercial, setAcceptedCommercial] = useState(false);

	// Prevent scrolling when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	const handleAccept = () => {
		if (acceptedBasic) {
			onAccept({
				privacyPolicy: acceptedBasic,
				marketing: acceptedCommercial,
			});
		}
	};

	if (!isOpen) return null;

	const modalContent = (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4">
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="absolute inset-0 bg-black/75 backdrop-blur-[3px]"
					/>

					{/* Modal Content */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 10 }}
						className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] border border-gray-100"
					>
						{/* Header */}
						<div className="px-4 py-3 bg-neverland-green text-white flex justify-between items-center shrink-0">
							<div className="flex items-center gap-2">
								<ShieldCheck size={20} />
								<h3 className="text-base font-display font-bold leading-tight">
									Protección de Datos
								</h3>
							</div>
							<button
								onClick={onClose}
								className="p-1 hover:bg-white/20 rounded-full transition-colors"
							>
								<X size={20} />
							</button>
						</div>

						{/* Body */}
						<div className="p-4 overflow-y-auto no-scrollbar scroll-smooth">
							<div className="mb-4">
								<h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-3 bg-gray-50 border border-gray-200 py-2 px-3 rounded-lg text-center leading-tight">
									Información Básica Sobre Protección De Datos - Acciones
									comerciales y/o envíos publicitarios actividades lúdicas
								</h4>

								<div className="border border-gray-200 rounded-xl overflow-hidden text-[11px] leading-relaxed">
									<div className="grid grid-cols-[90px_1fr] border-b border-gray-100">
										<div className="bg-gray-50 p-2 font-bold border-r border-gray-100 flex items-center">
											Responsable
										</div>
										<div className="p-2 text-gray-700">
											SUEÑOS DULCES EVENTO ESPECIALES SL
										</div>
									</div>
									<div className="grid grid-cols-[90px_1fr] border-b border-gray-100">
										<div className="bg-gray-50 p-2 font-bold border-r border-gray-100 flex items-center">
											Finalidad
										</div>
										<div className="p-2 text-gray-700">
											Captación, registro y tratamiento de datos con finalidades
											de publicidad y prospección comercial.
										</div>
									</div>
									<div className="grid grid-cols-[90px_1fr] border-b border-gray-100">
										<div className="bg-gray-50 p-2 font-bold border-r border-gray-100 flex items-center">
											Derechos
										</div>
										<div className="p-2 text-gray-700">
											Acceder, rectificar y suprimir los datos, así como otros
											derechos, como se explica en la información adicional.
										</div>
									</div>
									<div className="grid grid-cols-[90px_1fr]">
										<div className="bg-gray-50 p-2 font-bold border-r border-gray-100 flex items-center">
											Info adicional
										</div>
										<div className="p-2 text-gray-700">
											Puede consultar la información adicional y detallada sobre
											Protección de Datos en la siguiente dirección de correo
											electrónico{' '}
											<span className="font-semibold text-neverland-green underline">
												neverland.cullarvega@gmail.com
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Checkboxes - Only show if not read-only */}
							{!readOnly && (
								<div className="space-y-3 bg-gray-50/50 p-3 rounded-xl border border-dashed border-gray-200">
									<label className="flex gap-3 cursor-pointer group items-start">
										<div className="shrink-0 mt-0.5 relative flex items-center justify-center">
											<input
												type="checkbox"
												className="sr-only"
												checked={acceptedBasic}
												onChange={(e) => setAcceptedBasic(e.target.checked)}
											/>
											<div
												className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${acceptedBasic ? 'bg-neverland-green border-neverland-green shadow-sm' : 'border-gray-300 bg-white group-hover:border-neverland-green'}`}
											>
												{acceptedBasic && (
													<Check
														size={14}
														className="text-white stroke-[3px]"
													/>
												)}
											</div>
										</div>
										<span className="text-[12px] text-gray-700 font-medium leading-tight">
											He leído y acepto la información básica de protección de
											datos. <span className="text-red-500">*</span>
										</span>
									</label>

									<label className="flex gap-3 cursor-pointer group items-start">
										<div className="shrink-0 mt-0.5 relative flex items-center justify-center">
											<input
												type="checkbox"
												className="sr-only"
												checked={acceptedCommercial}
												onChange={(e) =>
													setAcceptedCommercial(e.target.checked)
												}
											/>
											<div
												className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${acceptedCommercial ? 'bg-neverland-green border-neverland-green shadow-sm' : 'border-gray-300 bg-white group-hover:border-neverland-green'}`}
											>
												{acceptedCommercial && (
													<Check
														size={14}
														className="text-white stroke-[3px]"
													/>
												)}
											</div>
										</div>
										<span className="text-[12px] text-gray-700 font-medium leading-tight">
											SI quiero recibir comunicaciones comerciales.
										</span>
									</label>
								</div>
							)}
						</div>

						{/* Footer - Only show if not read-only */}
						{!readOnly && (
							<div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
								<button
									onClick={onClose}
									className="flex-1 py-3 px-4 rounded-xl bg-white border border-gray-200 text-gray-500 font-display font-bold text-sm hover:bg-gray-100 transition-colors"
								>
									Cancelar
								</button>
								<button
									onClick={handleAccept}
									disabled={!acceptedBasic || loading}
									className={`flex-1 py-3 px-4 rounded-xl font-display font-bold text-sm text-white transition-all shadow-md ${acceptedBasic && !loading ? 'bg-neverland-green hover:shadow-lg hover:scale-[1.02] active:scale-95' : 'bg-gray-300 cursor-not-allowed shadow-none'}`}
								>
									{loading ? 'Enviando...' : 'Enviar'}
								</button>
							</div>
						)}
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);

	return createPortal(modalContent, document.body);
};

export default DataProtectionModal;
