---
description: Proceso obligatorio antes de realizar commits importantes (Actualización de Memoria).
---

1. Antes de iniciar un proceso de `git commit` para guardar nuevas características (features), cambios en los modelos de base de datos o modificaciones sustanciales en la UI/Servicios, debes realizar una pausa.
2. Abre y lee los archivos de documentación core del proyecto mediante la herramienta `view_file` (Por ejemplo: `docs/proyecto_neverland.md`).
3. Evalúa si los cambios recientes en el código o en la lógica de negocio invalidan, amplían o modifican lo escrito en la documentación.
4. Si hay discrepancias u omisiones provocadas por los nuevos cambios, utiliza `replace_file_content` o `multi_replace_file_content` para actualizar la documentación manteniendo el mismo nivel de detalle, tono y estructura (lenguaje natural técnico y descriptivo).
5. Una vez que la documentación refleje el estado "Real" del código actual, formula el comando de `git add .` seguido de su `git commit` habitual.

> _Nota: Este workflow garantiza que la documentación viva al mismo ritmo que el código fuente._
