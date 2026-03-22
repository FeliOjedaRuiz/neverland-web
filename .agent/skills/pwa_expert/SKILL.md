---
name: pwa_expert
description: Especialista en Progressive Web Apps (PWA). Guía experta para implementar Service Workers, estrategias de caché, capacidades offline e instalabilidad.
---

# Habilidad Experta en Progressive Web Apps (PWA)

Como Experto en PWA, tu objetivo es transformar aplicaciones web tradicionales en experiencias rápidas, instalables, confiables (incluso con mala conexión) y que ofrezcan una experiencia similar a una aplicación nativa.

## 1. Pilares Centrales de una PWA

1.  **Confiabilidad (Reliability)**: La aplicación debe cargar instantáneamente y nunca mostrar la pantalla del "dinosaurio", incluso sin conexión a internet o con redes inestables (3G/Edge).
2.  **Velocidad (Speed)**: Responde rápidamente a las interacciones del usuario con animaciones fluidas. Precarga los recursos esenciales.
3.  **Experiencia de Usuario (Engaging)**: Se siente como una app nativa. Es instalable, puede vivir en la pantalla de inicio del usuario y usar notificaciones push.

## 2. Requerimientos Técnicos Base

Para que una aplicación web sea considerada una PWA, necesita tres componentes técnicos fundamentales:

-   **HTTPS**: Requisito de seguridad estricto. Los Service Workers no funcionan sin conexión segura (excepto en `localhost` para desarrollo).
-   **Web App Manifest (`manifest.json`)**: Un archivo JSON que le dice al navegador sobre la aplicación y cómo debe comportarse al instalarse en el dispositivo (nombre, iconos, colores, display).
-   **Service Worker**: Un script en segundo plano que actúa como un proxy de red programable, permitiendo interceptar peticiones red, gestionar la caché y manejar notificaciones push.

## 3. Estrategias de Caché (Service Worker)

Un Service Worker avanzado debe implementar estrategias de caché adecuadas según el tipo de recurso:

1.  **Cache First (Caché Primero)**:
    -   *Uso*: Assets estáticos que no cambian a menudo (fuentes, logos, imágenes de UI, CSS base).
    -   *Lógica*: Busca primero en la caché; si no está, va a la red y luego lo guarda en caché.
2.  **Network First (Red Primero, fallback a Caché)**:
    -   *Uso*: Datos dinámicos, respuestas de API, páginas HTML frecuentes.
    -   *Lógica*: Intenta ir a la red primero. Si falla (offline), sirve el contenido almacenado en caché.
3.  **Stale-While-Revalidate (Obsoleto mientras se revalida)**:
    -   *Uso*: Contenido que se actualiza frecuentemente, pero donde mostrar datos ligeramente desactualizados temporalmente es aceptable (por ejemplo, avatares, listas de precios no críticas).
    -   *Lógica*: Sirve contenido desde la caché inmediatamente, pero en segundo plano hace la petición a la red para actualizar la caché para la próxima vez.
4.  **Network Only / Cache Only**: Estrategias puras para casos muy específicos.

## 4. Flujo de Trabajo para PWA (Workflow)

### Fase 1: Auditoría y Preparación
- Ejecutar un análisis de Lighthouse (pestaña PWA) para identificar los puntos de partida de la web actual.
- Asegurar que todas las peticiones se sirven bajo HTTPS.

### Fase 2: El Manifiesto
- Crear `manifest.json` y vincularlo en el `<head>` del HTML.
- Propiedades clave: `name`, `short_name`, `start_url` (usualmente `/`), `display` (usualmente `standalone`), `background_color`, `theme_color`, e `icons` (mínimo 192x192 y 512x512).

### Fase 3: Service Worker
- Registrar el Service Worker en el cliente (preferiblemente cuando la página haya cargado, evento `load`).
- Dependiendo de la tecnología, escribir el Service Worker manualmente o usar herramientas como **Workbox** (muy recomendado).
- Si se usa Vite o PWA modernos, emplear plugins como `vite-plugin-pwa` que simplifican el proceso con Workbox por debajo.

### Fase 4: Experiencia Offline y UI de App
- **Modo Offline**: Si no hay datos cacheados, disponer de una página "Offline" genérica o un mensaje UI que avise al usuario en lugar del dinosaurio.
- **Botón de Instalación (A2HS - Add to Home Screen)**: Manejar el evento `beforeinstallprompt` para mostrar un botón/banner personalizado en el momento adecuado, no importunar inmediatamente al usuario.
- **Actualizaciones de la App**: Si se detecta un nuevo Service Worker esperando, notificar al usuario (e.g. un Toast "Hay una nueva versión disponible. Recargar") y usar `skipWaiting()`.

## 5. Mejores Prácticas UI/UX en PWA

-   **Manejo del Área Segura**: Los PWA en modo `standalone` no tienen barra del navegador, considerar usar `padding` adicional (`env(safe-area-inset-top)`) especialmente en iOS.
-   **Sin zoom molesto**: Deshabilitar el gesto de "doble tap para zoom" genérico en botones para que responda instantáneamente como una app nativa: usar `touch-action: manipulation;`.
-   **Highlight color**: Remover el color azul por defecto de tap en navegadores móviles: `-webkit-tap-highlight-color: transparent;`.
-   **Ocultar scrollbars**: Ocultar la barra de scroll estética para mantener una apariencia nativa donde sea necesario.

## 6. Depuración y Troubleshooting

-   **Pestaña Application (DevTools)**: El centro de control para PWA.
-   **Lidiar con versiones cacheadas zombie**: Durante desarrollo, activar "Update on reload" (Actualizar al recargar) en el panel de Service Workers.
-   **Almacenamiento Cuota**: Revisar periódicamente el almacenamiento en la pestaña "Storage" para asegurar que los cachés antiguos o dinámicos se están limpiando.
-   **Lighthouse**: Repetir auditorías constantemente hasta conseguir la insignia verde de PWA.
