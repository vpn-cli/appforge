# UI Tokens

Design tokens for AppForge. Monochrome palette (color only for meaning: success, warning, error, accent), engineered to meet or exceed WCAG 2.2 AA (>= 4.5:1 text, >= 3.0:1 non-text) in both Light and Dark themes.

---

## How to Use

This project uses **Tailwind CSS v4**. All design tokens are defined using the `@theme` directive in `app/globals.css`.

```tsx
// Correct
className="bg-card text-foreground border-border hover:border-border-strong"

// Never
className="bg-[#FBFBFA] text-[#111110]"
className="bg-purple-500 text-gray-600"
```

---

## Palette (Monochrome, Color Only for Meaning)

### Light Theme
- `--background`: `#FBFBFA`
- `--surface/card`: `#FFFFFF`
- `--raised/muted`: `#F4F4F2`
- `--border`: `#E6E5E1`
- `--border-strong` (inputs): `#8F8E88`
- `--foreground`: `#111110`
- `--muted-foreground`: `#63625C`
- `--primary`: `#111110` (primary buttons are BLACK)
- `--primary-foreground`: `#FFFFFF`
- `--primary-hover`: `#2A2A28`
- `--accent`: `#1D4ED8` (links, focus ring, selection, active nav only)

### Dark Theme
- `--background`: `#0F0F0E`
- `--surface/card`: `#171716`
- `--raised/muted`: `#1F1F1D`
- `--border`: `#2B2A28`
- `--border-strong` (inputs): `#6E6D68`
- `--foreground`: `#EDEDEA`
- `--muted-foreground`: `#A3A29C`
- `--primary`: `#EDEDEA` (primary buttons are WHITE)
- `--primary-foreground`: `#111110`
- `--primary-hover`: `#D6D6D2`
- `--accent`: `#8AB4F8`

### Semantic Tokens (Light / Dark)
Each with text color, tinted background, and border:
- **Success**: `#166534` on `#ECFDF3` / `#4ADE80` on `#0F2417`
- **Warning**: `#B54708` on `#FFFAEB` / `#FBBF24` on `#2A1F07`
- **Error**: `#B42318` on `#FEF3F2` / `#F87171` on `#2A1110`

---

## Type Scale

- Base body: 15px, line-height 1.55
- Nav and buttons: 14px medium (`text-sm font-medium`)
- Meta text: 13px minimum (`text-[13px]`, never 12px in the chrome)
- Page title: 30px semibold, letter-spacing -0.02em (`text-[30px] font-semibold tracking-[-0.02em]`)
- Section headings: 18px semibold (`text-[18px] font-semibold`)
- Card titles: 16px semibold (`text-[16px] font-semibold`)
- Controls: buttons and inputs 36px tall (`h-9`), prompt input 48px tall (`h-12`) with 16px text (`text-base`)
- Content container: max-width 1200px (`max-w-[1200px]`), aligned left edge across header, title row, and grid.

---

## Rules
- Logo, org avatar, and every brand mark are monochrome (foreground on raised: `bg-muted text-foreground`). No green, no purple in the chrome.
- Disabled buttons: `--raised` background (`bg-muted`), `--muted-foreground` text (`text-muted-foreground`), no tint. Generate is enabled (black/white) as soon as the input has text.
- Success, warning, and error colors appear only for status, never as decoration.
- Film grain overlay: locked `body::after` feTurbulence noise (z-index 9999, pointer-events none).
