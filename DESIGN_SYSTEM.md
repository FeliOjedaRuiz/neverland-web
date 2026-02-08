# Neverland - Design System Premium

## 1. Brand Identity & Vibe

**Core Concept:** Un espacio mágico ("Neverland") que combina la diversión infantil con un servicio profesional para padres.
**Vibe:** Lúdico, Cálido, Seguro, Mágico pero Moderno.
**Aesthetics:** "Soft Playfulness" – Formas redondeadas, colores cálidos, sombras suaves y fondos sólidos para máxima legibilidad.

## 2. Color Palette (Tokens)

Hemos unificado la paleta para garantizar contraste y armonía.

| Token                  | Nombre Original   | Hex       | Uso Principal                                          |
| ---------------------- | ----------------- | --------- | ------------------------------------------------------ |
| `primary`              | Energy Orange     | `#F07D3E` | Botones CTA (Reservar), Destacados vibrantes           |
| `primary-foreground`   | White             | `#FFFFFF` | Texto sobre botones naranjas                           |
| `secondary`            | Neverland Green   | `#24635A` | Bordes sutiles, Textos de encabezado, Hovers           |
| `secondary-foreground` | White             | `#FFFFFF` | Texto sobre fondos verdes oscuros                      |
| `accent`               | Sun Yellow        | `#F9C835` | Detalles, Iconos, Elementos decorativos                |
| `background`           | Cream BG          | `#FDEBD0` | Fondo general de la página (evita blanco puro)         |
| `surface`              | White/Cream Light | `#FFF9F0` | Tarjetas, Modales, Menús desplegables                  |
| `text-main`            | Text Black        | `#1A1A1A` | Texto de lectura principal                             |
| `text-muted`           | Silhouette Green  | `#2D5A4C` | Texto secundario o descriptivo                         |
| `success`              | (New) Soft Green  | `#45B18D` | Mensajes de éxito, Checks (El verde original del logo) |

**Regla de Oro:** No usar negro puro (`#000`). Usar `#1A1A1A` para textos.

## 3. Typography (Implementada)

Hemos reemplazado la clásica **VAG Rounded** (que suele requerir licencia paga y es más pesada) por una combinación moderna de Google Fonts que mantiene la esencia pero optimiza el rendimiento web.

**Primary Font (Títulos):** `Fredoka`

- **Vibe:** Es la "hermana moderna" de VAG Rounded. Geométrica, suave y muy divertida, pero con mejor legibilidad en pantallas.
- **Uso:** Clases `font-display`.
- **Pesos:** 600 (SemiBold) para subtítulos, 700 (Bold) para titulares.

**Secondary Font (Cuerpo):** `Nunito`

- **Vibe:** Redondeada y equilibrada. Excelente legibilidad para párrafos largos sin perder el toque "child-friendly".
- **Uso:** Clases `font-sans` (automático en toda la web).
- **Pesos:** 400 (Regular) para texto, 600/700 para botones.

### Escala Tipográfica Recomendada

- **H1**: `text-4xl md:text-5xl font-display font-bold`
- **H2**: `text-3xl md:text-4xl font-display font-semibold`
- **H3**: `text-xl md:text-2xl font-display font-medium text-neverland-green`
- **Body**: `text-base md:text-lg font-sans text-text-black leading-relaxed`

## 4. UI Components & Physics

### Botones (`.btn`)

- **Shape**: `rounded-full` (Píldora). Máxima amabilidad.
- **Shadow**: `shadow-md` en reposo, `shadow-lg` en hover.
- **Interaction**: `hover:scale-105 active:scale-95 transition-all duration-300`.
- **Variant Primary**: `bg-energy-orange text-white hover:bg-[#E06D2E]`.

### Tarjetas (`.card`)

- **Background**: `bg-white/80` o `bg-surface` con `backdrop-blur-sm` (Efecto vidrio).
- **Border**: `border border-neverland-green/10` (Muy sutil).
- **Radius**: `rounded-2xl` o `rounded-3xl` (Grandes curvas).
- **Shadow**: `shadow-sm` que pasa a `shadow-md` al hacer hover.

### Inputs

- **Background**: `bg-white`.
- **Border**: `border-gray-200` focus: `border-neverland-green` ring-2 ring-neverland-green/20.
- **Radius**: `rounded-xl`.

## 5. Implementación Técnica (Tailwind Config Update)

Copia y pega esta configuración en `web/tailwind.config.js` para activar el sistema:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				// Brand Colors
				'neverland-green': '#24635A', // Tono oscuro/serio para UI
				'brand-green-light': '#45B18D', // Tono logo original
				'energy-orange': '#F07D3E',
				'sun-yellow': '#F9C835',
				'rec-blue': '#4B8CC8',
				'cream-bg': '#FDEBD0',
				surface: '#FFF9F0', // Nuevo: para cards

				// Semantic Colors
				'text-black': '#1A1A1A',
				'text-muted': '#2D5A4C',
			},
			fontFamily: {
				// Necesitas importar estas fuentes en index.html primero
				sans: ['Nunito', 'sans-serif'],
				display: ['Fredoka', 'sans-serif'],
			},
			borderRadius: {
				'3xl': '1.5rem', // Para cards grandes
			},
			boxShadow: {
				soft: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', // Sombra premium suave
			},
		},
	},
	plugins: [require('tailwind-animations')],
};
```

### Acciones Pendientes

1.  **Google Fonts**: Añadir el `<link>` en `index.html` para `Fredoka` y `Nunito`.
2.  **Refactor**: Buscar botones antiguos y aplicar las clases `rounded-full` y `shadow-md`.
