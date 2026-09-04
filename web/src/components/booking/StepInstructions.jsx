import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { BUDGET_ASSETS } from '../../constants/budgetAssets';

const steps = [
	{
		title: 'Menús infantiles y comida para adultos',
		desc: 'Selecciona las opciones gastronómicas para grandes y pequeños.',
		image: BUDGET_ASSETS.MENU_INFANTIL_1,
		color: 'text-energy-orange',
		bg: 'bg-orange-50',
		border: 'border-orange-100',
	},
	{
		title: 'Actividades y visita de personajes',
		desc: 'Talleres creativos y la compañía de sus personajes favoritos.',
		image: BUDGET_ASSETS.TALLER_CIENTIFICO,
		color: 'text-neverland-green',
		bg: 'bg-green-50',
		border: 'border-green-100',
	},
	{
		title: 'Tiempo extra, piñata y más configuraciones',
		desc: 'Suma más diversión y personalización para que sea inolvidable.',
		image: BUDGET_ASSETS.PERSONAJE_KPOP,
		color: 'text-rec-blue',
		bg: 'bg-blue-50',
		border: 'border-blue-100',
	},
];

const StepInstructions = ({ onStart }) => {
	return (
		<div className="flex flex-col items-center gap-4 sm:gap-6 px-2 max-w-lg mx-auto">
			{/* Header */}
			<div className="text-center pt-2">
				<div className="inline-flex items-center gap-2 bg-yellow-50 text-sun-yellow px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border border-yellow-100 mb-2">
					<Sparkles size={14} />
					Sin compromiso
				</div>
				<h2 className="text-2xl sm:text-3xl font-display font-black text-text-black leading-tight sm:mt-1">
					Calcula el presupuesto
					<br />
					<span className="text-neverland-green">de tu fiesta</span>
				</h2>
				<p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base leading-relaxed max-w-md mx-auto px-2">
					Puedes elegir las opciones que más te gusten.
				</p>
			</div>

			{/* Configuration Options with Images */}
			<div className="w-full flex flex-col gap-3">
				{steps.map((s, i) => (
					<div
						key={i}
						className={`flex items-center gap-3 sm:gap-4 p-3 rounded-2xl ${s.bg} border ${s.border} transition-all shadow-sm`}
					>
						{/* Imagen ilustrativa en vez del Icono */}
						<div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-white/60 shadow-inner">
							<img
								src={s.image}
								alt={s.title}
								className="w-full h-full object-cover"
							/>
						</div>
						
						{/* Contenido */}
						<div className="flex-1 min-w-0 py-1">
							<p className={`font-display font-black text-[15px] sm:text-base leading-tight ${s.color}`}>
								{s.title}
							</p>
							<p className="text-gray-500 text-[11px] sm:text-sm mt-1 leading-snug">
								{s.desc}
							</p>
						</div>
					</div>
				))}
			</div>

			{/* CTA hint / button */}
			<button
				type="button"
				onClick={onStart}
				className="mt-2 text-[11px] sm:text-xs text-gray-500 hover:text-energy-orange flex items-center justify-center gap-1.5 animate-pulse rounded-full bg-gray-50 hover:bg-orange-50 px-4 py-2 border border-gray-100 hover:border-orange-200 shadow-sm transition-all cursor-pointer active:scale-95"
			>
				Pulsa <span className="font-bold text-energy-orange">aquí</span> para comenzar
				<ChevronRight size={13} className="text-energy-orange" />
			</button>
		</div>
	);
};

export default StepInstructions;
