import React from 'react';
import { MapPin, Phone, Instagram, Facebook, Clock } from 'lucide-react';
import logo from '../assets/logo.svg';

const Footer = () => {
	return (
		<footer className="bg-text-black text-white pt-16 pb-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
					{/* Column 1: Brand & Contact */}
					<div>
						<img src={logo} alt="Neverland Logo" className="h-16 w-auto mb-6" />
						<p className="text-gray-400 mb-6 text-sm leading-relaxed">
							El lugar donde los sueños se hacen realidad. Creamos experiencias
							inolvidables para los más pequeños en un entorno seguro y
							divertido.
						</p>
						<div className="space-y-4">
							<div className="flex items-start gap-4">
								<MapPin
									className="text-energy-orange mt-1 flex-shrink-0"
									size={20}
								/>
								<span className="text-gray-300 text-sm">
									Calle Ramal del Río 19,
									<br />
									18101 Cúllar Vega, Granada
								</span>
							</div>
							<div className="flex items-center gap-4">
								<Phone className="text-energy-orange flex-shrink-0" size={20} />
								<a
									href="https://wa.me/34651707985"
									className="text-gray-300 text-sm hover:text-white transition-colors"
								>
									651 70 79 85
								</a>
							</div>
							<div className="flex items-center gap-4">
								<Clock className="text-energy-orange flex-shrink-0" size={20} />
								<span className="text-gray-300 text-sm">
									L-V: 17:00 - 21:00 | S-D: 11:00 - 21:30
								</span>
							</div>
						</div>
					</div>

					{/* Column 2: Quick Links */}
					<div>
						<h4 className="text-lg font-bold text-white mb-6 border-b border-gray-800 pb-2 inline-block">
							Accesos Rápidos
						</h4>
						<ul className="space-y-3 text-sm">
							<li>
								<a
									href="#home"
									className="text-gray-400 hover:text-neverland-green transition-colors"
								>
									Inicio
								</a>
							</li>
							<li>
								<a
									href="#packs"
									className="text-gray-400 hover:text-neverland-green transition-colors"
								>
									Packs de Cumpleaños
								</a>
							</li>
							<li>
								<a
									href="#menus"
									className="text-gray-400 hover:text-neverland-green transition-colors"
								>
									Nuestros Menús
								</a>
							</li>
							<li>
								<a
									href="#talleres"
									className="text-gray-400 hover:text-neverland-green transition-colors"
								>
									Talleres y Actividades
								</a>
							</li>
							<li>
								<a
									href="#"
									className="text-gray-400 hover:text-neverland-green transition-colors"
								>
									Política de Privacidad
								</a>
							</li>
						</ul>
					</div>

					{/* Column 3: Map */}
					<div className="h-64 md:h-full min-h-[250px] rounded-xl overflow-hidden shadow-lg border border-gray-800">
						<iframe
							src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3183.084705307524!2d-3.673891823528825!3d37.15286595191319!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd71fcb4aeb61501%3A0x629c424564c48974!2sCalle%20Ramal%20del%20R%C3%ADo%2C%2019%2C%2018101%20C%C3%BAllar%20Vega%2C%20Granada!5e0!3m2!1ses!2ses!4v1706173000000!5m2!1ses!2ses"
							width="100%"
							height="100%"
							style={{ border: 0 }}
							allowFullScreen=""
							loading="lazy"
							referrerPolicy="no-referrer-when-downgrade"
						></iframe>
					</div>
				</div>

				<div className="border-t border-gray-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
					<span className="text-gray-500 text-xs">
						© 2026 Neverland Cullar Vega. Todos los derechos reservados.
					</span>
					<div className="flex gap-4">
						<a
							href="#"
							className="text-gray-400 hover:text-energy-orange transition-colors"
						>
							<Instagram size={20} />
						</a>
						<a
							href="#"
							className="text-gray-400 hover:text-blue-500 transition-colors"
						>
							<Facebook size={20} />
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
