# 🏰 Análisis Técnico e Integral - Proyecto Neverland

Este documento detalla la estructura, lógica y arquitectura del ecosistema Neverland, incluyendo tanto el flujo del cliente como el panel de administración.

---

## 1. 🏗️ Arquitectura General del Sistema

El proyecto sigue un stack **MERN** (MongoDB, Express, React, Node.js) con un enfoque **Mobile-First**.

### Estructura de Carpetas

- **`/api`**: Backend en Node.js/Express.
  - `/models`: Esquemas de Mongoose (Datos persistentes).
  - `/controllers`: Lógica de negocio (Cálculos, validaciones).
  - `/services`: Integraciones externas (Google Calendar).
- **`/web`**: Frontend en React.js con Vite.
  - `/src/components/booking`: Flujo secuencial de reserva para el cliente (8 pasos).
  - `/src/components/admin`: Panel de control, calendario y configuración.
  - `/src/services`: Llamadas a la API centralizadas.

---

## 2. 📊 Modelos de Datos (Estructura Detallada)

### Colección: `Events`

Es el núcleo del sistema. Centraliza tanto la actividad comercial como el control de disponibilidad del salón.

#### Esquema Completo

```javascript
{
  tipo: String,          // "reserva" | "bloqueo"
  estado: String,        // "pendiente" | "confirmado" | "modificada" | "cancelada"
  fecha: Date,           // Normalizado a las 00:00 UTC para evitar desfases
  turno: String,         // "T1" | "T2" | "T3"
  cliente: {
    nombreNiño: String,
    edadNiño: Number,
    nombrePadre: String,
    telefono: String,
    email: String
  },
  detalles: {
    niños: {
      cantidad: Number,
      menuId: String,            // ID del menú seleccionado
      precioApplied: Number      // Snapshot del precio del menú por niño
    },
    adultos: {
      cantidad: Number,
      comida: [
        {
          item: String,          // Nombre de la ración (ej: "Tortilla")
          cantidad: Number,
          precioUnitario: Number // Snapshot del precio de la ración
        }
      ]
    },
    extras: {
      taller: String,            // "ninguno" o nombre del taller
      precioTallerApplied: Number,
      personaje: String,         // "ninguno" o nombre del personaje
      precioPersonajeApplied: Number,
      pinata: Boolean,
      precioPinataApplied: Number,
      observaciones: String,     // Notas generales añadidas por el usuario o administrador
      alergenos: String          // Notas específicas sobre alergias o intolerancias alimentarias
    }
  },
  horario: {
    inicio: String,              // Ej: "17:30"
    fin: String,                 // Ej: "20:30"
    extensionMinutos: Number,    // 0 | 30 | 60
    costoExtension: Number       // Snapshot del coste (30€ o 50€)
  },
  precioTotal: Number,           // Resultado final del cálculo seguro en backend
  publicId: String,              // Código alfanumérico de 6 cifras (ej: "A8B3C2")
  googleEventId: String,         // Vinculación con Google Calendar
  notasAdmin: String
}
```

#### Ejemplo 1: Reserva de Cumpleaños (Tipo `reserva`)

```json
{
	"publicId": "BIMBO7",
	"tipo": "reserva",
	"estado": "confirmado",
	"fecha": "2026-03-04T00:00:00.000Z",
	"turno": "T2",
	"cliente": {
		"nombreNiño": "Bimbo",
		"edadNiño": 5,
		"nombrePadre": "Papá Bimbo",
		"telefono": "654321098",
		"email": "bimbo@example.com"
	},
	"detalles": {
		"niños": { "cantidad": 15, "menuId": "4", "precioApplied": 12 },
		"adultos": {
			"cantidad": 10,
			"comida": [
				{ "item": "Tortilla de patatas", "cantidad": 2, "precioUnitario": 12 }
			]
		},
		"extras": {
			"taller": "Magia",
			"precioTallerApplied": 30,
			"personaje": "Mickey",
			"precioPersonajeApplied": 40,
			"pinata": true,
			"precioPinataApplied": 15,
			"observaciones": "Cumpleañero vestido de pirata",
			"alergenos": "Un niño con alergia al huevo"
		}
	},
	"horario": {
		"inicio": "17:30",
		"fin": "20:30",
		"extensionMinutos": 60,
		"costoExtension": 50
	},
	"precioTotal": 339
}
```

