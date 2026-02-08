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
   • Fase 1 (El Corazón del Sistema): Implementación de la web escaparate, el motor de reservas (configurador de fecha) y un Backoffice (Panel de Administración) para gestionar el calendario, consultar datos de la reserva.
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
   • reservations: Almacenará fecha, turno, datos del cumpleañero, número de invitados y alergias/notas especiales.

• menus: utiliza la informacion del archivo "DETALLES MENU.md".
• workshops: Datos de las actividades especiales como pintacaras, slime o magia.
• settings: Configuración global, incluyendo precios del parque de bolas por hora (3€, 5€, 7€) y horarios de disponibilidad. 5. Plan para Fase 0 (Demo): Landing Page Profesional
Esta fase se centra en el impacto visual, con animaciones y la credibilidad comercial sin incluir aún la calculadora de presupuesto.
• Hero Section: Título impactante: "El cumpleaños de sus sueños empieza aquí". Subtítulo: "Reserva tu fiesta en Neverland de forma fácil y rápida". CTA claro: "Consultar Disponibilidad".

• Galeria de Imagenes: Grid dinámico con imágenes del salón de fiestas.
• Tarifas de Menús: Exposición clara de las opciones de menú (Menú 1 al 4) con sus respectivos iconos de comida (perrito, pizza, hamburguesa).
• Todos los servicios: Cumpleaños/Talleres/Parque de bolas/Cafetería.
• Sección de Talleres: Grid dinámico con imágenes de actividades como Pintacaras, slime y Magia.
• Flujo de Trabajo: Sección simple de "Cómo funciona" en 3 pasos: elige fecha, personaliza la fiesta y¡a disfrutar!.
• Ubicación y Contacto: Mapa de Google Maps integrado, dirección (Calle Ramal del Río 19) y acceso directo al WhatsApp (651707985). 6. Estructura de Archivos (Organización del Proyecto)
Siguiendo los estándares de organización observados en los repositorios de referencia, la estructura se dividirá en client y server:
/neverland-web
│
├── /web (Vite + React)
│ ├── /src
│ │ ├── /assets # Imágenes del salón y logos optimizados
│ │ ├── /components # Componentes reutilizables
│ │ │ ├── /common # Elementos UI genéricos (Botones, Modales, Inputs)
│ │ │ ├── /layout # Estructura principal (Navbar, Footer)
│ │ │ ├── /home # Componentes específicos de la Home
│ │ │ └── /booking # Componentes del flujo de reservas
│ │ ├── /pages # Vistas principales (Home, Admin, Success)
│ │ ├── /hooks # Lógica personalizada
│ │ ├── /context # Gestión de estado global
│ │ ├── App.jsx
│ │ └── main.jsx
│ ├── tailwind.config.js
│ └── package.json
│
├── /api (Node.js + Express)
│ ├── /controllers # Lógica de las rutas
│ ├── /models # Esquemas de MongoDB (Mongoose)
│ ├── /routes # Definición de Endpoints de la API
│ ├── /config # Conexión a la DB y variables de entorno
│ └── app.js
│
└── .gitignore
Esta estructura garantiza una separación de responsabilidades clara y una escalabilidad fluida hacia las fases de automatización y backoffice

📜 ESPECIFICACIONES TÉCNICAS: Fase 1

1. 📝 RESUMEN DEL PROYECTO
   Sistema de gestión de reservas para un salón de fiestas infantiles con 2 salas y parque de bolas compartido. El sistema debe permitir la autogestión del cliente y el control total por parte del administrador, sincronizando con Google Calendar.

2. 🕒 LÓGICA DE TURNOS Y HORARIOS
   Existen 3 turnos predefinidos por día. El solapamiento entre salas es gestionado manualmente por el administrador.

Turno 1 (T1): 17:00 a 19:00.

Turno 2 (T2): 18:00 a 20:00.

Turno 3 (T3): 19:15 a 21:15.

⏳ Extensiones de Horario (Coste: 30 min = 30€ | 1 h = 50€)
T1: Solo permite adelantar inicio (16:30 o 16:00).

