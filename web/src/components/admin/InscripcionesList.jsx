import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, User, Phone, Mail, Cake } from 'lucide-react';

const InscripcionesList = ({ inscripciones = [], onDelete, aforo = 0, tallerId }) => {
	const capacidad = aforo || 1;
	const progress = Math.min((inscripciones.length / capacidad) * 100, 100);
	const progressColor =
		progress >= 100
			? 'bg-red-500'
			: progress >= 80
				? 'bg-energy-orange'
				: 'bg-neverland-green';

	const handleDelete = (inscripcionId, nombreNiño) => {
		if (window.confirm(`¿Eliminar a ${nombreNiño} de la lista de inscritos?`)) {
			onDelete(inscripcionId);
		}
	};

	return (
		<div>
			{/* Barra de progreso de aforo */}
			<div className="flex items-center gap-3 mb-6">
				<div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
					<div
						className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor}`}
						style={{ width: `${Math.min(progress, 100)}%` }}
					/>
				</div>
				<span className="text-sm font-display font-black text-gray-500 whitespace-nowrap">
					{inscripciones.length} de {aforo} inscritos
				</span>
			</div>

			{/* Estado vacío */}
			{inscripciones.length === 0 ? (
				<div className="text-center py-12 bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
					<div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
						<User size={24} className="text-gray-300" />
					</div>
					<p className="font-display font-bold text-gray-400 text-sm">
						No hay niños inscritos aún
					</p>
					<p className="text-[10px] text-gray-300 font-medium mt-1">
						Los inscritos aparecerán aquí cuando alguien reserve
					</p>
				</div>
			) : (
				/* Grid de inscripciones */
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
					{inscripciones.map((insc, idx) => (
						<motion.div
							key={insc._id || idx}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.03 }}
							className="group bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-lg hover:border-gray-200 transition-all"
						>
							<div className="flex items-start justify-between mb-3">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-xl bg-neverland-green/10 flex items-center justify-center text-neverland-green shrink-0">
										<Cake size={18} />
									</div>
									<div>
										<h4 className="font-display font-black text-sm text-text-black">
											{insc.nombreNiño}
										</h4>
										{insc.edadNiño && (
											<span className="text-[10px] font-bold text-gray-400">
												{insc.edadNiño} años
											</span>
										)}
									</div>
								</div>
								<button
									onClick={() => handleDelete(insc._id, insc.nombreNiño)}
									className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
									title="Eliminar inscripción"
								>
									<Trash2 size={14} />
								</button>
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center gap-2 text-[11px] text-gray-500">
									<User size={12} className="shrink-0 text-gray-300" />
									<span className="font-medium truncate">{insc.nombreResponsable}</span>
								</div>
								<div className="flex items-center gap-2 text-[11px] text-gray-500">
									<Phone size={12} className="shrink-0 text-gray-300" />
									<span className="font-medium">{insc.telefonoResponsable}</span>
								</div>
								<div className="flex items-center gap-2 text-[11px] text-gray-500">
									<Mail size={12} className="shrink-0 text-gray-300" />
									<span className="font-medium truncate">{insc.emailResponsable}</span>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			)}
		</div>
	);
};

export default InscripcionesList;