#### Ejemplo 2: Bloqueo de Tarde (Tipo `bloqueo`)

```json
{
	"tipo": "bloqueo",
	"estado": "confirmado",
	"fecha": "2026-03-05T00:00:00.000Z",
	"turno": "T1",
	"horario": { "inicio": "17:00", "fin": "19:00", "extensionMinutos": 0 },
	"notasAdmin": "Limpieza general del salón / Mantenimiento parque de bolas"
}
```

---

### Colección: `Configs`

Almacena la configuración global comercial. Existe un **único documento** en esta colección que el sistema consulta para obtener los precios vigentes y las opciones disponibles.

#### Datos Actuales (Estado Real de la Base de Datos)

```json
{
	"id": "698b91f5d2dbcdf763d96cc9",
	"menusNiños": [
		{
			"id": "699397b24eb2caf3abf67a54",
			"nombre": "Menú 1",
			"precio": 9,
			"principal": "Sandwiches ( 2 1/2 ) dulce o salado",
			"resto": "-Zumo, batido o refresco\n-Tarta\n-Cono de chuches"
		},
		{
			"id": "699397b24eb2caf3abf67a55",
			"nombre": "Menú 2",
			"precio": 9,
			"principal": "Perrito caliente",
			"resto": "-Zumo, batido o refresco\n-Tarta\n-Cono de chuches"
		},
		{
			"id": "699397b24eb2caf3abf67a56",
			"nombre": "Menú 3",
			"precio": 10,
			"principal": "Porción de pizza",
			"resto": "-Zumo, batido o refresco\n-Tarta\n-Cono de chuches"
		},
		{
			"id": "699397b24eb2caf3abf67a57",
			"nombre": "Menú 4",
			"precio": 12,
			"principal": "Hamburguesa",
			"resto": "-Zumo, batido o refresco\n-Tarta\n-Cono de chuches"
		}
	],
	"plusFinDeSemana": 1.5,
	"preciosAdultos": [
		{
			"id": "699397b24eb2caf3abf67a4a",
			"nombre": "Croquetas",
			"precio": 15,
			"unidades": "12 unidades"
		},
		{
			"id": "699397b24eb2caf3abf67a4b",
			"nombre": "Salaillas con Jamón",
			"precio": 14,
			"unidades": "10 Unidades"
		},
		{
			"id": "699397b24eb2caf3abf67a4c",
			"nombre": "Tortilla de Patatas",
			"precio": 12,
			"unidades": "1 Unidad"
		},
		{
			"id": "699397b24eb2caf3abf67a4d",
			"nombre": "Saladitos Variados",
			"precio": 16,
			"unidades": "45 Unidades"
		},
		{
			"id": "699397b24eb2caf3abf67a4e",
			"nombre": "Pasteles Surtidos",
			"precio": 16,
			"unidades": "25 Unidades"
		},
		{
			"id": "699397b24eb2caf3abf67a4f",
			"nombre": "Bocadillos",
			"precio": 14,
			"unidades": "12 Unidades"
		}
	],
	"workshops": [
		{
			"id": "699397b24eb2caf3abf67a50",
			"name": "Pintacaras",
			"priceBase": 25,
			"pricePlus": 30,
			"desc": "Maquillaje de fantasía arcoiris para todos."
		},
		{
			"id": "699397b24eb2caf3abf67a51",
			"name": "Taller de Slime",
			"priceBase": 25,
			"pricePlus": 30,
			"desc": "¡Creación de slime pegajoso y divertido!"
		},
		{
			"id": "699397b24eb2caf3abf67a52",
			"name": "Show de Magia",
			"priceBase": 25,
			"pricePlus": 30,
			"desc": "Trucos increíbles para sorprender."
		},
		{
			"id": "699397b24eb2caf3abf67a53",
			"name": "Spa de Princesas",
			"priceBase": 25,
			"pricePlus": 30,
			"desc": "¡Un momento de relax para nuestras princesitas!"
		},
		{
			"id": "6994d2fa9544d7ece264a68e",
			"name": "Taller de Princesas",
			"priceBase": 25,
			"pricePlus": 30,
			"desc": "¡Vive un cuento de hadas! Disfraces, coronas y maquillaje mágico."
		}
	],
	"characters": [
		"Mickey",
		"Minnie",
		"Goofy",
		"Donald",
		"Daysi",
		"Sonic",
		"Stich",
		"Marshall",
		"Sky",
		"Mario",
		"Luigi",
		"Bella",
		"Bestia",
		"Cenicienta",
		"Príncipe",
		"Aladín",
		"Jasmín",
		"Blancanieves",
		"Elsa",
		"Anna",
		"Olaf",
		"K-Pop",
		"Vaina"
	],
	"preciosExtras": {
		"tallerBase": 25,
		"tallerPlus": 30,
		"personaje": 40,
		"pinata": 15,
		"extension30": 30,
		"extension60": 50
	}
}
```

