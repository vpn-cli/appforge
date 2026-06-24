# UI Tokens

Design tokens for AppForge. Use these exact values throughout the codebase — never hardcode colors or use raw Tailwind color classes in components. We use a sleek IDE/developer-tool color palette.

---

## How to Use

This project uses **Tailwind CSS v4**. All design tokens are defined using the `@theme` directive in `app/globals.css`. No `tailwind.config.ts` needed for colors or tokens.

```tsx
// Correct
className="bg-surface text-text-primary border-border"

// Never
className="bg-[#F6F7FB] text-[#101828]"
className="bg-purple-500 text-gray-600"
```

---

## globals.css — Complete Token Definition

```css
@import "tailwindcss";

@theme {
  /* Font */
  --font-sans: "Inter", sans-serif;

  /* Page and surface backgrounds */
  --color-background: #fdfdfd;       /* Clean app builder background */
  --color-surface: #ffffff;          /* Panels and cards */
  --color-surface-secondary: #f9fafb;
  --color-surface-tertiary: #f3f4f6;

  /* Borders */
  --color-border: #e5e7eb;
  --color-border-focus: #c7d2fe;
  --color-border-dark: #d1d5db;

  /* Text */
  --color-text-primary: #111827;     /* High contrast reading */
  --color-text-secondary: #4b5563;   /* Secondary read */
  --color-text-muted: #9ca3af;       /* Inactive */
  --color-text-inverse: #ffffff;

  /* Brand / Primary — A deep reliable blue */
  --color-brand: #3b82f6;
  --color-brand-dark: #2563eb;
  --color-brand-light: #eff6ff;

  /* Validation Colors */
  --color-error: #ef4444;            /* Hard JSON errors */
  --color-error-light: #fef2f2;
  --color-error-border: #fca5a5;
  --color-error-text: #b91c1c;

  --color-warning: #f59e0b;          /* Validation warnings */
  --color-warning-light: #fffbeb;
  --color-warning-border: #fcd34d;
  --color-warning-text: #b45309;

  --color-success: #10b981;
  --color-success-light: #ecfdf5;

  /* Overlays */
  --color-overlay: rgba(17, 24, 39, 0.5);

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
}
```

---

## Validation Tokens (Crucial for AppForge)

The builder must degrade gracefully and communicate errors clearly without screaming visually.

| Element                     | Background              | Border                    | Text                     |
| --------------------------- | ----------------------- | ------------------------- | ------------------------ |
| Unknown Component Fallback  | `bg-error-light`        | `border-error-border`      | `text-error-text`        |
| Validation Panel Warning    | `bg-warning-light`      | `border-warning-border`    | `text-warning-text`      |
| Valid Config Notification   | `bg-success-light`      | `border-success`           | `text-success`           |

---

## Typography

Font family: **Inter**

| Element              | Size | Weight | Line height | Color token           |
| -------------------- | ---- | ------ | ----------- | --------------------- |
| Logo / Brand         | 18px | 700    | 24px        | `text-text-primary`   |
| Panel Headers        | 13px | 600    | 20px        | `text-text-primary`   |
| Code / Editor Text   | 13px | 400    | 20px        | `text-text-secondary` |
| Labels / Metadata    | 12px | 500    | 16px        | `text-text-secondary` |

---

## Component Tokens

### Builder Panels

```
background: bg-surface
border-right/left: 1px solid var(--border)
```

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
border-radius: rounded-md
padding: px-3 py-1.5
```

---

## Invariants

- Never use raw Hex codes inside components.
- Never invent color utilities not specified via `@theme`.
- The App Runtime UI should NOT automatically inherit AppForge Editor tokens unless specified via configuration.
