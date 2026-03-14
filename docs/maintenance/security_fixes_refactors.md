# 🔐 Seguridad y Mantenimiento

## 1. Seguridad y Accesos

- **Autenticación (JWT)**: Sesiones protegidas de 1 hora (`MAX_SESSION_TIME`).
- **Middlewares**: Protección `isAdmin` en rutas críticas de gestión y configuración.
- **Rate Limiting**: 150 peticiones/15 min para prevenir abusos.
- **CORS**: Configuración dinámica via `.env`.

## 2. Puntos de Falla Reparados (Histórico)

- **Calculo de Precios**: Implementación de Snapshots (`Applied`) para evitar cambios retroactivos al editar precios globales.
- **Zonas Horarias**: Normalización a medianoche local para cálculo de Plus de Fin de Semana.
- **Estandarización**: Formato uniforme para arrays de comida de adultos.

## 3. Robustez y Control de Errores

- **Failsafe Google**: La caída de la API de Google no bloquea la creación de reservas en DB.
- **Health Check**: Ruta `/api/health` para despliegues Zero-Downtime en Render/Fly.io.

## 4. Refactorización (Marzo 2026 - v1.7)

- **RGPD**: Movimiento de consentimientos al objeto `cliente` para cumplimiento normativo y coherencia lógica.
- **Limpieza**: Eliminación de dependencias muertas (Tailwind utilities en web) y scripts obsoletos (`seed.js`).
- **Migración**: Script `migrate_consents.js` ejecutado para actualizar datos históricos en producción.
