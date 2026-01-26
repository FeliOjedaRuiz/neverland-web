Este documento constituye el Plan Maestro de Desarrollo para Neverland, diseñado para guiar al agente de IA (Antigravity) en la creación de una solución integral de gestión y presencia digital para el parque de bolas y salón de fiestas.
1. Stack Tecnológico Obligatorio
El proyecto se desarrollará estrictamente bajo el stack MERN, priorizando la velocidad de carga y la facilidad de mantenimiento:
• Frontend: React.js utilizando Vite para un entorno de desarrollo ultra rápido.
• Estilos: Tailwind CSS para un diseño responsivo y moderno.
• Backend: Node.js con Express para la gestión de APIs.
• Base de Datos: MongoDB para una arquitectura de datos flexible.
• Iconografía: Lucide-react para mantener una estética limpia y profesional.
• Animaciones: tailwind-animations (https://tailwind-animations.com/)
• Lenguaje: JavaScript puro (no se permite el uso de TypeScript por requerimiento del proyecto).
2. Visión y Fases de Desarrollo
El objetivo es transformar la web de Neverland en un Centro de Operaciones que trabaje las 24 horas.
• Fase 0 (Demo): Creación de una Landing Page profesional de alto impacto visual para generar confianza inmediata y presentar la oferta comercial.
• Fase 1 (El Corazón del Sistema): Implementación de la web escaparate, el motor de reservas (configurador de fecha y packs) y un Backoffice (Panel de Administración) para gestionar el calendario, consultar datos de la reserva.
• Fase 2 (UX y Contenidos Dinámicos): Módulo de invitaciones digitales personalizadas con GPS y cuenta atrás, gestor de eventos/talleres y personalización de tarifas en tiempo real.
• Fase 3 (Automatización): Integración de un Chatbot de flujo para WhatsApp y Web que filtre consultas frecuentes y derive a los clientes al formulario de reserva.
3. Guía de Estilo y Diseño
La estética debe ser moderna y lúdica pero con un acabado profesional.
• Enfoque: Mobile-First obligatorio para garantizar que los padres puedan navegar cómodamente desde sus celulares.
• Colores: Utiliza la paleta de colores definida en el archivo "PALETA DE COLORES.md".
• Tipografía: Fuentes redondeadas y amigables, reforzando el tono infantil y acogedor del salón.
4. Arquitectura de Datos (Propuesta MongoDB)
Se proponen las siguientes colecciones para estructurar la información en el backend:
• users: Para la gestión de acceso al panel de administración.
• reservations: Almacenará fecha, turno, pack elegido, datos del cumpleañero, número de invitados y alergias/notas especiales.
• packs: Detalle de los servicios con sus respectivos "precios desde" y listas de ítems incluidos.
• menus: utiliza la informacion del archivo "DETALLES MENU.md".
• workshops: Datos de las actividades especiales como pintacaras, slime o magia.
• settings: Configuración global, incluyendo precios del parque de bolas por hora (3€, 5€, 7€) y horarios de disponibilidad.
5. Plan para Fase 0 (Demo): Landing Page Profesional
Esta fase se centra en el impacto visual, con animaciones y la credibilidad comercial sin incluir aún la calculadora de presupuesto.
• Hero Section: Título impactante: "El cumpleaños de sus sueños empieza aquí". Subtítulo: "Reserva tu fiesta en Neverland de forma fácil y rápida". CTA claro: "Consultar Disponibilidad".
• Packs cumpleaños: Presentación de 3 tarjetas visuales (Básico, Premium, VIP) con check-list de servicios.
• Galeria de Imagenes: Grid dinámico con imágenes del salón de fiestas.
• Tarifas de Menús: Exposición clara de las opciones de menú (Menú 1 al 4) con sus respectivos iconos de comida (perrito, pizza, hamburguesa).
• Todos los servicios: Cumpleaños/Talleres/Parque de bolas/Cafetería.
• Sección de Talleres: Grid dinámico con imágenes de actividades como Pintacaras, slime y Magia.
• Flujo de Trabajo: Sección simple de "Cómo funciona" en 3 pasos: elige fecha, personaliza pack y ¡a disfrutar!.
• Ubicación y Contacto: Mapa de Google Maps integrado, dirección (Calle Ramal del Río 19) y acceso directo al WhatsApp (651707985).
6. Estructura de Archivos (Organización del Proyecto)
Siguiendo los estándares de organización observados en los repositorios de referencia, la estructura se dividirá en client y server:
/neverland-web
│
├── /web (Vite + React)
│   ├── /src
│   │   ├── /assets         # Imágenes del salón y logos optimizados
│   │   ├── /components     # Componentes reutilizables (Navbar, Footer, Cards)
│   │   ├── /pages          # Vistas principales (Home, Admin, Success)
│   │   ├── /hooks          # Lógica personalizada
│   │   ├── /context        # Gestión de estado global
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── package.json
│
├── /api (Node.js + Express)
│   ├── /controllers    # Lógica de las rutas
│   ├── /models         # Esquemas de MongoDB (Mongoose)
│   ├── /routes         # Definición de Endpoints de la API
│   ├── /config         # Conexión a la DB y variables de entorno
│   └── app.js
│
└── .gitignore
Esta estructura garantiza una separación de responsabilidades clara y una escalabilidad fluida hacia las fases de automatización y backoffice