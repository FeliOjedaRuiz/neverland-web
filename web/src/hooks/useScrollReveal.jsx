import { useRef, useEffect } from 'react';
import { useInView, useAnimation } from 'framer-motion';

export const useScrollReveal = (threshold = 0.2) => {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, amount: threshold });
	const controls = useAnimation();

	useEffect(() => {
		if (isInView) {
			controls.start('visible');
		}
	}, [isInView, controls]);

	return {
		ref,
		controls,
		variants: {
			hidden: { opacity: 0, y: 75 },
			visible: {
				opacity: 1,
				y: 0,
				transition: { duration: 0.6, ease: 'easeOut' },
			},
		},
	};
};
