# [Nombre del Proyecto] - Design System

## 1. Brand Identity

**Vibe:** [e.g. Modern, Clean, Trustworthy]
**Keywords:** [e.g. Speed, Security, Elegance]

## 2. Color Palette

| Token                | Value (Hex/HSL) | Usage                        |
| -------------------- | --------------- | ---------------------------- |
| `primary`            | ...             | Main actions, brand identity |
| `primary-foreground` | ...             | Text on primary backgrounds  |
| `secondary`          | ...             | Less prominent actions       |
| `background`         | ...             | Page background              |
| `surface`            | ...             | Cards, modals, sidebars      |
| `text-main`          | ...             | Primary content text         |
| `text-muted`         | ...             | Secondary text, placeholders |
| `accent`             | ...             | Highlights, notifications    |

## 3. Typography

**Primary Font:** [Name] (Titles)
**Secondary Font:** [Name] (Body)

| Style     | Element | Size/Weight | Letter Spacing |
| --------- | ------- | ----------- | -------------- |
| Heading 1 | h1      | ...         | ...            |
| Body      | p       | ...         | ...            |
| Button    | .btn    | ...         | ...            |

## 4. UI Components (Physics & Feel)

- **Border Radius:** [e.g. 0.5rem (8px) for buttons, 1rem (16px) for cards]
- **Shadows:** [e.g. Soft diffused shadows: `0 4px 6px -1px rgb(0 0 0 / 0.1)`]
- **Animation:** [e.g. 200ms ease-out for hover effects]

## 5. Implementation Code

```css
:root {
	/* Colors */
	--primary: ...;
	--bg-color: ...;

	/* Typography */
	--font-sans: 'Inter', sans-serif;

	/* Radii */
	--radius-sm: 4px;
}
```
