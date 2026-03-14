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
2.  **Niños**: `Precio Menú x Cantidad`.
3.  **Plus Fin de Semana**: Se añaden +1.50€ por niño si es Viernes, Sábado o Domingo (basado en `config.plusFinDeSemana`).
4.  **Adultos**: Suma de raciones seleccionadas (`Precio Ración x Cantidad`).
5.  **Extras**:
    - Taller: Precio base o plus (si hay ≥15 niños).
    - Personajes: Precio fijo por cada uno.
    - Piñata: Precio fijo.
6.  **Extensiones**: Se suma el costo de 30 o 60 min según el `horario`.
7.  **Ajuste Manual**: Se suma/resta el `costoExtra` definido por el administrador.