---

## 3. 🧠 Lógica de Negocio y Algoritmos

### 🕒 Gestión de Turnos y Tiempos

Existen 3 turnos base:

- **T1**: 17:00 - 19:00 (Solo permite adelantar inicio).
- **T2**: 18:00 - 20:00 (Permite adelantar o extender).
- **T3**: 19:15 - 21:15 (Solo permite extender fin).

**Extensiones**:

- 30 min (+30€) | 60 min (+50€).
- La lógica calcula la `horaFinalEstimada` sumando la extensión al turno base.

### 💰 Algoritmo de Precios (`calculateEventPrice`)

1.  **Mínimo**: Siempre se calcula en base a un mínimo de 12 niños.
2.  **Niños**: `Precio Menú x Cantidad`.
3.  **Plus Fin de Semana**: Se añaden +1.50€ por niño si es Viernes, Sábado o Domingo.
4.  **Adultos**: Suma de raciones seleccionadas (`Precio Ración x Cantidad`).
5.  **Extras**:
    - Taller: Precio base o plus (si hay ≥15 niños).
    - Personajes: Precio fijo por cada uno.
    - Piñata: Precio fijo.
6.  **Extensiones**: Se suma el costo de 30 o 60 min según el `horario`.

---

## 4. 🖱️ Flujo del Cliente (Booking)

El cliente atraviesa un proceso de 8 pasos diseñado para la conversión:

1.  **Fecha y Turno**: Calendario que consulta disponibilidad en tiempo real (DB + Google Calendar).
2.  **Responsable**: Datos del padre/madre (Teléfono y Email obligatorios).
3.  **Niño/a y Menú**: Nombre, edad, elección del menú infantil y advertencias de alérgenos/intolerancias.
4.  **Adultos**: Cantidad de adultos y selección de raciones de comida.
5.  **Talleres**: Selección de actividad especial (Magia, Slime, etc.).
6.  **Personajes**: Buscador de personajes favoritos.
7.  **Extras**: Selección de piñata y extensiones de tiempo.
8.  **Resumen**: Desglose visual de todos los costos antes de confirmar.

---

## 5. 🛠️ Panel de Administración (Backoffice)

### Vistas Principales

