# UI Registry

Living document for AppForge UI Components. Used by the `/imprint` skill. 
Read this before building any new component to keep AppForge visually cohesive.

---

## How to Use

Before building any component:
1. Check if a similar component already exists here.
2. If yes — match its exact classes.
3. If no — build it following `ui-rules.md` and `ui-tokens.md`, then add it here via `/imprint`.

---

## Component Layouts — Imprinted Phase 1 & 2

### Layout Structural Blocks
*Navbar, AppHeader, Page Containers*
```text
Container class: max-w-[1200px] mx-auto px-6 w-full
Flex Row Layout class: flex flex-row items-center gap-X
Flex Stack Layout class: flex flex-col gap-X
Responsive Grid class: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-X gap-X
```

### Shared Design System Primitives (Phase 7i Reference Specification)

**Buttons (`components/ui/button.tsx`)**
```text
All buttons are full pills: rounded-full (radius 9999).
Sizes:
  lg: h-[44px] px-[22px] text-[15px] font-medium
  md: h-[36px] px-[16px] text-[14px] font-medium
  sm: h-[30px] px-[12px] text-[13px] font-medium
Primary Light:
  background: linear-gradient(180deg, #2B2B35 0%, #0D0D12 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 1px 2px rgba(0,0,0,.25), 0 10px 28px -10px rgba(88,70,220,.6);
  color: #FFFFFF;
  hover: translateY(-1px) + stronger glow; active: scale(0.98);
Primary Dark:
  background: linear-gradient(180deg, #FFFFFF, #E6E6EE);
  color: #0B0B10;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 10px 28px -10px rgba(88,70,220,.6);
Secondary Light:
  background: rgba(255,255,255,.72); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,.9);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 6px 20px -8px rgba(60,50,150,.22);
Secondary Dark:
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.10);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
```

**Icon Button (`components/ui/icon-button.tsx`)**
```text
Neutral glass circles: rounded-full aspect-square.
Sizes: lg (44px), md (36px), sm (30px).
Light: glass-2 / hover:bg-black/5; Dark: glass-2-nested / hover:bg-white/10.
Theme toggle Moon icon uses neutral currentColor text (no bright blue fill).
```

**Glass Surfaces (`components/ui/glass-surface.tsx`)**
```text
glass-1: Floating chrome & popovers
  Light: linear-gradient(135deg, rgba(255,255,255,.86), rgba(255,255,255,.76)), blur(24px) saturate(180%)
  Dark (Smoked Glass): rgba(20,20,26,.78), blur(28px) saturate(140%), 1px rgba(255,255,255,.08) border, inset 0 1px 0 rgba(255,255,255,.07), shadow: 0 30px 80px -30px rgba(0,0,0,.85)
glass-2-nested / glass-3:
  Dark: SOLID #18181F / #1F1F27 with zero blur (backdrop-filter: none)
```

**Card Containers (`components/ui/card.tsx`)**
```text
Content surfaces: near-solid with a glass rim.
Light: bg-card (#FFFFFF) border border-border shadow-xs rounded-2xl
Dark: bg-[#121217] border border-white/10 rounded-2xl
```

**Status Pills (`components/ui/status-pill.tsx`)**
```text
Full pill: rounded-full text-[13px] font-medium with status dot.
Published / Running / Active: success-light / success-text
Draft / Idle / Inactive: muted / muted-foreground
Failed / Error: error-light / error-text
```

**Input & Hero Glass Input (`components/ui/input.tsx`)**
```text
Pill Input: rounded-full h-9 px-4 text-[14px]
Hero Glass Input: h-14 (56px) rounded-[20px] glass-1 px-4
```

**Builder Floating Chat Pill (`components/builder/CopilotFloatingPill.tsx`)**
```text
Docked bottom-center: w-[94vw] max-w-[560px] h-[52px] rounded-full glass-1
Expands smoothly upward on focus or ⌘K to ~560×520px chat panel with message history.
Esc or outside click collapses back to 52px pill.
Respects prefers-reduced-motion.
```

