# Registro de Cambios (Changelog)

Todas las modificaciones notables en este proyecto serán documentadas en este archivo.

## [14-05-2026] - Sistema de Talleres e Inscripciones

- **Resumen**: Implementación completa del flujo de administración y vista pública para talleres y eventos.
- **Cambios**:
  - `web/src/components/admin/TallerDetail.jsx`: Añadido botón de copiar enlace con la API del portapapeles. Se reorganizó el layout de acciones en un grid de 2 columnas donde el switch de visibilidad queda perfectamente centrado con respecto al botón inferior (Editar). El botón de enlace ahora depende del estado público del taller (se deshabilita si no es público).
  - `docs/proyecto_neverland.md`: Se actualizó el "Estado del Sistema" para reflejar los cambios estructurales más recientes relacionados con el modelo de talleres.
- **Acciones Pendientes**: Merge de la rama actual `feat/talleres` a `main` tras validación final por parte del cliente.