T3: Solo permite extender finalización (21:45 o 22:15).

T2: Permite adelantar o extender (Máximo 1 hora total).

3. 💰 ALGORITMO DE PRECIOS
   Mínimo: Siempre se cobra un mínimo de 12 niños.

Menús Niños: - Tipos: 1 (9€), 2 (9€), 3 (10€), 4 (12€).

Plus Fin de Semana/Festivo: +1,50 € por niño (Viernes, Sábado, Domingo y Festivos).

Menú Adultos (Por cantidad): - Salaillas Jamón (15€), Tortilla (12€), Saladitos (16€), Pasteles (16€), Bocadillos (14€).

Extras:

Taller: +25€ (hasta 25 niños) | +30€ (26 niños o más).

Personajes: +40€ por personaje seleccionado.

Piñata: +15€.

Extensión: +30€ o +50€.

4. 🖱️ FLUJO DEL USUARIO (CLIENTE)
   Selección: Fecha y Turno (solo disponibles).

Registro: Datos niño/a, padre y teléfono.

Configuración: Cantidad niños, Menú niños, Cantidad y tipo de comida adultos.

Extras: Selección de Talleres, Personajes y Piñata.

Resumen: Visualización del Total Estimado en tiempo real y envío de solicitud.

Al enviar la solicitud se guarda en la base de datos con estado pendiente y se envía un correo electrónico al cliente con los detalles de la reserva y un enlace para editarla.

Edición: El cliente puede modificar extras y cantidades hasta 24h antes. No puede cambiar fecha ni turno (debe contactar al admin). El cliente puede cancelar la reserva y el administrador recibirá un correo electrónico con la cancelación.

5. 🛠️ PANEL DE ADMINISTRACIÓN (BACKOFFICE)

Tenemos que tener un dashboard con acceso a:
Bandeja de entrada de reservas
Vista calendario
Configuración de precios
buscador de reservas por nombre de niño/a, padre/madre o teléfono

Estados de Reserva:

(azul) Pendiente: Nueva solicitud.

🟢 Confirmada: Validada por el administrador.

🟡 Modificada: Reserva confirmada que ha sido editada por el cliente.

🔴 Cancelada: Reserva cancelada por el cliente.

Vistas:
Vista tipo bandeja de entrada: Gestión rápida de estados y filtros.

Vista Calendario (Mensual): Estilo Google Calendar mostrando los 3 turnos diarios y su estado. Al clicar en un día lleva a la vista de detalle de día.

Vista Detalle de Día: Muestra los 3 turnos con su estado y la opción de entrar en la reserva existente o turno disponible. Y opcion de bloquear el día.

Vista detalle del turno: Muestra los detalles de la reserva (si existe) y la opción de editarla o eliminarla. Si no existe la reserva, muestra la opción de bloquear el turno o crear una reserva.
Botones de editar, eliminar confirmar reserva y whatsapp.

Botón Confirmar: cambia el estado de la reserva a confirmada y redirige a WhatsApp con mensaje automático detallando reserva, desglose de servicios y precio total. (para que el admin envíe al cliente y continuen conversación si es necesario)

Botón de whatsapp: abre un chat de WhatsApp con el cliente.

6. 🔌 INTEGRACIONES TÉCNICAS
   Google Calendar API: Uso de Service Account para espejo de reservas.

WhatsApp Business/Web: Generación de mensajes dinámicos con los datos de MongoDB.

MongoDB: Colecciones para Reservas, ConfiguracionPrecios, Talleres y Personajes.

Aclaracion de vistas calendario:
A. Vista calendario del Cliente (Simplicidad)
El cliente solo necesita saber si puede reservar o no.

Disponible (Verde): No hay reserva en MongoDB ni evento en Google Calendar para ese slot.

Ocupado (Gris): Ya existe una reserva (en cualquier estado) o hay un evento/taller en Google Calendar.

B. Vista calendario del Administrador (Control Total)
Aquí el sistema debe diferenciar el origen del bloqueo:

Sin reservar (Blanco): Hueco totalmente libre.

Pendiente (Azul): Reserva en MongoDB con estado: 'Pendiente'.

