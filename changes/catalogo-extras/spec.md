# Especificación: Catálogo de Extras

## Requisitos

| ID | Prioridad | Requisito verificable |
|---|---|---|
| REQ-01.1 | MUST | `Config.extrasCatalogo` SHALL almacenar `id`, `slug`, `nombre`, `descripcion`, `precio`, `imageUrl`, `suspended` y `active`; `slug` SHALL ser único e inmutable. |
| REQ-01.2 | MUST | El catálogo SHALL incluir por seed Piñata Neverland (`slug: pinata`, precio 15€) y SHALL aceptar catálogo vacío sin error. |
| REQ-02.1 | MUST | El admin SHALL poder crear, editar, activar/desactivar, suspender/reactivar y eliminar items con validación de nombre, slug único y precio no negativo. |
| REQ-03.1 | MUST | Un evento SHALL guardar `detalles.extras.catalogoItemIds[]` y `precioCatalogoApplied` como snapshot de los precios vigentes al crear o actualizar. |
| REQ-03.2 | MUST | Al seleccionar `pinata`, el servidor SHALL conservar además `pinata: true` y `precioPinataApplied`; el cálculo SHALL evitar duplicarlo. |
| REQ-04.1 | MUST | Step7Extras SHALL mostrar únicamente items activos y no suspendidos, permitir selección múltiple y mantener Piñata como toggle visual dedicado. |
| REQ-04.2 | MUST | Los resúmenes de reserva y presupuesto SHALL mostrar nombres, cantidades seleccionadas y precios de catálogo, incluido total recalculado. |
| REQ-05.1 | MUST | `calculateEventPrice` SHALL sumar cada precio de catálogo seleccionado y PATCH SHALL invalidar/recalcular snapshots cuando cambien extras o precios base. |
| REQ-06.1 | MUST | Las vistas admin SHALL mostrar extras seleccionados, precio aplicado y badge `(legacy)` cuando falte `catalogoItemIds`; items eliminados SHALL conservar identificación disponible. |
| REQ-07.1 | SHOULD | Email de confirmación y evento de Google Calendar SHALL incluir nombres y precios aplicados de los extras, sin alterar reservas legacy. |
| REQ-08.1 | MUST | PricingPage SHALL mostrar los extras activos/no suspendidos y sus precios; no SHALL exponer items internos. |
| REQ-09.1 | MUST | `analyze-stale-snapshots` SHALL detectar discrepancias de catálogo y `fix-stale-snapshots` SHALL corregirlas sin modificar reservas legacy no migradas. |
| REQ-10.1 | MUST | La cobertura SHALL incluir API Jest y web Vitest para CRUD, selección, snapshots, PATCH, legacy, scripts e integraciones; ambas suites SHALL pasar. |

## Escenarios

### Cliente y precios
1. **GIVEN** catálogo con dos items disponibles **WHEN** el cliente marca ambos en Step7 **THEN** aparecen en Step8 y presupuesto, y el total suma ambos precios.
2. **GIVEN** un item suspendido **WHEN** se carga Step7 **THEN** no se muestra ni puede enviarse desde el cliente.
3. **GIVEN** evento con un extra y PATCH que cambia otro precio **WHEN** se procesa **THEN** el snapshot y total se recalculan con la selección vigente.
4. **GIVEN** reserva sin `catalogoItemIds` y `pinata: true` **WHEN** se abre admin **THEN** conserva precio Piñata y muestra `(legacy)`.

### Admin CRUD
5. **GIVEN** admin autenticado **WHEN** crea un item válido **THEN** queda visible en catálogo y pricing público; slug duplicado rechaza la operación sin cambios.
6. **GIVEN** item existente **WHEN** admin intenta renombrar su slug **THEN** se rechaza o conserva el slug original; editar precio/nombre sí actualiza el catálogo.
7. **GIVEN** item usado por reservas **WHEN** admin lo elimina **THEN** reservas previas siguen mostrando su ID/nombre disponible y no falla el detalle.

### Integraciones y scripts
8. **GIVEN** reserva nueva con extras **WHEN** se envían email y Calendar **THEN** ambos contienen los extras y precios aplicados.
9. **GIVEN** snapshots desactualizados **WHEN** se ejecutan analyze y fix **THEN** reportan y corrigen solo discrepancias elegibles, con salida verificable.

## Criterios de aceptación

- **Modelo/CRUD:** schema, seed, validaciones, permisos y operaciones CRUD cubiertos por Jest.
- **Booking/presupuesto:** Step7, Step8 y BudgetPage filtran correctamente, preservan Piñata dedicado y renderizan catálogo vacío sin errores.
- **Backend:** creación y PATCH persisten IDs, snapshots, compatibilidad Piñata y sumas sin duplicación.
- **Admin:** detalle y modal muestran extras, precios, eliminados y badge legacy.
- **Publicación/integraciones:** PricingPage, email y Calendar muestran solo datos activos o snapshots aplicados.
- **Legacy/scripts/tests:** reservas antiguas permanecen funcionales; scripts tienen modo análisis/corrección probado; `npm test` de API y web pasa.

## Casos límite

- Catálogo vacío, todos los items suspendidos o inactivos.
- Slug duplicado, slug cambiado, nombre vacío, precio negativo o imagen inválida.
- Item eliminado con reservas existentes o ID desconocido.
- Selección repetida, selección vacía, item suspendido enviado manualmente y precio cambiado concurrentemente.
- Reserva legacy con `pinata` falso/ausente, precio legacy ausente o datos de extras incompletos.
- Reejecución segura de scripts y fallo parcial de email/Calendar sin alterar el evento.

## Fuera de alcance

Migrar `extension30`, `extension60`, `tallerBase` u otros extras legacy; descuentos/promociones; extras condicionales; inventario/stock; cambios de dependencias externas; y edición retroactiva de precios ya aplicados a reservas cerradas.
