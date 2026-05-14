# Reglas Críticas para Neverland

> **Workflows de Modelos**:
> - `/tarea` — para correcciones y modificaciones sencillas. Planificar con modelo potente, implementar con modelo eficiente.
> - `/feature` — para nuevas funcionalidades. Rama aislada + SDD automático + preview Vercel + cambio de modelo.

## Skills Disponibles

| Skill | Trigger | Doc |
|-------|---------|-----|
| `feature` | /feature, nueva funcionalidad, añadir, crear feature | [SKILL.md](.agents/skills/feature/SKILL.md) |
| `tarea` | /tarea, corregir, modificar, bug fix, handoff | [SKILL.md](.agents/skills/tarea/SKILL.md) |
| `accessibility` | a11y audit, WCAG, screen reader | [SKILL.md](.agents/skills/accessibility/SKILL.md) |
| `frontend-design` | diseñar UI, componentes, landing pages | [SKILL.md](.agents/skills/frontend-design/SKILL.md) |
| `seo` | SEO, meta tags, sitemap | [SKILL.md](.agents/skills/seo/SKILL.md) |
| `backend_expert` | backend Node/Express/Mongo | [SKILL.md](.agents/skills/backend_expert/SKILL.md) |
| `mobile_ux_expert` | Safari iOS, Mobile-First, safeParseDate | [SKILL.md](.agents/skills/mobile_ux_expert/SKILL.md) |
| `pwa_expert` | PWA, Service Worker, offline | [SKILL.md](.agents/skills/pwa_expert/SKILL.md) |
| `mern_testing_specialist` | testing MERN, Supertest, modelos | [SKILL.md](.agents/skills/mern_testing_specialist/SKILL.md) |
| `webapp_testing_expert` | E2E, Playwright, flujo reservas | [SKILL.md](.agents/skills/webapp_testing_expert/SKILL.md) |
| `google_services_expert` | Google Calendar, Maps, Gemini | [SKILL.md](.agents/skills/google_services_expert/SKILL.md) |
| `ux-ui-design` | UX/UI premium, glassmorphism | [SKILL.md](.agents/skills/ux-ui-design/SKILL.md) |
| `generar-sistema-diseno` | design system, tokens CSS | [SKILL.md](.agents/skills/generar-sistema-diseno/SKILL.md) |
| `brainstorming_planning` | brainstorming, planificación | [SKILL.md](.agents/skills/brainstorming_planning/SKILL.md) |
| `changelog_generator` | changelog, documentar cambios | [SKILL.md](.agents/skills/changelog_generator/SKILL.md) |

---

1. **Stack MERN Exclusivo**: MongoDB, Express, React (Vite) y Node.js.
2. **Puro JavaScript**: PROHIBIDO el uso de TypeScript en este proyecto. Todo el código debe escribirse en JavaScript (ES6+).
3. **Mobile First y CSS**: 
   - Usa Tailwind CSS.
   - **CRÍTICO para Safari/iOS**: Evitar `h-screen`, `min-h-screen`, y `100vh`. USA SIEMPRE `dvh` (ej. `h-dvh`, `min-h-dvh`) para no ser ocultado por las barras de navegación.
   - Todo `<input>`, `<textarea>`, y `<select>` DEBE tener un `text-base` o un `min-text-[16px]` para evitar el zoom automático en los iPhones.
4. **Fechas**: Safari es notorio por quebrar con `new Date("YYYY-MM-DD")`. SIEMPRE utiliza la función de utilidad custom `safeParseDate` que existe en el proyecto. Un test que falla implica uso prohibido de `new Date(string)`.
5. **Idioma**: La documentación, las variables (cuando aplique) y el idioma de respuesta del asistente deben estar en **Español**.
6. **Manejo de Errores UX**: Todo evento que manipule o escriba datos debe contar con `try/catch`, especialmente para metódos como `scrollTo` que fallan en navegadores antiguos o iOS.