### Home Landing Overhaul Layout (Apple Liquid Glass Material System & Component Details)

**Glass Material Utilities (3 Levels)**
```text
glass-1 (Floating Frosted Top Bar Pill & Demo Panels):
  Light: linear-gradient(135deg, rgba(255,255,255,.86), rgba(255,255,255,.76)), blur(24px) saturate(180%), border: 1px solid rgba(255,255,255,.90), specular top: inset 0 1px 0 rgba(255,255,255,.95), inset 0 -1px 0 rgba(255,255,255,.30), shadow: 0 20px 50px -20px rgba(70,60,170,.16), ::before specular sheen
  Dark: linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,.025)), blur(24px) saturate(180%), border: 1px solid rgba(255,255,255,.08), specular: inset 0 1px 0 rgba(255,255,255,.08), shadow: 0 24px 60px -24px rgba(0,0,0,.70)

glass-2 (Standalone Secondary Buttons, e.g. View Templates):
  Light: linear-gradient(135deg, rgba(255,255,255,.75), rgba(255,255,255,.40)), blur(16px) saturate(180%), border: 1px solid rgba(255,255,255,.80), inset 0 1px 0 rgba(255,255,255,.95), isolate, overflow:hidden
  Dark: linear-gradient(135deg, rgba(255,255,255,.10), rgba(255,255,255,.04)), blur(16px) saturate(180%), border: 1px solid rgba(255,255,255,.12), shadow: 0 8px 24px -6px rgba(0,0,0,.5)

glass-2-nested (File Tab, Copy Button, Chips inside Glass Panels — NO backdrop-filter):
  Light: rgba(255,255,255,.65), border: 1px solid rgba(255,255,255,.80), inset 0 1px 0 rgba(255,255,255,.90)
  Dark: rgba(255,255,255,.05), border: 1px solid rgba(255,255,255,.10), inset 0 1px 0 rgba(255,255,255,.08)

glass-3 (Floating Table Rows & Icon Tiles — NO backdrop-filter):
  Light: rgba(255,255,255,.70), border: 1px solid rgba(255,255,255,.85), inset 0 1px 0 rgba(255,255,255,.95), 0 2px 8px -2px rgba(30,30,80,.05)
  Dark: rgba(255,255,255,.04), border: 1px solid rgba(255,255,255,.08), inset 0 1px 0 rgba(255,255,255,.08), 0 4px 12px -2px rgba(0,0,0,.35)

glass-3-tile (40px Circle Icon Tiles):
  Light: 40px circle, rgba(255,255,255,.92), border rgba(255,255,255,.95), inset 0 1px 0 #FFF
  Dark: 40px circle, rgba(255,255,255,.08), border rgba(255,255,255,.12)
```

**Brighter Headline Gradient (Applied Only to 'driven Apps')**
```text
bg-gradient-to-r from-[#7C5CFF] to-[#4F6BFF] dark:from-[#9D8CFF] dark:to-[#6B85FF] bg-clip-text text-transparent
```

**Deepened Metric Card (High-Contrast Periwinkle with Confined Chart)**
```text
rounded-2xl bg-gradient-to-r from-[#5B60C8] via-[#6B71D4] to-[#8A82E3] dark:from-[#3730A3]/90 dark:via-[#4338CA]/90 dark:to-[#4F46E5]/80 border border-white/60 dark:border-white/15 text-white p-5 relative overflow-hidden (Chart confined to bottom-right 45% below icon)
```

**Floating Table Rows (One Shared CSS Grid, Restored Kebab, 16px Column Gap)**
```text
Header: grid grid-cols-[1.5fr_1fr_1fr_32px] gap-x-4 items-center px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400
Rows: flex flex-col gap-2.5, each row: glass-3 rounded-2xl h-[56px] px-4 grid grid-cols-[1.5fr_1fr_1fr_32px] gap-x-4 (15px weight 500 name, 13px mono trigger, 32px kebab button)
```

