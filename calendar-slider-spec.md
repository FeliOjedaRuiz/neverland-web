# Especificación Técnica: Slider del Calendario (Step1Date.jsx)

Este documento detalla la implementación del carrusel de meses infinito con gestos táctiles.

## 1. Arquitectura de Estado

- **`width`**: Medida dinámica del ancho del contenedor (`offsetWidth`). Base de todos los cálculos de desplazamiento.
- **`x`**: `MotionValue` de `framer-motion` que controla la posición horizontal del riel.
- **`currentMonth`**: Fecha de referencia (día 1 del mes central).
- **`headerDate`**: Estado auxiliar para actualizar el título del mes inmediatamente al iniciar la animación.

## 2. Estructura del DOM (Layout)

- **Contenedor Viewport (`relative overflow-hidden`)**: Actúa como la ventana visible.
- **Riel Deslizable (`motion.div`)**:
  - **Ancho**: `width * 3` (3 meses).
  - **Posición Inicial**: `x = -width` (muestra el medio).
- **Items (Meses)**: Ancho exacto de `100%` del viewport (`style={{ width: width }}`).

## 3. Lógica de Navegación (`cycleMonth`)

1.  **Cálculo del Target**: Siguiente (`-2 * width`), Anterior (`0`).
2.  **Animación**: `animate(x, targetX, { duration: 0.3 })`.
3.  **Recalibración instantánea**: Al terminar, se actualiza `currentMonth` y se devuelve `x` a `-width` sin animación.

## 4. Gestos Táctiles (`Drag`)

- **`drag="x"`**: Movimiento horizontal bloqueado.
- **`dragConstraints`**: Entre `0` y `-2 * width`.
- **`dragElastic={0.1}`**: Rebote en bordes.
- **`handleDragEnd`**:
  - Threshold: **25%** del ancho.
  - Dispara `cycleMonth` si se supera, o `snap-back` si no.

## 5. Código de Referencia (Simplificado)

```jsx
const x = useMotionValue(0);

const cycleMonth = async (direction) => {
	const targetX = direction === 1 ? -2 * width : 0;
	await animate(x, targetX, { duration: 0.3 });
	setCurrentMonth(nextDate);
	x.set(-width); // Salto invisible
};

return (
	<div className="overflow-hidden" ref={containerRef}>
		<motion.div
			style={{ x, width: width * 3 }}
			drag="x"
			dragConstraints={{ left: -2 * width, right: 0 }}
			onDragEnd={handleDragEnd}
		>
			{months.map((m) => (
				<Month key={m} width={width} />
			))}
		</motion.div>
	</div>
);
```
