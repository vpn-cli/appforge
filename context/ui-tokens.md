# UI Tokens

Design tokens for AppForge. We use a unified Brand Violet (`#6D28D9` / `rgb(109, 40, 217)`), Blush (error), Peach (warning), and Mint (success), engineered to meet or exceed WCAG 2.2 AA (>= 4.5:1) in both Light and Dark themes.

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

- UI & Body Font: **Inter** (`--font-sans`)
- Code & Tabular Data: **SF Mono / Geist Mono stack** (`--font-mono`): `"SF Mono"`, `ui-monospace`, `SFMono-Regular`, `Menlo`, `<Geist Mono>`, `monospace`

| Element              | Font / Token          | Contrast (Light / Dark) |
| -------------------- | --------------------- | ----------------------- |
| Body / General       | `text-text-primary`   | 18.97:1 / 19.80:1 (AA)  |
| Panel Headers        | `text-text-primary`   | 18.97:1 / 19.80:1 (AA)  |
| Secondary / Muted    | `text-text-secondary` | 7.14:1 / 7.66:1 (AA)    |
| Code / AST Schema    | `font-mono text-xs`   | 7.14:1 / 7.66:1 (AA)    |
| Primary Brand Text   | `text-brand`          | 6.81:1 / 7.27:1 (AA)    |

---

## Density & Heights

High-density developer tool standards (Linear / Raycast / Vercel style):

| Control Type         | Height Token          | Usage |
| -------------------- | --------------------- | ----- |
| Compact Badges/Btns  | `h-7` (28px)          | Table cell actions, tag pills |
| Standard Inputs/Btns | `h-8` (32px)          | Form controls, toolbar actions |
| Hero / Primary CTAs  | `h-9` (36px) - `h-10` | Primary page submission |
| App / Studio Toolbar | `h-11` (44px)         | Top builder chrome bar |

---

## State & Validation Tokens (WCAG 2.2 AA Verified)

| Role | Light Value (Text / Bg) | Dark Value (Text / Bg) | Contrast |
| :--- | :--- | :--- | :--- |
| **Brand** | `#6D28D9` on `#FFFFFF` | `#A78BFA` on `#27272A` | 7.10:1 / 6.59:1 ✅ |
| **Error** | `#8C2E44` on `#FBEAEE` | `#F472B6` on `#2E1119` | 6.99:1 / 6.55:1 ✅ |
| **Warning** | `#784A15` on `#FDF1E7` | `#FBBF24` on `#2D1E0A` | 6.78:1 / 9.66:1 ✅ |
| **Success** | `#2F7A55` on `#EAF7F0` | `#34D399` on `#0B281A` | 4.72:1 / 8.20:1 ✅ |

---

## Invariants
- **Single Brand Token**: Unified Violet `#6D28D9` across `@theme`, Clerk modal, and Landing custom cursor.
- **Never use raw Hex codes** inside components.
- **Never invent color utilities** not specified via `@theme`.
- **Film-Grain Overlay**: Locked `body::after` feTurbulence noise (z-index 9999, pointer-events none).
- **Cursor**: Custom cursor scoped strictly to `/`. Native system cursors on all text, inputs, and in-app screens.
