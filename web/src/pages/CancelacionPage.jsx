import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import SEO from '../components/common/SEO';

const CancelacionPage = () => {
	const [searchParams] = useSearchParams();
	const exitosa = searchParams.get('exitosa') === 'true';
	const taller = searchParams.get('taller') || '';
	const nino = searchParams.get('nino') || '';
	const error = searchParams.get('error');

	return (
		<>
			<SEO title="Cancelar Inscripción" />
			<div className="min-h-dvh flex items-center justify-center p-6 bg-cream-bg">
				<motion.div
					initial={{ opacity: 0, scale: 0.95, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					className="bg-white rounded-[40px] shadow-2xl p-8 sm:p-12 max-w-lg w-full text-center"
				>
					{exitosa ? (
						<>
							<div className="w-20 h-20 mx-auto mb-6 bg-green-50 rounded-full flex items-center justify-center">
								<CheckCircle2 size={44} className="text-green-500" />
							</div>
							<h1 className="text-2xl font-display font-black text-text-black mb-3">
								Inscripción cancelada
							</h1>
							<p className="text-gray-600 mb-2">
								Se ha cancelado la inscripción de <strong>{nino || 'tu hijo'}</strong>
								{ taller ? ` en el taller "${taller}"` : '' }.
							</p>
							<p className="text-sm text-gray-400 mb-8">
								Si has sido sin querer, puedes volver a inscribirte desde la web.
							</p>
						</>
					) : (
						<>
							<div className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
								<XCircle size={44} className={`${error === 'email_no_valido' ? 'text-orange-500' : 'text-red-500'}`} />
							</div>
							<h1 className="text-2xl font-display font-black text-text-black mb-3">
								{error === 'email_no_valido' ? 'Email no válido' : 'No se pudo cancelar'}
							</h1>
							<p className="text-gray-600 mb-8">
								{error === 'email_no_valido'
									? 'El email desde el que has accedido no coincide con el de la inscripción. Revisa el enlace en tu correo.'
									: 'La inscripción no se ha encontrado o ya fue cancelada anteriormente.'}
							</p>
						</>
					)}

					<Link
						to="/talleres"
						className="inline-flex items-center gap-2 px-6 py-3 bg-neverland-green text-white rounded-2xl font-display font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-neverland-green/20"
					>
						<ArrowLeft size={18} />
						Ver todos los talleres
					</Link>
				</motion.div>
			</div>
		</>
	);
};

export default CancelacionPage;
