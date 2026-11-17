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

### Standard Base Components

**Card Containers**
```text
bg-card border border-border hover:border-border-strong rounded-lg transition-colors
(No shadow on cards)
```

**Primary Buttons (Black in Light, White in Dark)**
```text
bg-primary hover:bg-[var(--primary-hover)] text-primary-foreground h-9 px-4 rounded-md font-medium text-sm transition-colors
Disabled: bg-muted text-muted-foreground border-transparent cursor-not-allowed
```

**Secondary / Outline Buttons**
```text
bg-card hover:bg-muted border border-border text-foreground h-9 px-3.5 rounded-md font-medium text-sm transition-colors
```

**Status Badges / Pills**
```text
Published (Success): inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[13px] font-medium bg-success-light text-success-text border border-success-border
Draft (Neutral): inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[13px] font-medium bg-muted text-muted-foreground border border-border
```

### Home Landing Overhaul Layout (Apple Liquid Glass Material System)

**Glass Material Utilities (3 Levels)**
```text
glass-1 (Floating Frosted Top Bar Pill & Demo Panels):
  Light: linear-gradient(135deg, rgba(255,255,255,.65), rgba(255,255,255,.32)), blur(24px) saturate(180%), border: 1px solid rgba(255,255,255,.70), specular top: inset 0 1px 0 rgba(255,255,255,.95), inset 0 -1px 0 rgba(255,255,255,.25), shadow: 0 20px 50px -20px rgba(70,60,170,.22), ::before specular sheen
  Dark: linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.03)), blur(24px) saturate(180%), border: 1px solid rgba(255,255,255,.10), specular: inset 0 1px 0 rgba(255,255,255,.10), shadow: 0 24px 60px -24px rgba(0,0,0,.60)

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

**Restrained Headline Gradient (Applied Only to 'driven Apps')**
```text
bg-gradient-to-r from-[#5B21B6] via-[#4338CA] to-[#3730A3] dark:from-[#A78BFA] dark:via-[#818CF8] dark:to-[#6366F1] bg-clip-text text-transparent
```

**Desaturated Metric Card (Translucent Periwinkle with Soft Wave)**
```text
rounded-2xl bg-gradient-to-r from-[#8B93E8]/90 via-[#9BA3EC]/85 to-[#B9B4F0]/85 dark:from-[#4338CA]/50 dark:via-[#4F46E5]/40 dark:to-[#7C3AED]/35 border border-white/70 dark:border-white/15 text-white p-5 relative overflow-hidden
```

**Floating Table Rows (No Bordered Container, 56px Rows, 40px Icon Tiles, Outside Headers)**
```text
Header: grid grid-cols-[1.5fr_1.2fr_1fr_28px] items-center px-4 py-1 text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300
Rows: flex flex-col gap-2.5, each row: glass-3 rounded-2xl h-[56px] px-4 grid grid-cols-[1.5fr_1.2fr_1fr_28px]
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
