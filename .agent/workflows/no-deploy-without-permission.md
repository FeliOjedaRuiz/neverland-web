---
description: NEVER deploy to production without explicit user permission
---

# ⛔ REGLA CRÍTICA: NO DESPLEGAR SIN PERMISO EXPLÍCITO

**Esta regla es ABSOLUTA y no tiene excepciones.**

El usuario ha repetido varias veces que NO quiere que se despliegue a producción automáticamente.

## Lo que NO debes hacer jamás:
- Ejecutar `fly deploy` sin que el usuario lo haya pedido explícitamente en ese mensaje.
- Ejecutar `git push origin main` como parte de un flujo automático sin permiso.
- Ejecutar `npm run ship` (que ejecuta el script de despliegue `ship.js`) sin permiso explícito.
- Asumir que "como voy a hacer cambios, también despliego de paso".

## Lo que SÍ debes hacer:
1. Hacer los cambios de código en local.
2. Hacer `git add` y `git commit` si corresponde.
3. **Parar ahí.**
4. Decirle al usuario que los cambios están listos y **preguntarle si quiere desplegar**.

## Ejemplo correcto:
> "He aplicado los cambios. ¿Quieres que lo empuje a producción?"

## Recuerda:
El usuario te ha pillado haciendo esto varias veces. Una más y pierde la confianza. **No lo hagas.**