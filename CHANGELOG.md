# Registro de Cambios (Changelog)

Todas las modificaciones notables en este proyecto serán documentadas en este archivo.

## [2026-09-04] - Blindaje y Validación de Precios de Actividades

- **Resumen**: Se implementó una defensa en profundidad para evitar cobros de 0€ en actividades cuando el administrador deja el precio para más de 15 niños (`pricePlus`) en 0€. Se añadió fallback automático al precio base en frontend y backend, se renombraron etiquetas confusas en el panel de administración y se incorporó un modal de advertencia interactivo previo al guardado.
- **Cambios**:
  - `web/src/utils/bookingUtils.js`: Fallback defensivo a `priceBase` cuando `pricePlus <= 0` en reservas >= 15 niños.
  - `web/src/components/booking/Step5Workshops.jsx`: Presentación de precios con fallback y visualización condicionada del suplemento.
  - `web/src/components/booking/Step8Summary.jsx` & `StepBudgetSummary.jsx`: Desglose del presupuesto con fallback a precio base.
  - `web/src/components/admin/ReservationDetailView.jsx`: Consistencia de cálculo en la vista de detalle y editor de reservas del admin.
  - `api/controllers/events.controllers.js`: Recálculo y snapshot server-side aplicando la misma lógica de fallback defensivo.
  - `web/src/components/admin/ConfigurationPanel.jsx`: Renombrado de "Precio Plus" a "Precio más de 15 niños", formato claro en tarjetas de catálogo y modal de confirmación ante precios en 0€ o inconsistencias (`pricePlus < priceBase`).
  - `web/src/utils/bookingUtils.test.js`: Casos de prueba unitarios para verificar el fallback a `priceBase`.
  - `openspec/changes/workshop-pricing-safety/`: Especificación formal OpenSpec (proposal, design, tasks y spec delta).
- **Acciones Pendientes**: Ninguna. Tests unitarios (23/23) y tests de integración en backend (22/22) aprobados.

## [14-05-2026] - Sistema de Talleres e Inscripciones

- **Resumen**: Implementación completa del flujo de administración y vista pública para talleres y eventos.
- **Cambios**:
  - `web/src/components/admin/TallerDetail.jsx`: Añadido botón de copiar enlace con la API del portapapeles. Se reorganizó el layout de acciones en un grid de 2 columnas donde el switch de visibilidad queda perfectamente centrado con respecto al botón inferior (Editar). El botón de enlace ahora depende del estado público del taller (se deshabilita si no es público).
  - `docs/proyecto_neverland.md`: Se actualizó el "Estado del Sistema" para reflejar los cambios estructurales más recientes relacionados con el modelo de talleres.
- **Acciones Pendientes**: Merge de la rama actual `feat/talleres` a `main` tras validación final por parte del cliente.
