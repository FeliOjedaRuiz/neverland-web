# 🏰 Documentación Integral - Proyecto Neverland

Este documento sirve como punto de entrada a la especificación técnica y funcional del ecosistema Neverland. La documentación ha sido subdividida para facilitar su consulta y gestión.

---

## 🏛️ Guía de Documentación

### [1. Arquitectura y Modelos](technical/architecture_models.md)
Estructura de carpetas, esquemas de base de datos (MongoDB) y definición de tipos de eventos y configuraciones.

### [2. Lógica de Negocio y Precios](technical/business_logic.md)
Algoritmos de cálculo de precios, gestión de turnos, extensiones de tiempo y plus de fin de semana.

### [3. Integraciones Externas](technical/integrations.md)
Sincronización con Google Calendar (Service Account), envío de notificaciones por WhatsApp y lógica de disponibilidad.

### [4. Identidad y Sistema de Diseño](design/branding_ui.md)
Paleta de colores oficial, tipografías (Fredoka/Nunito) y guía de componentes UI.

### [5. Flujos de Usuario e Interfaz](features/client_admin_flows.md)
Detalle del flujo de reserva (Booking) paso a paso, Panel de Administración (Backoffice) y experiencia de usuario móvil.

### [6. Seguridad y Mantenimiento](maintenance/security_fixes_refactors.md)
Gestión de accesos, histórico de errores reparados y registro de refactorizaciones (RGPD).

### [7. Sistema de Despliegue (Ship)](maintenance/deployment.md)
Proceso de despliegue seguro (`npm run ship`), integración continua con Vercel/Render y validación de tests.

---

## 🚀 Estado del Sistema
- **Versión Actual**: v1.7 (Marzo 2026)
- **Stack**: Node.js, Express, MongoDB Atlas, React (Vite).
- **Última Mejora**: Refactorización de consentimientos legales integrada en el objeto cliente y limpieza de código basura.

---
_Para realizar cambios en la lógica o el esquema, favor de consultar el documento técnico correspondiente._
