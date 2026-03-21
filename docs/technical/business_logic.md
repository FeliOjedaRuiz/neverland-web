# 🧠 Lógica de Negocio y Algoritmos

## 1. Gestión de Turnos y Tiempos

Existen 3 turnos base configurados:

- **T1**: 17:00 - 19:00 (Solo permite adelantar inicio).
- **T2**: 18:00 - 20:00 (Permite adelantar o extender).
- **T3**: 19:15 - 21:15 (Solo permite extender fin).

**Extensiones**:
- 30 min (+30€) | 60 min (+50€).
- La lógica calcula la `horaFinalEstimada` sumando la extensión al turno base.

## 2. Algoritmo de Precios (`calculateEventPrice`)

El cálculo se realiza en el servidor para garantizar la integridad:

1.  **Mínimo**: Siempre se calcula en base a un mínimo de 12 niños.
2.  **Niños**: `Precio Menú x Cantidad`. Si el `precioApplied` no existe, se recupera dinámicamente de la configuración actual del menú.
3.  **Plus Fin de Semana**: Se añaden +1.50€ por niño si es Viernes, Sábado o Domingo (basado en `config.plusFinDeSemana`).
4.  **Adultos**: Suma de raciones seleccionadas. Si no hay snapshot de precio, se usa el de `config.preciosAdultos`.
5.  **Extras**:
    - Taller: Precio base o plus (si hay ≥15 niños). Recupera de `config.workshops` si falta snapshot.
    - Personajes: Precio fijo. Recupera de `config.preciosExtras.personaje`.
    - Piñata: Precio fijo. Recupera de `config.preciosExtras.pinata`.
6.  **Extensiones**: Se suma el costo de 30 o 60 min según el `horario`.
7.  **Ajuste Manual**: Se suma/resta el `costoExtra` definido por el administrador.

## 3. Invitaciones Digitales (v1.9)

El sistema genera automáticamente un `invitationId` (8 caracteres aleatorios) para cada nueva reserva.

**Lógica de Acceso y Visibilidad**:
- **Generación**: Se crea en el momento de la reserva o al actualizar el estado de una antigua si no lo tiene.
- **Seguridad**: Solo es accesible públicamente si el estado de la reserva es `confirmado` o `confirmada`.
- **Dinámica**: Si se edita la fecha o el turno en el administrador, la invitación refleja el cambio al instante sin necesidad de cambiar el enlace.
- **Acceso Restringido**: Si la reserva se mueve a `pendiente` o `cancelada`, el enlace deja de funcionar devolviendo un error 403 (Magia descansando).
