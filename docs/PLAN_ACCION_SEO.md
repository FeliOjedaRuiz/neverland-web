# Estrategia Global de SEO para Neverland

Este documento consolida las acciones necesarias a nivel negocio y contenido, enfocadas en llevar "Neverland Parque Infantil Cúllar Vega" a los primeros resultados de búsqueda de Google y Google Maps.

## 1. El Pilar Principal: Google Business Profile (Google My Business)
Dado que Neverland es un negocio "físico y local" el 80% del tráfico inicial y las reservas provendrán de Google Maps y las búsquedas locales.
* **Creación / Reclamación:** Accede a `business.google.com` y crea o reclama la ubicación de Neverland en Cúllar Vega.
* **Información Exacta (NAP):** Asegúrate de que el Nombre (Neverland), la Dirección (ej. C/ Las Palmeras, 18195) y Teléfono sean EXACTAMENTE iguales a como aparecen en tu JSON-LD en la web.
* **Enlace Web:** Obligatorio que el botón de "Sitio Web" lleve a `https://neverlandcullarvega.es`.
* **Fotografías:** Sube entre 15 y 20 imágenes de altísima calidad (la fachada exterior, zonas de juego de los niños, zona de padres, etc.). El algoritmo prioriza fichas con mayor información visual aportada e interacciones.

## 2. El Efecto "Bola de Nieve": Estrategia de Reseñas
Las reseñas actúan como el medidor de confianza y relevancia más importante para el algoritmo local de Google.
* **Pide reseñas iniciales:** A tus primeros clientes (o conocidos honestos) pídeles que te pongan 5 estrellas.
* **El truco de las palabras clave:** Diles que en el texto de su reseña incluyan naturalidad como: *"Celebramos el **cumpleaños** de mi hijo y este **parque infantil en Cúllar Vega** es el mejor"*. Google lee esas reseñas y las asocia a las búsquedas de los futuros padres.

## 3. Autoridad Fuera de la Web (Link Building y Citas Locales)
Tu web necesita "recomendaciones" externas para que Google le suba el nivel de relevancia frente a la competencia.
* **Directorios Locales y Nacionales:** Crea un perfil de tu empresa en sitios como Yelp España, Páginas Amarillas, Infoisinfo, o cualquier directorio web de la zona de Granada (e inserta siempre el enlace a tu dominio).
* **Social Media Signals:** Cada post que hagas en Facebook e Instagram debe llevar hacia la web, pero además, el campo "Sitio Web" de las biografías debe apuntar siempre al dominio.

## 4. Auditoría Continua: Google Search Console (GSC)
Al ser una aplicación basada en React (Client-Side Rendering), a Google le cuesta ligeramente más indexar el contenido. GSC es tu herramienta de diálogo con el algoritmo.
* **Trámite de nuevas páginas:** Si mañana activas una sección de `/ofertas-navidad`, ve siempre a Search Console -> "Inspección de URLs" y dale a *"Solicitar Indexación"* para que no pase 1 mes en encontrarla.
* **Vigilancia de Errores:** Revisa tu correo o el panel una vez al mes por si Google alerta de "errores en móviles" (textos pequeños) o "velocidad muy lenta" (Core Web Vitals). Con Vite suelen ser muy buenos, pero nunca se debe desatender.

## 5. Próximos Pasos en el Código (Si la Web Crece)
* Si en el futuro creas un blog o landings dedicadas (ej. `/talleres`), crearemos un **Sitemap Dinámico** real y seguiremos la práctica de tener siempre 1 solo \`<H1>\` por página enfocado a la clave principal, inyectando un bloque \`LocalBusiness\` en la página de inicio y uno \`Breadcrumb\` para las sub-páginas.
* Vigilar el uso de etiquetas alt en todas las imágenes subidas a Cloudinary en el futuro para sumar puntos en Google Image Search.
