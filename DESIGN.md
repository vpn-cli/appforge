# AppForge Design System Specification (DESIGN.md)

This document establishes the official design tokens and visual principles for AppForge, tailored for high-craft, restrained software UI (Linear / Vercel / Stripe caliber).

---

## 1. Direction & Aesthetic Identity

- **Visual Direction**: Soft lavender atmospheric field, frosted light surfaces with multi-stop backdrop blur, a single large sculpted glass ribbon behind the top-right viewport, and a disciplined violet/indigo accent ramp.
- **Core Principle**: Restraint over decoration. Optical alignment, typographic rhythm, 1px rgba hairline borders, two-layer ambient+diffuse soft shadows, and zero visual clutter.
- **Rules**:
  - No eyebrow pills or kickers.
  - No emoji in chrome or data.
  - No nested bordered boxes ("card inside a card"). Every panel is a single coherent frosted surface.
  - No hardcoded hex values or raw Tailwind arbitrary colors in components.
  - Max body line width capped at 60ch.
  - All icons from Lucide only with consistent 1.5px/1.75px stroke.

---

## 2. Typographic Scale & Rhythm

### Font Families
- **Display & Sans**: Inter / Geist Sans (`--font-sans`, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)
- **Code & Numbers**: JetBrains Mono / SF Mono / Geist Mono (`--font-mono`, monospace)

### Hierarchy
| Role | Size / Clamp | Weight | Line Height | Tracking | Purpose |
|------|--------------|--------|-------------|----------|---------|
| **Display Headline** | `clamp(48px, 6vw, 76px)` | 700 | 1.02 | `-0.035em` | Hero landing title |
| **Hero Subtitle** | `17px–18px` | 400 | 1.6 | `-0.01em` | Explanatory copy (max 60ch) |
| **Section Headings** | `20px` | 600 | 1.3 | `-0.02em` | Major structural sections |
| **Panel Headers / Tabs** | `14px–15px` | 500 / 600 | 1.4 | `-0.01em` | Top nav, segmented controls |
| **Small Caps / Meta** | `12px` | 600 | 1.2 | `0.06em` | Small caps section tags |
| **Data & Code** | `13px` | 400 / 500 | 1.6 | `0em` | Code lines, table rows, JSON |

*Floor rule: Nothing rendered below 12px.*

---

## 3. Color Tokens

### 3.1 Neutral Scale (Slate Ramp)
| Token | Light Theme | Dark Theme | Purpose |
|-------|-------------|------------|---------|
| `--bg-canvas` | `#EEF0FA` → `#F5F6FD` | `#0B0D17` → `#0E1122` | Cohesive lavender wash |
| `--surface-frosted` | `rgba(255, 255, 255, 0.76)` | `rgba(20, 24, 40, 0.72)` | Frosted glass cards |
| `--surface-subtle` | `rgba(255, 255, 255, 0.50)` | `rgba(255, 255, 255, 0.04)` | Inactive pills, inner wells |
| `--border-hairline` | `rgba(148, 163, 184, 0.22)` | `rgba(255, 255, 255, 0.08)` | 1px card/divider borders |
| `--border-frosted` | `rgba(255, 255, 255, 0.85)` | `rgba(255, 255, 255, 0.12)` | Outer card edge reflection |
| `--text-primary` | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | Headline, labels (contrast > 12:1) |
| `--text-muted` | `#475569` (Slate 600) | `#94A3B8` (Slate 400) | Body copy (WCAG AA pass: ≥ 5.5:1) |
| `--text-faint` | `#64748B` (Slate 500) | `#64748B` (Slate 500) | Line numbers, subtle hints |

### 3.2 Accent Ramp (Single Violet / Indigo System)
| Token | Hex | Role |
|-------|-----|------|
| `--accent-50` | `#EEF2FF` | Soft tinted pill background |
| `--accent-100` | `#E0E7FF` | Hover states on ghost buttons |
| `--accent-200` | `#C7D2FE` | Tinted borders & badges |
| `--accent-400` | `#818CF8` | Dark mode highlights |
| `--accent-500` | `#6366F1` | Gradient start point |
| `--accent-600` | `#4F46E5` | Active accents, gradient midpoint |
| `--accent-700` | `#4338CA` | Gradient endpoint, hover primary |

### 3.3 Semantic Accents
- **Success**: Running status `#16A34A` (dot) on `rgba(22, 163, 74, 0.10)`
- **Idle / Info**: Idle status `#6366F1` (dot) on `rgba(99, 102, 241, 0.10)`

---

## 4. Radii Scale

| Token | Value | Applied To |
|-------|-------|------------|
| `--radius-sm` | `10px` | Small buttons, status badges, copy button |
| `--radius-md` | `14px` | Metric cards, table wrappers, tabs |
| `--radius-lg` | `20px` | Primary outer demo panels |
| `--radius-xl` | `28px` | Floating top bar pill |
| `--radius-full`| `9999px` | Segmented control active pill, avatars, dots |

---

## 5. Shadow Elevation (Two-Layer Soft System)

No harsh, saturated drop shadows. Elevation is rendered via two-step ambient + diffuse layers:

```css
/* Ambient: tight grounding shadow */
/* Diffuse: wide, low-opacity atmospheric bloom */
--shadow-frosted: 0 2px 6px -1px rgba(15, 23, 42, 0.04), 0 20px 48px -12px rgba(99, 102, 241, 0.08);
--shadow-pill: 0 1px 3px rgba(15, 23, 42, 0.06), 0 6px 16px -2px rgba(15, 23, 42, 0.04);
--shadow-hover: 0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 24px 56px -12px rgba(99, 102, 241, 0.12);
```

---

## 6. Spacing & Container System

- **Base Unit**: `4px`
- **8-Step Scale**:
  - `step-1`: `4px` (`0.25rem`)
  - `step-2`: `8px` (`0.5rem`)
  - `step-3`: `12px` (`0.75rem`)
  - `step-4`: `16px` (`1rem`)
  - `step-5`: `24px` (`1.5rem`)
  - `step-6`: `32px` (`2rem`)
  - `step-7`: `48px` (`3rem`)
  - `step-8`: `64px` (`4rem`)
- **Content Container**: `max-w-[1200px] mx-auto w-full px-6` (centered, full-width viewport canvas, zero sidebar).
- **Above-the-Fold Constraint**: At 1440×900, both demo panels sit fully above the 900px fold. At 1280×800, both panels sit mostly above the 800px fold.

---

## 7. Motion & Interaction

- **Headline Entrance**: Fade and rise (`opacity: 0 -> 1`, `translateY: 12px -> 0px`) over 350ms, ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Code Lines Reveal**: Staggered reveal at ~30ms per line (`delay: index * 0.03s`).
- **Rendered Panel Resolution**: Resolves gently after code begins (~250ms delay, 400ms duration).
- **CTA Interaction**: Primary button arrow shifts `+2px` right on hover (`translate-x-0.5`).
- **Reduced Motion**: All animations wrapped in `@media (prefers-reduced-motion: reduce)` with instantaneous fallback.
