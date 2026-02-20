import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, RotateCcw, Map, Anchor } from 'lucide-react';

const ErrorPage = ({ code = 404, message }) => {
	const navigate = useNavigate();

	const errorData = {
		404: {
			title: '¡Oh no! Te has perdido en Neverland',
			description:
				'Parece que esta página se ha ido volando con Peter Pan. ¡Pero no te preocupes, hay muchas otras aventuras esperándote!',
			icon: <Map className="w-24 h-24 text-neverland-green opacity-40" />,
			primaryAction: {
				label: 'Volver al Inicio',
				icon: <Home className="w-5 h-5" />,
				to: '/',
			},
			secondaryAction: {
				label: 'Regresar',
				icon: <ArrowLeft className="w-5 h-5" />,
				onClick: () => navigate(-1),
			},
		},
		500: {
			title: 'Algo se ha roto en el Galeón',
			description:
				'Nuestros piratas técnicos ya están trabajando para arreglar el motor. Por favor, intenta recargar la página en unos momentos.',
			icon: <Anchor className="w-24 h-24 text-energy-orange opacity-40" />,
			primaryAction: {
				label: 'Recargar Página',
				icon: <RotateCcw className="w-5 h-5" />,
				onClick: () => window.location.reload(),
			},
			secondaryAction: {
				label: 'Ir al Inicio',
				icon: <Home className="w-5 h-5" />,
				to: '/',
			},
		},
	};

	const currentError = errorData[code] || errorData[500];
	const displayMessage = message || currentError.description;

	return (
		<div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-20 text-center animate-in fade-in zoom-in duration-700">
			{/* Icon Circle */}
			<div className="relative mb-8">
				<div className="absolute inset-0 bg-energy-orange/10 rounded-full blur-3xl transform scale-150 animate-pulse"></div>
				<div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full border-8 border-white bg-white shadow-soft flex items-center justify-center mx-auto">
					{currentError.icon}
				</div>
				<div className="absolute -top-4 -right-4 bg-sun-yellow text-neverland-green font-display font-black text-4xl w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg rotate-12 border-4 border-white">
					{code}
				</div>
			</div>

			{/* Textos */}
			<div className="max-w-2xl mx-auto space-y-4">
				<h1 className="font-display font-black text-3xl sm:text-5xl text-text-black leading-tight">
					{currentError.title}
				</h1>
				<p className="text-lg text-text-muted font-medium leading-relaxed">
					{displayMessage}
				</p>
			</div>

			{/* Acciones */}
			<div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
				{currentError.primaryAction.to ? (
					<Link
						to={currentError.primaryAction.to}
						className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-neverland-green text-white rounded-2xl font-display font-black text-lg shadow-lg shadow-neverland-green/20 hover:scale-105 active:scale-95 transition-all"
					>
						{currentError.primaryAction.icon}
						{currentError.primaryAction.label}
					</Link>
				) : (
					<button
						onClick={currentError.primaryAction.onClick}
						className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-neverland-green text-white rounded-2xl font-display font-black text-lg shadow-lg shadow-neverland-green/20 hover:scale-105 active:scale-95 transition-all"
					>
						{currentError.primaryAction.icon}
						{currentError.primaryAction.label}
					</button>
				)}

				<button
					onClick={currentError.secondaryAction.onClick || null}
					className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white text-neverland-green border-2 border-neverland-green/10 rounded-2xl font-display font-black text-lg hover:bg-neverland-green/5 transition-all"
				>
					{currentError.secondaryAction.to ? (
						<Link
							to={currentError.secondaryAction.to}
							className="flex items-center gap-2"
						>
							{currentError.secondaryAction.icon}
							{currentError.secondaryAction.label}
						</Link>
					) : (
						<>
							{currentError.secondaryAction.icon}
							{currentError.secondaryAction.label}
						</>
					)}
				</button>
			</div>

			{/* Decoración extra */}
			<div className="mt-20 opacity-20 pointer-events-none grid grid-cols-4 gap-8">
				{[...Array(4)].map((_, i) => (
					<div
						key={i}
						className="w-12 h-12 bg-neverland-green rounded-full"
					></div>
				))}
			</div>
		</div>
	);
};

export default ErrorPage;
