import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader2, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Eliminar', isLoading = false, variant = 'danger' }) => {
	const isDanger = variant === 'danger';

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="absolute inset-0 bg-black/40 backdrop-blur-sm"
						onClick={onClose}
					/>

					{/* Modal */}
					<motion.div
						initial={{ opacity: 0, scale: 0.92, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.92, y: 10 }}
						transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
						className="relative bg-white rounded-[28px] p-6 max-w-sm w-full shadow-xl border border-gray-100"
					>
						{/* Close button */}
						<button
							onClick={onClose}
							className="absolute top-4 right-4 p-1 text-gray-300 hover:text-gray-500 transition-colors rounded-full hover:bg-gray-50"
						>
							<X size={16} />
						</button>

						{/* Icon */}
						<div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isDanger ? 'bg-red-50 text-red-500' : 'bg-energy-orange/10 text-energy-orange'}`}>
							<AlertCircle size={24} />
						</div>

						{/* Title */}
						<h3 className="font-display font-black text-lg text-text-black mb-1.5">
							{title}
						</h3>

						{/* Message */}
						<p className="text-sm text-gray-500 leading-relaxed mb-6">
							{message}
						</p>

						{/* Actions */}
						<div className="flex items-center gap-3">
							<button
								onClick={onClose}
								disabled={isLoading}
								className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-gray-200 transition-all disabled:opacity-50"
							>
								Cancelar
							</button>
							<button
								onClick={onConfirm}
								disabled={isLoading}
								className={`flex-1 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
									isDanger
										? 'bg-red-500 text-white hover:bg-red-600'
										: 'bg-neverland-green text-white hover:bg-neverland-green/90'
								}`}
							>
								{isLoading && <Loader2 size={12} className="animate-spin" />}
								{confirmText}
							</button>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
};

export default ConfirmModal;
