# 🚢 Neverland Ship: Sistema de Despliegue Seguro

Este sistema garantiza que **NUNCA** se despliegue código roto en producción.

## 🛠️ Cómo funciona el proceso (`npm run ship`)

1.  **🔍 Scan Frontend**: Ejecuta `vitest` para asegurar que la web no tiene errores Visuales ni de Lógica.
2.  **🔍 Scan Backend**: Ejecuta `jest` para verificar que la API responde correctamente.
3.  **🛡️ Safari Guardian**: Integrado en el paso 1, asegura compatibilidad total con iPhone.
4.  **💾 Smart Commit**: Solo si los tests pasan, guarda los cambios localmente.
5.  **🚀 Fly Deploy**: Lanza la aplicación a Fly.io directamente desde el entorno local.

## 📋 Reglas de uso para el Agente

Cuando el usuario pida "desplegar" o "hacer deploy":

1.  SIEMPRE usar el comando `npm run ship "mensaje del commit"`.
2.  Si el script falla, NO forzar el despliegue. Corregir primero.
3.  Informar al usuario del éxito final y los logs del deploy.

## ✨ Beneficios

- **Historial de Git Limpio**: Solo versiones estables llegan a GitHub.
- **Sin Sorpresas en Producción**: Los fallos se detectan ANTES de subir nada.
- **Ahorro de Tiempo**: Despliegue local directo (Fly CTL) sin esperar a colas externas.
