# UI Tokens

Design tokens for AppForge. We use a sleek pastel palette with Lavender (brand), Blush (danger), Peach (warning), and Mint (success). 

---

## How to Use

This project uses **Tailwind CSS v4**. All design tokens are defined using the `@theme` directive in `app/globals.css`.

```tsx
// Correct
className="bg-surface text-text-primary border-border"

// Never
className="bg-[#F6F7FB] text-[#101828]"
className="bg-purple-500 text-gray-600"
```

---

## Typography

Font family: **Inter** & **JetBrains Mono**

| Element              | Color token           |
| -------------------- | --------------------- |
| Logo / Brand         | `text-text-primary`   |
| Panel Headers        | `text-text-primary`   |
| Code / Editor Text   | `text-text-secondary` |
| Labels / Metadata    | `text-text-secondary` |

---

## Component Tokens

### Buttons

**Primary:**
```
background: bg-brand
text: text-text-inverse
border-radius: rounded-md
padding: px-3 py-1.5
```

**Secondary:**
```
background: bg-surface
border: border border-border
text: text-text-primary
```

---

## Invariants
- Never use raw Hex codes inside components.
- Never invent color utilities not specified via `@theme`.
