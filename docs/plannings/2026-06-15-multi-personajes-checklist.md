# Checklist de verificación — Multi-Personajes

> **Fecha**: 2026-06-15
> **Rama**: `feat/multi-personajes`
> **Plan original**: `docs/plannings/2026-06-15-multi-personajes.md`

Esta lista es para validación manual. Marcá con ✅ cuando lo hayas probado en local.

---

## 1. Booking flow — Precios escalonados

- [✅] Crear reserva con **0 personajes** → precio extra = 0€
- [✅] Crear reserva con **1 personaje** → precio extra = 40€
- [✅] Crear reserva con **2 personajes** → precio extra = 80€ (2 × 40€)
- [✅] Crear reserva con **3 personajes** → precio extra = 100€ (pack)

## 2. Booking flow — Límite de 4° personaje

- [✅] Intentar seleccionar un 4° personaje → aparece toast: **"El máximo es 3 personajes"**
- [✅] El toast desaparece automáticamente en ~3 segundos
- [✅] El 4° personaje NO se añade a la selección

## 3. Booking flow — UX silenciosa

- [✅] Verificar que NO hay badge "2/3", contador visible, ni texto "puedes seleccionar hasta 3"
- [✅] La interfaz se ve como selector simple al inicio
- [✅] El usuario descubre orgánicamente que puede seleccionar más de uno
- [✅] Solo cuando intenta un 4° aparece el aviso

## 4. Budget flow — Pack 3

- [✅] Crear presupuesto con 3 personajes → precio pack = 100€ (no 120€)
- [✅] Banner "Pack 3: 100€" queda **fijo** sobre los botones de navegación aunque scrollees
- [✅] Badge "Ahorras 20€" visible al activar el pack
- [✅] Los precios por card (40€) se tachan al activar el pack

## 5. Admin edit — Recálculo de precio

- [✅] Editar evento existente con 1 personaje → cambiar a 2 → precio sube de 40€ a 80€
- [✅] Cambiar de 2 a 3 → precio cambia a 100€ (pack)
- [✅] Quitar todos → precio vuelve a 0€
- [✅] El badge "+€" en la vista de lectura muestra el precio correcto del evento

## 6. Admin config — Precio del pack

- [✅] En el panel de configuración, sección de precios extras, aparece **"Pack 3 personajes"** con valor 100€
- [✅] Editar el valor y guardar → persiste en la DB
- [✅] El nuevo valor se refleja en el cálculo de precios del booking/budget

## 7. Email de confirmación

- [✅] Tras crear reserva con 2-3 personajes, el email lista todos los nombres
- [✅] Si hay 0 personajes, muestra "Sin personaje" o equivalente
- [✅] Formato del email: `Visita de Elsa, Mickey, Minnie`

## 8. Google Calendar

- [✅] La descripción del evento en Google Calendar lista todos los personajes
- [✅] Formato: `Personajes (Elsa, Mickey, Minnie)`
- [✅] Si hay 0 personajes, muestra "Sin personaje" o equivalente

## 9. Migración de datos ✅

- [x] Script ejecutado: `api/scripts/migrate-personaje-to-array.js`
- [x] 200/200 eventos migrados, 0 errores
- [x] Backup guardado: `api/scripts/backups/backup-2026-06-15T16-27-58.json`
- [x] Script idempotente (si se vuelve a correr, omite los ya migrados)

## 10. PricingPage — Landing de precios

- [✅] La tarjeta de personajes muestra **"40€ / personaje"**
- [✅] Debajo aparece **"Pack 3: 100€"** usando el valor de `extras.precioPack3Personajes`
- [✅] El valor se actualiza si se cambia en el panel admin

---

## Datos de prueba rápida

Reservas existentes con personaje (para probar admin edit):

| ID | Fecha | Niño/a | Personaje |
|----|-------|--------|-----------|
| `E82EHM` | 13/10/2026 | Alicia | KPop Rumi |
| `KWK6MQ` | 10/10/2026 | Samuel | Mario |
| `X6DU3Q` | 08/06/2026 | Mario | Luigi |
| `WWLB69` | 31/05/2026 | Isaac | Spiderman |
| `DV7BUE` | 12/03/2026 | Daniela | K-Pop |

**109 reservas sin personaje** — útiles para probar el caso 0.

---

## Bugs corregidos durante testing local

1. **Badge "+0€" en vista de lectura** → leía del campo equivocado, ahora usa `precioPersonajeApplied` del evento
2. **Selector admin overflow en móvil (360px)** → avatares reducidos a `w-12 h-12`, texto con `truncate`
3. **Tarjeta Actividad con layout diferente a Personajes** → unificado a `w-12 h-12` y label vertical
4. **Banner de pack oculto al scrollear** → movido a nivel de página, fijo sobre navegación
5. **Iconos de extras con tamaños inconsistentes** → unificados a `w-10 h-10` (mismo que menús)

---

## Scripts útiles

```bash
# Backup antes de migración
node api/scripts/backup-before-migrate.js

# Correr migración
node api/scripts/migrate-personaje-to-array.js

# Listar reservas con personaje
node api/scripts/listar-personajes.js

# Tests
cd api && npm test
cd web && npm run test:run
```