Confirmado (Verde): Reserva en MongoDB con estado: 'Confirmado'.

Modificada (Amarillo): Reserva en MongoDB con estado: 'Modificada'.

Cancelada (Rojo): Reserva en MongoDB con estado: 'Cancelada'.

Ocupado por otra cosa (Violeta): Existe un evento en Google Calendar que no fue creado por la App (ej: el dueño apuntó una cafetería o un taller manual).

Bloqueado (Gris Oscuro): El dueño ha pulsado "Bloquear turno" en la App (se crea un registro en MongoDB tipo bloqueo).

Estructura de datos:
Colección: Eventos (La base de todo)
Esta colección centraliza tanto las reservas de clientes como los bloqueos manuales del administrador.

{
\_id: ObjectId,
tipo: { type: String, enum: ['reserva', 'bloqueo'], required: true },
estado: {
type: String,
enum: ['pendiente', 'confirmado', 'modificada'],
default: 'pendiente'
},
fecha: { type: Date, required: true }, // Almacenar sin hora (YYYY-MM-DD)
turno: { type: String, enum: ['T1', 'T2', 'T3'], required: true },

// Datos de contacto (solo si tipo: 'reserva')
cliente: {
nombreNiño: String,
nombrePadre: String,
telefono: String
},

// Configuración del evento
detalles: {
niños: {
cantidad: { type: Number, min: 12 }, // El mínimo se valida en el frontend/api
menuId: Number // 1, 2, 3 o 4
},
adultos: [
{
item: String, // 'Salaillas', 'Tortilla', etc.
cantidad: Number,
precioUnitario: Number
}
],
extras: {
taller: { type: String, default: 'ninguno' },
personaje: { type: String, default: 'ninguno' },
pinata: { type: Boolean, default: false }
}
},

// Lógica de Tiempos
horario: {
inicio: String, // Ej: "16:30"
fin: String, // Ej: "19:00"
extensionMinutos: { type: Number, enum: [0, 30, 60], default: 0 },
costoExtension: Number // 0, 30 o 50
},

// Finanzas y Sincronización
precioTotal: Number,
googleEventId: String, // ID devuelto por Google Calendar API
notasAdmin: String, // Para uso interno del salón
createdAt: Date
}

2. Colección: Configuracion (Para que el Admin cambie precios) (FASE 2)
   Para no "quemar" los precios en el código, los guardamos aquí. Así, si el dueño sube el precio de la tortilla, solo lo cambia en la DB.

{
preciosNiños: {
1: 9,
2: 9,
3: 10,
4: 12,
plusFinDeSemana: 1.5
},
preciosAdultos: [
{ nombre: "Salaillas con Jamón", precio: 15, unidades: 10 },
{ nombre: "Tortilla de patatas", precio: 12, unidades: 1 },
{ nombre: "Saladitos", precio: 16, unidades: 45 },
{ nombre: "Pasteles", precio: 16, unidades: 25 },
{ nombre: "Bocadillos", precio: 14, unidades: 12 }
],
preciosExtras: {
tallerBase: 25, // Hasta 25 niños
tallerPlus: 30, // 26 o más
personaje: 40,
pinata: 15,
extension30: 30,
extension60: 50
}
}

3. Colección: Talleres (Para la API de Google)
   Aquí guardamos los datos que necesita Google para crear el evento en el calendario.

{
\_id: ObjectId,
nombre: String, // Ej: "Taller de Slime"
duracionMinutos: Number, // Ej: 60
descripcion: String, // Para mostrar en el tooltip del calendario
capacidadMaxima: Number, // Ej: 15
precio: Number, // Ej: 25
requiereExtension: Boolean, // Si este taller ocupa todo el turno
diasHabilitados: [String] // Ej: ["Lunes", "Martes"] o [] para todos
}

Lista de Personajes:
Mickey
Minnie
Goofy
Donald
Daysi
Sonic
Stich
Marshall
Sky
Mario
Luigi
Bella
Bestia
Cenicienta
Príncipe
Aladín
Jasmín
Blancanieves
Elsa
Anna
Olaf
K-Pop
Vaina
