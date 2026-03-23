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
- **Edición Pública**: Inclusión de campos obligatorios de consentimiento (`privacyPolicyConsent`) en el detalle público para evitar errores de validación en Mongoose durante actualizaciones de clientes no administradores.
- **Importaciones Críticas**: Implementación de `Import Guardian` test e integración de `npm run lint` en el script de despliegue (`ship.js`) tras detectar un fallo en producción por falta de importación de `motion`. Esto asegura que errores de referencia no lleguen a desplegarse.

## 3. Robustez y Control de Errores

- **Failsafe Google**: La caída de la API de Google no bloquea la creación de reservas en DB.
- **Health Check**: Ruta `/api/health` para despliegues Zero-Downtime en Render/Fly.io.

## 4. Refactorización (Marzo 2026 - v1.7)

- **RGPD**: Movimiento de consentimientos al objeto `cliente` para cumplimiento normativo y coherencia lógica.
- **Limpieza**: Eliminación de dependencias muertas (Tailwind utilities en web) y scripts obsoletos (`seed.js`).
- **Migración**: Script `migrate_consents.js` ejecutado para actualizar datos históricos en producción.

## 5. Refactorización (Marzo 2026 - v1.9)

- **Autenticación Resiliente**: Middleware de actualización de eventos mejorado para ignorar tokens inválidos/caducados en rutas que permiten acceso público, evitando redirecciones erróneas al login para visitantes.
- **Robustez de API**: Normalización de la respuesta de `publicDetail` para garantizar simetría con los requerimientos del modelo de datos.