- **Bandeja de Entrada**: Lista de reservas filtrable con estados de color.
- **Vista Calendario**: Calendario mensual con códigos de colores por estado de reserva.
- **Detalle de Día/Turno**: Vista profunda para gestionar cada slot, permitiendo confirmar, editar o bloquear turnos manualmente.
- **Configuración**: Interfaz para actualizar precios de menús, extras y raciones de adultos sin tocar el código.

---

## 6. 🔌 Integraciones y Sincronización

### 📅 Google Calendar API (Sincronización Bidireccional)

El sistema utiliza Google Calendar como espejo para la gestión de disponibilidad y como herramienta de visualización para el personal del salón.

#### Configuración Técnica

- **Autenticación**: Se realiza mediante una **Service Account** (Cuenta de Servicio). Requiere el archivo `api/google-credentials.json` en el servidor.
- **Identificador de Calendario**: Definido por la variable de entorno `GOOGLE_CALENDAR_ID` (por defecto usa el calendario 'primary' de la cuenta de servicio).
- **Zona Horaria**: Forzada a `Europe/Madrid` para garantizar que los eventos coincidan con el horario local del salón.

#### Flujo de Sincronización

1.  **Creación de Reserva**: Al guardar una reserva en la base de datos, se genera un evento en Google Calendar. El `id` devuelto por Google se almacena en el campo `googleEventId` del modelo `Event` para poder editarlo o cancelarlo después.
2.  **Metadatos (Extended Properties)**: Cada evento enviado a Google lleva etiquetas privadas:
    - `source`: "neverland" (Para distinguir eventos de la app de eventos personales).
    - `bookingId`: El ID de la base de datos.
    - `turno`: El turno asignado (T1, T2, T3).
3.  **Consulta de Disponibilidad**: Antes de mostrar días libres al cliente, el sistema consulta:
    - La base de datos local (MongoDB).
    - La API de Google Calendar buscando eventos en el rango de fechas.

#### Lógica de Bloqueo de Slots

- **Estratificación**: Un slot (Día/Turno) solo se marca como ocupado si existe una reserva confirmada en la DB **O** un evento en Google Calendar con la propiedad `source: neverland`. -_ **Bloqueos Manuales Externos (Modo Emergencia)**:
  Si el administrador no tiene acceso a la App, puede bloquear turnos directamente desde Google Calendar (App móvil de Google) usando palabras clave en el **título** del evento:
  _ **Bloqueo de Turno Específico**: Incluir `#T1`, `#T2` o `#T3` en el título. (Ej: "Mantenimiento #T1"). Esto bloquea **solo** ese turno.
  _ **Bloqueo por Horario**: Incluir `#BLOQUEO` o `#NEVERLAND`. El sistema bloqueará cualquier turno que se solape con las horas del evento de Google.
  _ **Bloqueo de Día Completo**: Crear un evento de "Todo el día". Bloquea los 3 turnos automáticamente. \* **Eventos Personales**: Cualquier otro evento sin estas palabras clave será ignorado por la App.

#### ⚠️ Advertencias Críticas (Para el Cliente)

La App y Google Calendar mantienen una relación de **Maestro-Espejo**:

- **Maestro (App)**: Es la fuente de la verdad. Cualquier cambio de fecha, hora o cancelación **DEBE** realizarse desde el Panel de Administración de Neverland.
- **Espejo (Google)**: Refleja lo que ocurre en la App.
- **Peligro de Edición Manual**: Si mueves una reserva directamente en Google Calendar arrastrando el evento:
  1.  La App **no se enterará** del cambio en su base de datos.
  2.  Se generará un "Falso Ocupado": Tanto la fecha antigua como la nueva aparecerán bloqueadas en la web, reduciendo tus posibilidades de venta.
- **Recomendación**: Usar Google Calendar para consulta, pero nunca para modificar datos de reservas existentes.

---

### 💬 WhatsApp Business Integration

- **Generación de Mensajes**: El sistema construye URLs de WhatsApp dinámicas (`wa.me`) que incluyen:
  - El desglose de la reserva (ID, Fecha, Niño/a, Total).
  - Enlace directo al número configurado en el sistema (+34 651 70 79 85).
