# Propuesta — Sistema de Talleres

## Problema

Neverland actualmente solo gestiona **reservas de cumpleaños**. No existe un sistema para que el negocio ofrezca **talleres independientes** (sesiones temáticas programadas) donde los clientes puedan inscribir a sus niños sin pasar por el flujo completo de reserva de cumpleaños.

## Solución

Crear un sistema completo de **Talleres** que permita:

1. **Admin**: Crear, editar, publicar y gestionar talleres programados en el calendario, con control de aforo y visibilidad.
2. **Clientes**: Ver talleres públicos disponibles en la home, ver detalles, e inscribir niños mediante un formulario simplificado.
3. **Sistema**: Integrar los talleres con el calendario de turnos existente (bloqueando los turnos seleccionados), Google Calendar, emails de confirmación y Cloudinary para imágenes.

## Scope

### ✅ Incluido

- Modelo `Taller` en MongoDB con campos: nombre, descripción, precio, aforo, fecha, turnos[], horario (inicio/fin), portada, galería[], publico, inscripciones[]
- CRUD de talleres para admin (listado, creación, edición, eliminación)
- Página pública de listado de talleres (filtrados: solo públicos, no pasados, ordenados por proximidad)
- Página pública de detalle de taller con formulario de inscripción
- Formulario de inscripción: nombre niño, edad, nombre responsable, teléfono, email, consentimiento protección de datos
- Email de confirmación de inscripción con botón discreto para cancelar la inscripción
- Google Calendar: crear evento por taller, reemplazar bloqueos existentes si se seleccionan
- Bloqueo de turnos: los turnos seleccionados para el taller bloquean reservas de cumpleaños
- Resumen post-inscripción con opción de agendar en Google Calendar
- Gestión de inscripciones desde admin (ver lista de niños inscritos, eliminar)
- Subida de imágenes a Cloudinary (portada + galería opcional)
- Panel de administración de talleres en el dashboard del admin
- Indicador visual de aforo ("Últimos X lugares" cuando queden ≤5)
- Filtrado automático de talleres pasados (hora española, tras hora de fin)

### ❌ Excluido

- Pagos online (el precio se muestra pero el pago es externo/presencial)
- Sistema de notificaciones push para inscripciones (se puede añadir después, la infraestructura ya existe)
- Lista de espera para talleres llenos (posible mejora futura, no implementar ahora — requiere gestión de cobros)
- Talleres recurrentes (cada taller es una instancia única)
- Descuentos por hermanos o grupos
- Límite de edad (pendiente de definir con el cliente — sin restricción por ahora)

## Alternativas consideradas

### A) Extender el modelo Event existente
Añadir un nuevo `tipo: 'taller'` al modelo `event.model.js`.  
**Descartado**: Los talleres tienen estructura de datos muy diferente (inscripciones múltiples, galería, aforo). Forzarlo en el modelo Event crearía un esquema confuso con campos condicionales.

### B) Usar el modelo Workshop existente + extenderlo
Ampliar `workshop.model.js`.  
**Descartado**: El modelo actual es un esqueleto sin fechas, turnos, ni inscripciones. Además, "workshop" ya se usa en config para las actividades extras de cumpleaños. Crear un modelo nuevo (`taller.model.js`) evita confusiones.

### C) Modelo Taller independiente (elegido)
Crear `taller.model.js` desde cero con su propia estructura, controladores y rutas.  
**Ventaja**: Separación limpia, sin riesgo de romper lo existente, modelado específico para el dominio.

## Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Conflicto de naming con "workshops" del config | Usar "taller"/"talleres" en todo el código nuevo. No tocar los "workshops" existentes. |
| Bloqueo de turnos inconsistente con Google Calendar | Reutilizar la lógica de `events.controllers.js` que ya maneja esto correctamente. |
| Safari con fechas | Usar `safeParseDate()` consistentemente. |
| Aforo y concurrencia | Validar en backend antes de insertar inscripción (atomicidad con `$push` y condición). |
