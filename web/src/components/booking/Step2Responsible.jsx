import React from 'react';
import { Sparkles, Info, Users, CheckCircle } from 'lucide-react';

const Step2Responsible = ({ formData, setFormData }) => {
	const fields = [
		{
			id: 'nombreNiño',
			label: 'Nombre del Cumpleañero/a',
			icon: Sparkles,
			ph: 'Ej: Sofía',
		},
		{
			id: 'edadNiño',
			label: 'Edad que cumple',
			icon: Info,
			ph: 'Ej: 5',
			type: 'number',
		},
		{
			id: 'nombrePadre',
			label: 'Nombre Padre/Madre',
			icon: Users,
			ph: 'Ej: Carlos Ruiz',
		},
		{
			id: 'telefono',
			label: 'Teléfono',
			icon: CheckCircle,
			ph: '600 000 000',
			type: 'tel',
		},
	];

	return (
		<div className="space-y-4">
			<h2 className="text-xl font-display font-bold text-text-black text-center">
				Datos del Responsable
			</h2>
			{fields.map((f) => (
				<div
					key={f.id}
					className="bg-white p-3 rounded-2xl border border-gray-100 focus-within:ring-2 focus-within:ring-neverland-green transition-all"
				>
					<label className="text-xs font-bold text-gray-400 ml-1">
						{f.label}
					</label>
					<div className="flex items-center gap-3 mt-1">
						<f.icon size={18} className="text-gray-300" />
						<input
							type={f.type || 'text'}
							className="w-full bg-transparent outline-none font-medium text-gray-800"
							placeholder={f.ph}
							value={formData.cliente[f.id]}
							onChange={(e) =>
								setFormData({
									...formData,
									cliente: {
										...formData.cliente,
										[f.id]: e.target.value,
									},
								})
							}
						/>
					</div>
				</div>
			))}
		</div>
	);
};

export default Step2Responsible;
