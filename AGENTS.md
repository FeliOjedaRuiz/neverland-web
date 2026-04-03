# Reglas Críticas para Neverland

1. **Stack MERN Exclusivo**: MongoDB, Express, React (Vite) y Node.js.
2. **Puro JavaScript**: PROHIBIDO el uso de TypeScript en este proyecto. Todo el código debe escribirse en JavaScript (ES6+).
3. **Mobile First y CSS**: 
   - Usa Tailwind CSS.
   - **CRÍTICO para Safari/iOS**: Evitar `h-screen`, `min-h-screen`, y `100vh`. USA SIEMPRE `dvh` (ej. `h-dvh`, `min-h-dvh`) para no ser ocultado por las barras de navegación.
   - Todo `<input>`, `<textarea>`, y `<select>` DEBE tener un `text-base` o un `min-text-[16px]` para evitar el zoom automático en los iPhones.
4. **Fechas**: Safari es notorio por quebrar con `new Date("YYYY-MM-DD")`. SIEMPRE utiliza la función de utilidad custom `safeParseDate` que existe en el proyecto. Un test que falla implica uso prohibido de `new Date(string)`.
5. **Idioma**: La documentación, las variables (cuando aplique) y el idioma de respuesta del asistente deben estar en **Español**.
6. **Manejo de Errores UX**: Todo evento que manipule o escriba datos debe contar con `try/catch`, especialmente para metódos como `scrollTo` que fallan en navegadores antiguos o iOS.
