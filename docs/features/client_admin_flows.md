# 🖱️ Flujos de Usuario e Interfaz

## 1. Flujo del Cliente (Booking)

Proceso de 8 pasos optimizado para conversión:
1. **Fecha y Turno**: Calendario dinámico.
2. **Responsable**: Contacto del cliente.
3. **Niño/a y Menú**: Selección infantil y alérgenos.
4. **Adultos**: Selección de raciones.
5. **Talleres**: Selección visual en cuadrícula con modales informativos detallados.
6. **Personajes**: Buscador y catálogo visual (Grid 2 col) con detalles de duración (30 min).
7. **Extras**: Piñata y extensiones.
8. **Resumen y Consentimiento**: Modal RGPD modular (v1.7) con firmas legales y comerciales.

## 2. Panel de Administración (Backoffice)

- **Bandeja de Entrada**: Gestión de estados (Pendiente, Confirmado, Cancelado).
- **Vista Calendario**: Visualización visual del mes.
- **Detalle de Día/Turno**: Sistema de modales personalizados (Framer Motion) para bloqueos rápidos.
- **Configuración**: Edición de precios y catálogos en vivo.

## 3. Experiencia de Usuario (UX)

- **Mobile-First Real**: Interfaz adaptada a dispositivos móviles con especial atención a resoluciones bajas (Moto G4+) mediante modales ultra-responsivos y limitación de altura de imágenes dinámicas.
- **Sistema de Modales Premium**: Uso de `framer-motion` y `window.history` para una navegación nativa y fluida, permitiendo cerrar modales con el botón de retroceso del dispositivo.
- **Mi Reserva**: Link único para consulta de estado por parte del cliente.
- **Add to Calendar**: Botón para que el cliente agende su reserva en su calendario personal.
- **Límites de Seguridad**: Validaciones de máximos (Niños: 50, Adultos: 40) para proteger el layout y la operatividad.

## 4. Página Pública de Precios (`/precios`)

Diseñada para facilitar la consulta rápida sin iniciar un flujo de reserva:
- **Sincronización Total**: Consume los mismos datos de la API que el flujo de reservas, garantizando que el usuario siempre vea los precios vigentes.
- **Visualización Detallada**: Incluye catálogo visual de raciones de adultos, talleres y personajes con modales de imagen ampliada.
- **Teaser en Home**: Sección de acceso rápido que reemplaza el catálogo estático anterior, reduciendo la carga cognitiva y mejorando el CTR hacia la página detallada.
- **Banner de Duración Base**: Notificación contextual sobre la duración de 2h de los eventos, dando sentido a las opciones de tiempo extra.

## 5. Aplicación Web Progresiva (PWA)

El sistema Neverland ha sido transformado en una PWA nativa para mejorar la recurrencia:
- **Instalabilidad**: Botón personalizado en el Panel de Admin y meta-tags para iOS/Android.
- **Iconografía Acolchada**: Uso de `pwa-icon.svg` con márgenes de seguridad para evitar cortes en sistemas de máscara (Android Adaptive Icons).
- **Acceso Directo Admin**: Lógica de redirección inteligente (`/?pwa=1`) que lleva a los administradores directamente al panel si ya están logueados.
- **App Shortcuts**: Menús rápidos al mantener pulsado el icono (Administración, Reservas).
- **Gestión de Actualizaciones**: Sistema de notificaciones (Toast) cuando hay una nueva versión disponible.
1