# 🏗️ Arquitectura y Modelos de Datos

## 1. Arquitectura General del Sistema

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

## 2. Modelos de Datos (Estructura Detallada)

### Colección: `Events`

Centraliza tanto la actividad comercial como el control de disponibilidad.

#### Esquema Completo (v1.7)
```javascript
{
  tipo: String,          // "reserva" | "bloqueo"
  estado: String,        // "pendiente" | "confirmado" | "modificada" | "cancelada"
  fecha: Date,           // Normalizado a las 00:00 UTC
  turno: String,         // "T1" | "T2" | "T3"
  cliente: {
    nombreNiño: String,
    edadNiño: Number,
    nombrePadre: String,
    telefono: String,
    email: String,
    privacyPolicyConsent: Boolean, // Consentimiento obligatorio (RGPD)
    marketingConsent: Boolean,     // Consentimiento comercial opcional
    fechaConsentimiento: Date      // Marca de tiempo del consentimiento
  },
  detalles: {
    niños: {
      cantidad: Number,
      menuId: String,
      menuNombre: String,     // Snapshot del nombre del menú (v1.9)
      precioApplied: Number
    },
    adultos: {
      cantidad: Number,
      comida: [
        {
          item: String,
          cantidad: Number,
          precioUnitario: Number
        }
      ]
    },
    extras: {
      taller: String,
      precioTallerApplied: Number,
      personaje: String,
      precioPersonajeApplied: Number,
      pinata: Boolean,
      precioPinataApplied: Number,
      observaciones: String,
      alergenos: String,
      costoExtra: Number         // Ajuste manual de precio (Admin)
    }
  },
  horario: {
    inicio: String,
    fin: String,
    extensionMinutos: Number,
    costoExtension: Number
  },
  precioTotal: Number,
  publicId: String,          // URL corta para acceso (6 chars)
  invitationId: String,      // ID único para invitación (8 chars)
  googleEventId: String,
  notasAdmin: String
}
```

### Colección: `Configs`

Almacena la configuración global comercial (precios, menús, raciones). Existe un **único documento** en esta colección.

#### Esquema Completo
```javascript
{
  menusNiños: [
    {
      id: Mixed,          // ID numérico (legacy) o String (MongoDB)
      nombre: String,
      precio: Number,
      principal: String,  // Plato principal
      resto: String,      // Acompañamientos/Bebida
      imageUrl: String,   // URL de Cloudinary
      suspended: Boolean, // Pausado temporalmente (no aparece en Booking)
      active: Boolean     // Borrado lógico (no aparece en Admin)
    }
  ],
  plusFinDeSemana: Number, // Recargo Vie-Dom por niño
  preciosAdultos: [
    {
      id: String,
      nombre: String,
      precio: Number,
      unidades: String,   // Ej: "10 unidades"
      imageUrl: String,
      suspended: Boolean,
      active: Boolean
    }
  ],
  workshops: [
    {
      id: String,
      name: String,
      priceBase: Number,  // Precio < 15 niños
      pricePlus: Number,  // Precio >= 15 niños
      desc: String,
      imageUrl: String,
      suspended: Boolean,
      active: Boolean
    }
  ],
  characters: [
    {
      id: String,
      name: String,
      imageUrl: String,
      suspended: Boolean,
      active: Boolean
    }
  ],
  preciosExtras: {
    tallerBase: Number,
    tallerPlus: Number,
    personaje: Number,
    pinata: Number,
    extension30: Number,
    extension60: Number
  }
}
```