- **Confirmación Automática**: Al finalizar el flujo de reserva, se ofrece al cliente un botón de "Avisar por WhatsApp" para acelerar la validación manual por parte del salón.

---

## 7. ⚠️ Análisis de Inconsistencias y Puntos de Falla (Reparados/Bajo Observación)

Durante el desarrollo se identificaron y corrigieron los siguientes puntos críticos que causaban "roturas":

1.  **Desajuste de Precios Snapshot**: Antes, si el dueño cambiaba un precio en `Config`, las reservas viejas cambiaban de precio solas. **Solución**: Se implementaron campos `Applied` que guardan el precio fijo en el momento de la reserva.
2.  **Horarios de Turnos**: El dashboard mostraba horarios genéricos. **Solución**: Ahora el backend guarda el `inicio` y `fin` real calculado según la extensión.
3.  **Formatos de Datos de Adultos**: Había discrepancia entre si la comida era un Objeto o un Array. **Solución**: Se estandarizó a un Array de objetos con `precioUnitario` persistente.
4.  **Plus de Fin de Semana**: Se calculaba a veces sobre días laborables debido a zonas horarias. **Solución**: Normalización de fechas a medianoche local antes de validar el día de la semana.

---

## 8. 🔐 Seguridad y Accesos

### Gestión de Autenticación (JWT)

El acceso al panel de administración está protegido mediante un sistema de tokens **JSON Web Tokens (JWT)**.

- **Duración de Sesión**: Configurada por defecto en **1 hora** (`MAX_SESSION_TIME=3600`). Si el administrador deja el panel abierto más de este tiempo, el sistema lo expulsará automáticamente al intentar realizar una nueva acción, redirigiéndolo a `/admin/login`.
- **Almacenamiento**: El token se guarda en el `localStorage` del navegador y se adjunta a cada petición mediante un interceptor de Axios.

### Niveles de Acceso (Middlewares)

El API implementa niveles de protección claros:

1.  **Público**: Rutas como creación de reservas (`POST /events`) y consulta de disponibilidad.
2.  **Solo Admin**: Rutas críticas protegidas con el middleware `isAdmin`. Incluye el listado de reservas, edición/borrado de eventos y configuración de precios.

### Puntos de Mejora Identificados

- **Privacidad**: La ruta de detalle de reserva es pública. Se recomienda restringirla solo a administradores para proteger los datos de contacto del cliente.
- **Rate Limiting**: Existe un límite de **150 peticiones cada 15 minutos** por IP para proteger el sistema contra ataques de fuerza bruta.

---

## 9. 📱 UX/UI y Rendimiento (Mobile-First)

### Disponibilidad y Carga

- **Carga Mes a Mes**: El calendario consulta la disponibilidad de forma dinámica para asegurar velocidad en conexiones móviles.
- **Feedback Visual**: Se utilizan indicadores de carga para evitar el "doble clic" accidental durante la reserva.

### Observaciones y Mejoras en Proceso

- **Campos de Observaciones y Alérgenos**: Se han implementado con éxito campos específicos de texto libre para recopilar "Notas del Cliente" (peticiones especiales) y "Alérgenos/Intolerancias" de forma independiente para mayor seguridad y claridad comercial.
- **Mensaje de WhatsApp**: Se planea enriquecer el mensaje automático con detalles de ubicación (Google Maps).

---

## 10. 🛠️ Robustez y Control de Errores

### Manejo de Errores

- **Failsafe de Google**: Si el calendario de Google no responde, la reserva se guarda igualmente en la base de datos para no perder la venta.
- **Páginas de Error**: Se requiere implementar páginas 404 y 500 con la estética de Neverland para mejorar la experiencia ante fallos.

---

_Este informe representa la versión estable actual (v1.6) del sistema Neverland._
