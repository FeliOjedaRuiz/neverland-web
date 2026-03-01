import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '../services/api';

const LoginPage = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const navigate = useNavigate();
	const location = useLocation();

	const handleLogin = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			const res = await login(email, password);
			localStorage.setItem('token', res.data.token);
			localStorage.setItem('user', JSON.stringify(res.data));

			// Redirect back to the page they were trying to access, or to /admin
			const from = location.state?.from?.pathname || '/admin';
			navigate(from, { replace: true });
		} catch (err) {
			console.error(err);
			setError(
				err.response?.data?.message ||
					'Credenciales incorrectas. Por favor, inténtalo de nuevo.',
			);
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-cream-bg flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-surface rounded-3xl shadow-soft p-8 sm:p-12 border border-white/50">
				<div className="text-center mb-10">
					<div className="w-20 h-20 bg-neverland-green/10 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
						<Lock className="text-neverland-green" size={32} />
					</div>
					<h1 className="text-3xl font-display font-bold text-text-black">
						Panel de Control
					</h1>
					<p className="text-text-muted font-sans mt-2">
						Acceso exclusivo para administradores
					</p>
				</div>

				<form onSubmit={handleLogin} className="space-y-6">
					{error && (
						<div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-sans font-medium border border-red-100 flex items-center justify-center">
							{error}
						</div>
					)}

					<div>
						<label className="block text-sm font-display font-bold text-text-black mb-2 px-1">
							Correo Electrónico
						</label>
						<div className="relative">
							<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
								<Mail className="text-text-muted" size={20} />
							</div>
							<input
								type="email"
								required
								className="block w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-neverland-green/10 focus:border-neverland-green outline-none transition-all font-sans text-text-black placeholder-gray-400"
								placeholder="tumail@mail.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-display font-bold text-text-black mb-2 px-1">
							Contraseña
						</label>
						<div className="relative">
							<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
								<Lock className="text-text-muted" size={20} />
							</div>
							<input
								type={showPassword ? 'text' : 'password'}
								required
								className="block w-full pl-11 pr-12 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-neverland-green/10 focus:border-neverland-green outline-none transition-all font-sans text-text-black placeholder-gray-400"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-neverland-green transition-colors"
							>
								{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
							</button>
						</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-neverland-green text-white py-4 rounded-full font-display font-bold text-lg shadow-lg hover:shadow-xl hover:bg-[#1f554d] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 active:scale-95"
					>
						{loading ? 'Entrando...' : 'Iniciar Sesión'}
						{!loading && (
							<ArrowRight
								size={22}
								className="group-hover:translate-x-1 transition-transform"
							/>
						)}
					</button>
				</form>

				<div className="mt-8 pt-8 border-t border-gray-100 text-center">
					<button
						onClick={() => navigate('/')}
						className="text-gray-400 text-sm hover:text-neverland-green transition-colors"
					>
						&larr; Volver a la web principal
					</button>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
