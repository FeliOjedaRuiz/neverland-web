import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * ImageLightbox — visor de imagen a pantalla completa.
 *
 * Props:
 *  - src: URL de la imagen a mostrar
 *  - alt: texto alternativo
 *  - onClose: callback al cerrar
 *
 * Se muestra como overlay con backdrop-blur.
 * Cierra con Esc, clic en el overlay, o botón X.
 */
const ImageLightbox = ({ src, alt, onClose }) => {
	const handleKeyDown = useCallback(
		(e) => {
			if (e.key === 'Escape') onClose();
		},
		[onClose]
	);

	useEffect(() => {
		document.addEventListener('keydown', handleKeyDown);
		document.body.style.overflow = 'hidden';
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			document.body.style.overflow = '';
		};
	}, [handleKeyDown]);

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.2 }}
				className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md"
				onClick={onClose}
			>
				{/* Botón cerrar */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-all hover:scale-110 active:scale-95"
					aria-label="Cerrar visor"
					style={{ minWidth: '44px', minHeight: '44px' }}
				>
					<X size={22} />
				</button>

				{/* Imagen */}
				<motion.img
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.9, opacity: 0 }}
					transition={{ type: 'spring', stiffness: 300, damping: 25 }}
					src={src}
					alt={alt}
					className="max-w-full max-h-[90dvh] object-contain rounded-2xl shadow-2xl"
					onClick={(e) => e.stopPropagation()}
					draggable={false}
				/>
			</motion.div>
		</AnimatePresence>
	);
};

export default ImageLightbox;
