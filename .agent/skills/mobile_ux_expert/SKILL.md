# Mobile UX Expert (Safari/iOS Specialist)

Experto en diseño Mobile-First y resolución de problemas específicos de Safari en iOS para la plataforma Neverland.

## Misión

Garantizar que la experiencia de usuario sea impecable en dispositivos móviles, especialmente iPhones, eliminando fricciones técnicas comunes en estos navegadores.

## Reglas de Oro

1. **Viewport Height**: Nunca usar `100vh` para contenedores principales; usar `h-dvh` (Dynamic Viewport Height) en Tailwind o variables CSS para evitar que la barra de navegación de Safari tape el contenido.
2. **Scroll Management**: Usar `overscroll-behavior-none` cuando sea necesario y asegurar que los modales tengan `try/catch` en su lógica de bloqueo de scroll.
3. **Form Experience**:
   - Mantener un `font-size` mínimo de `16px` en todos los inputs para evitar que iOS haga zoom automático al enfocar.
   - Usar `inputmode` adecuado (numeric, tel, email) para mostrar el teclado correcto.
4. **Touch Targets**: Botones e interactuables deben tener un área mínima de `44x44px`.

## ⚠️ Reglas CRÍTICAS de Safari (Incidentes Reales)

### 5. **NUNCA usar `new Date("YYYY-MM-DD")` directamente**

Safari NO soporta correctamente el formato ISO de fecha con guiones. Siempre usar `safeParseDate()` de `utils/safeDate.js`.

```javascript
// ❌ PROHIBIDO - Rompe en Safari/iOS
new Date('2026-02-27');
new Date(formData.fecha);
new Date(dateString).getDay();

// ✅ OBLIGATORIO - Usar utilidad segura
import { safeParseDate } from '../../utils/safeDate';
const date = safeParseDate('2026-02-27'); // Convierte a YYYY/MM/DD internamente
```

**Incidente (Feb 2026):** Un `new Date(formData.fecha)` sin proteger en `Step8Summary.jsx` causó un crash silencioso en Safari que, combinado con `AnimatePresence`, dejó la pantalla de confirmación en blanco para los clientes con iPhone.

**Test de guardián:** Existe `safariGuardian.test.js` que escanea automáticamente el código fuente y **FALLA si encuentra `new Date()` sin `safeParseDate`** en los componentes de booking.

### 6. **framer-motion: Precaución con `AnimatePresence` en pantallas finales**

En Safari iOS, `AnimatePresence mode="wait"` depende de que la **animación de salida** del componente anterior se ejecute correctamente. Si el componente que sale tiene un error de render (incluso silencioso), el nuevo componente **nunca aparece**.

```javascript
// ❌ PELIGROSO - Si Step8 crashea, Step9 jamás aparece
<AnimatePresence mode="wait">
	{step === 8 && <Step8 />}
	{step === 9 && <BookingSuccess />}
</AnimatePresence>;

// ✅ SEGURO - Pantallas finales/críticas FUERA de AnimatePresence
{
	step === 9 ? (
		<BookingSuccess />
	) : (
		<AnimatePresence mode="wait">{step === 8 && <Step8 />}</AnimatePresence>
	);
}
```

### 7. **Usar CSS puro para animaciones en pantallas críticas**

En componentes de confirmación/éxito que el cliente DEBE ver, preferir `@keyframes` CSS sobre `motion.div`. Las animaciones CSS son nativas del navegador y no pueden fallar silenciosamente.

```javascript
// ❌ Puede fallar silenciosamente en Safari
<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
  transition={{ type: 'spring' }}>

// ✅ Funciona en TODOS los navegadores
<div style={{ animation: 'bounce 0.6s ease forwards' }}>
<style>{`@keyframes bounce { 0% { transform: scale(0) } 100% { transform: scale(1) } }`}</style>
```

## Recursos Relacionados

- `docs/MOVILE_RESOLUTIONS.md`
- `agent.md` (Sección de Estándares Críticos)
- `web/src/utils/safeDate.js` (Utilidad obligatoria para fechas)
- `web/src/utils/safariGuardian.test.js` (Test guardián automático)