**Restyled Feature Section ("Instant Architecture. Zero Friction.")**
```text
Section Header: 48px font-bold, tracking -0.03em, 128px above, muted subhead 17px/1.6
Container: max-w-[1200px] mx-auto px-4 sm:px-6 w-full, 112px between alternating rows
Text Column (5/12):
  Icon Tile: 40px rounded-[12px] glass-2 with violet/indigo accent tint (text-indigo-600 dark:text-indigo-400)
  Title: 28px font-semibold tracking-[-0.02em] text-slate-900 dark:text-slate-100
  Body: 17px line-height 1.65 text-slate-600 dark:text-slate-400 max-w-[46ch]
Visual Card (7/12):
  Outer: glass-1 rounded-[28px] p-5 sm:p-10 w-full min-h-[380px] sm:min-h-[420px]
  Inner tiles: glass-3 filling ~70% of card with unified accent tint (soft red isolated to error boundary)
  Responsive: flex flex-col sm:flex-row stacking on mobile <sm, horizontal on >=sm
```

**Restyled Footer**
```text
Container: max-w-[1200px] mx-auto px-4 sm:px-6 w-full flex flex-col sm:flex-row items-center justify-between py-[48px] gap-4
Border: border-t border-slate-200/60 dark:border-white/10
Left: Logo mark + AppForge text-semibold + muted tagline 14px
Right: Terms, Privacy links 14px text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white
```

---

## Base Architecture Components

### AppCard & Live Thumbnail
*Main dashboard application card displaying a scaled-down 16:10 live registry preview and metadata.*
```text
Container: group cursor-pointer bg-card border border-border hover:border-border-strong rounded-lg overflow-hidden transition-colors duration-150 flex flex-col relative select-none
Thumbnail Frame: aspect-[16/10] w-full overflow-hidden bg-background border-b border-border select-none pointer-events-none
Card Body: p-3.5 sm:p-4 flex flex-col justify-between flex-1 gap-2
Title: text-[16px] font-semibold text-foreground truncate
Metadata / Time: text-[13px] text-muted-foreground mt-0.5
Status Badge: inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[13px] font-medium shrink-0 whitespace-nowrap
```

### PromptBox (Command Bar & Generation)
*Top-level prompt input with example chips and template link.*
```text
Container: bg-card border border-border rounded-lg p-4 transition-colors
Input: h-12 px-2 text-base text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none
Submit Button: h-9 px-4 text-sm font-medium rounded-md bg-primary hover:bg-[var(--primary-hover)] text-primary-foreground (disabled: bg-muted text-muted-foreground)
Example Chips: text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 px-2.5 py-1 rounded border-0
Shown Condition: while input is focused or with fewer than 3 apps
```

### Container-Aware Core Renderers (Tailwind v4 Container Queries)
*Responsive renderers query container width, preventing overflow in narrow preview frames.*
```text
Preview Frame Root: @container flex-1 overflow-y-auto p-4 @sm:p-6 bg-card min-w-0
Grid Wrapper: @container w-full min-w-0
Adaptive Columns: grid-cols-1 @[420px]:grid-cols-2 @[720px]:grid-cols-3 @[960px]:grid-cols-4
Card: @container h-full bg-card border border-border rounded-lg p-4 min-w-0
Card Hierarchy: Title is primary (text-[16px] font-semibold text-foreground), Subtitle is secondary (text-[13px] text-muted-foreground)
Card Divider Rule: Inside Card, content children use divide-y divide-border/60 with at most ONE bordered surface
Statistic (Standalone): @container bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm min-w-0
Statistic (Inside Card): @container bg-transparent border-0 rounded-none shadow-none p-2 min-w-0
Statistic Typography: font-sans tabular-nums font-bold text-foreground clamp(1.125rem, 5cqi + 0.5rem, 1.875rem)
Trend Arrow & Color: Arrow follows sign (+ up, - down). Color defaults to neutral (text-muted-foreground) unless explicit sentiment ("positive" -> text-success-text | "negative" -> text-error-text) is passed.
```
