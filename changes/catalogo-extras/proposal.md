# Proposal: Catálogo Genérico de Extras

## Intent

Reemplazar el extra hardcodeado "Piñata" por un **catálogo genérico de extras** que el admin pueda crear/editar/eliminar desde el panel de configuración sin tocar código. Los clientes los eligen durante el flujo de reserva o presupuesto. **Backcompat 100%** con reservas existentes que tengan `pinata: true` + `precioPinataApplied`.

## Why now

- El admin necesita poder ofrecer packs variables (Piñata XL, decoración extra, animación adicional, etc.) sin pedir deploys.
- Reservas legacy (6 verificadas: 7EXGX7, 1MF328, 37ABWV, E82EHM, KWK6MQ, TO24JE) ya usan `pinata: true` + `precioPinataApplied`. Cualquier cambio de schema DEBE preservarlas.
- El frontend ya tiene una sección "Extras" con Piñata fija. Migrarla a una sección genérica simplifica la UI a largo plazo.

## What changes

- `Config` gana `extrasCatalogo[]` con `{ nombre, descripcion, precio, imageUrl, orden, active }` (sin `suspended`, sin `slug` visible en admin — Piñata se identifica por nombre legacy).
- `Event.detalles.extras` gana `catalogoItemIds: [String]` + `precioCatalogoApplied: Number`.
- Piñata pasa a ser el primer item del catálogo (seed idempotente en bootstrap de config), precio **20€**.
- El servidor hace **dual-write**: si `'pinata'` está en `catalogoItemIds`, también setea `pinata: true` y `precioPinataApplied`.
- Cliente usa fallback: `precioPinataApplied` → `catalogo[pinata].precio` → `15` (último recurso histórico).
- Admin UI: nuevo accordion "Extras Adicionales" en ConfigurationPanel con CRUD.
- Admin UI: ReservationDetailView muestra Actividad (+X€), Personajes (+X€), Catálogo (+X€), subtotal "Subtotal actividades y extras".
- Cliente: Step7Extras muestra solo catálogo activo, sin toggle especial de Piñata.
- Email + Google Calendar description incluyen catálogo seleccionado.

## What does NOT change (non-goals)

- Carrito de extras (futuro).
- Multi-cantidad por extra (futuro).
- Categorías/tags de extras (futuro).
- Personajes, actividades y pack 3 personajes no se tocan.

## Stack & constraints

- MERN JavaScript puro (NO TypeScript).
- Mobile-first Safari-safe: `dvh` (no `h-screen`), `text-base` en inputs, `safeParseDate` para fechas.
- UI en Español. Conventional commits. Sin `Co-Authored-By`.
- Branch dedicada: `feat/catalogo-extras` (NO main directo). Vercel preview por PR.
- Front: Vite + React 19 + Tailwind 4. Back: Express 4 + Mongoose 7.
- Front auto-deploy a Vercel. Back auto-deploy a Render (`neverland-api.onrender.com`).
- `web/vercel.json` rewrites `/api/v1/*` al back de Render.

## Risk

- **Medium**: schema change en `Event` + `Config` requiere backcompat path testeado. Las 6 reservas legacy son la red de seguridad.
- **Low**: pricing change — la fórmula se amplía pero no reemplaza.
- **Low**: UI admin — el accordion es nuevo, no reemplaza nada existente (solo oculta Piñata legacy).

## Verification

- 79/79 backend tests passing (`api/tests/events.test.js`).
- 64/64 frontend tests passing (`web/src/utils/bookingUtils.test.js` + `Step8Summary.test.jsx`).
- Manual smoke: crear catálogo → reservar → ver en admin → editar → snapshot recalcula.
- Reservas legacy: `TO24JE`, `7EXGX7`, etc. se siguen leyendo correctamente.
