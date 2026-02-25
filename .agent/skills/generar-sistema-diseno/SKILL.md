---
name: generar-sistema-diseno
description: Genera un sistema de diseño estético y moderno (colores, tipografía, componentes) para aplicaciones web, asegurando consistencia y UX premium.
---

# Generador de Sistema de Diseño Web

Este skill guía la creación de un sistema de diseño visual completo, moderno y premium para aplicaciones web. Se enfoca en la consistencia, la estética visual de alto impacto y la usabilidad.

## Cuándo usar este skill

- Cuando se inicia un nuevo proyecto web y no hay diseño definido.
- Cuando se quiere modernizar la estética de una aplicación existente ("refactor visual").
- Cuando se necesita unificar estilos dispersos en un sistema coherente (tokens, variables).

## Inputs necesarios

- **Concepto clave**: ¿De qué trata la app? (Ej: "Dashboard financiero", "App de citas", "E-commerce de moda")
- **Preferencia estética**: (Ej: "Minimalista", "Cyberpunk", "Glassmorphism", "Corporativo", "Vibrante")
- **Colores base (opcional)**: Si el usuario ya tiene un color de marca.

## Workflow

1.  **Definición de Concepto y Vibe (`Plan`)**:
    - Confirmar la "personalidad" de la marca.
    - Elegir paleta de colores (Primary, Secondary, Accent, Backgrounds, Text). _Nota: Usar HSL/RGB para flexibilidad._
    - Elegir tipografía (Google Fonts modernas como Inter, Roboto, Outfit, Poppins).

2.  **Generación de Tokens de Diseño (`Ejecutar`)**:
    - Definir variables CSS / Tailwind config para:
      - Colores (50-950 scale si es necesario, o semantic naming: primary, primary-foreground, etc.).
      - Espaciado (spacing scale).
      - Radios de borde (radius).
      - Sombras (shadows - focus on soft, layered shadows for premium feel).

3.  **Definición de Componentes Base (`Ejecutar`)**:
    - Botones (estados hover/active, variantes solid/outline/ghost).
    - Inputs (estados focus/error, consistencia con botones).
    - Tarjetas (Cards) y Contenedores (uso de fondos, bordes sutiles o vidrio).
    - Consultar el recurso `recursos/design-template.md` para la estructura.

4.  **Entrega (`Revisar`)**:
    - Crear el archivo `DESIGN_SYSTEM.md` con la documentación completa.
    - (Opcional) Crear `theme.css` o `tailwind.config.js` si el proyecto lo requiere.

## Instrucciones Críticas (Estética Premium)

- **NO** uses colores saturados puros (ej: `#FF0000`, `blue`). Usa matices (ej: `hsl(0, 70%, 50%)`, `slate-900` en lugar de `#000`).
- **NO** uses bordes negros por defecto. Usa bordes sutiles (ej: `border-gray-200` o `border-white/10`).
- **SÍ** usa "espacio blanco" generoso.
- **SÍ** define `hover` states para todo elemento interactivo.

## Output (Formato exacto)

Devolver la confirmación de creación del archivo `DESIGN_SYSTEM.md` que contenga:

1.  **Resumen de Estilo**: Descripción breve del look & feel.
2.  **Paleta de Colores**: Muestras visuales (hex combinados) y usos semánticos (Background, Surface, Primary...).
3.  **Tipografía**: Familias, pesos y escala (h1, h2, p, small).
4.  **UI Elements**: Descripción de botones, inputs y cards (radius, shadow).
5.  **Implementación Técnica**: Bloque de código CSS/Tailwind listo para copiar.
