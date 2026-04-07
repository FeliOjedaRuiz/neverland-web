# ALMANAQUE TÉCNICO: PROYECTO NEVERLAND 🎠

## 1. El Propósito (Ground Truth)
Neverland es el motor digital de un salón de fiestas infantiles físico. Su misión es eliminar el error humano en las reservas y ofrecer una experiencia mágica de autogestión para los padres.

## 2. Stack Tecnológico (MERN)
- **Base de Datos**: MongoDB (Atlas) - Gestión de eventos, usuarios y configuraciones.
- **Backend**: Node.js + Express - Lógica de negocio pesada, cálculo de presupuestos y sincronización.
- **Frontend**: React (Vite) - Interfaz Mobile-First, enfocada en UX fluida.
- **Infraestructura**: PWA (Service Workers para modo offline y notificaciones push).

## 3. Reglas de Oro del Negocio
- **Semaforización de Salones**: Gestión estricta de 3 turnos (T1, T2, T3) en 2 salas físicas.
- **Espejo de Google Calendar**: La disponibilidad real se valida contra Calendar para evitar solapamientos.
- **Cálculo Dinámico**: Los precios no están hardcodeados; dependen de una configuración en BD (Niños mínimos, extras, suplementos de finde).

## 4. Estado Actual de la Misión
- **Backoffice**: Implementado para administración de reservas.
- **PWA**: Configurada y en proceso de pulir notificaciones push.
- **SEO/Accesibilidad**: En fase de optimización para posicionamiento local.

---
> [!WARNING]
> **CONFIGURACIÓN CRÍTICA**: No intentes deducir ni buscar archivos `.env`. Las variables de entorno son privadas y están protegidas.
