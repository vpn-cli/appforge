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
  background: rgba(255,255,255,.82); backdrop-filter: blur(20px); border: 1px solid var(--ink-500) (#6B6B82 - guaranteed 4.92:1 non-text contrast);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.95), 0 1px 3px rgba(23,23,31,.08), 0 4px 14px -3px rgba(109,91,240,.10);
Secondary Dark:
  background: #1F1F2B; backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,.28) (3.51:1 contrast);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.20), 0 2px 8px -2px rgba(0,0,0,.40);
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

**Status Pills (`components/ui/status-pill.tsx` & `registry/components/DataTable.tsx`)**
```text
Full pill: rounded-full text-xs/text-[13px] font-medium with 6px (w-1.5 h-1.5) status dot, palette token tinted background, dark text of same hue, and matching subtle border.
Six semantic tones (`lib/status-colors.ts`):
  success: bg-status-success-bg / text-status-success-text / border-status-success-border / --status-success-dot
  warning: bg-status-warning-bg / text-status-warning-text / border-status-warning-border / --status-warning-dot
  danger:  bg-status-danger-bg  / text-status-danger-text  / border-status-danger-border  / --status-danger-dot
  info:    bg-status-info-bg    / text-status-info-text    / border-status-info-border    / --status-info-dot
  neutral: bg-status-neutral-bg / text-status-neutral-text / border-status-neutral-border / --status-neutral-dot
  violet:  bg-status-violet-bg  / text-status-violet-text  / border-status-violet-border  / --status-violet-dot
DataTable status columns (`type: "status"`, optional `colors?: Record<string, StatusColorTone>`):
  Resolution order: 1) explicit `colors` map -> 2) case-insensitive built-in keyword map -> 3) deterministic FNV-1a hash into neutral or violet.
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

### Home Landing Redesign (MeshGradient Background, Honest Registry Hero & Below-the-Fold Sections)

**Hero Animated Mesh-Gradient Background (`components/home/HeroMeshBackground.tsx`, `components/home/HeroMeshShader.tsx`)**
```text
Library: @paper-design/shaders-react (MeshGradient) — PolyForm Shield License 1.0.0 (Copyright Lost Coast Labs, Inc., http://paper.design) — pinned exact version 0.0.82
Tokens (app/globals.css & lib/shader-tokens.ts):
  Light: --mesh-c1 (#F2F1F9), --mesh-c2 (#CFCBFE), --mesh-c3 (#ADA6FC), --mesh-c4 (#C9D8FF)
  Dark:  --mesh-c1 (#0B0B12), --mesh-c2 (#3E2F9A), --mesh-c3 (#6D5BF0), --mesh-c4 (#2A3A8A)
Parameters: distortion 0.9, swirl 0.5, speed 0.6, minPixelRatio 1, maxPixelCount 1,500,000 (~1.5 DPR cap at 1440×900)
Mask: .hero-mesh-mask (bottom soft fade to canvas color)
Guardrails:
  - Desktop: requestIdleCallback with setTimeout fallback
  - Mobile (pointer: coarse or width < 768px): zero WebGL, static CSS radial-gradient fallback (.hero-mesh-fallback)
  - prefers-reduced-motion: static frame (speed: 0) on desktop, static CSS on mobile
  - Visibility & viewport: pauses on off-screen (IntersectionObserver) and document.hidden (visibilitychange)
Legibility Scrim & Panels:
  - Soft radial gradient in canvas color behind hero headline/subtext ensuring >= 4.5:1 WCAG contrast (dark 5.81:1, light 4.63:1)
  - Smoked glass panels with >= 0.92 opacity preventing background bleed-through
```

**Honest Registry-Rendered Hero (`components/home/HomeHero.tsx`, `DemoCodeCard.tsx`, `DemoPreviewCard.tsx`)**
```text
Hero Wrapper: relative w-full min-h-[90vh] pt-20 flex flex-col overflow-hidden (vertically centered content)
Container: max-w-[1200px] mx-auto px-4 sm:px-6, consistent 8px spacing scale
Single Source of Truth: components/home/heroDemoConfig.ts (HERO_DEMO_CONFIG uses real registry types: Statistic, DataTable)
Left Card (DemoCodeCard): glass-1 rounded-2xl p-4 sm:p-5, 14-line JSON (<=32 chars/line), whitespace-pre-wrap break-words (zero horizontal scroll), Copy button, Zod-validated caption
Right Card (DemoPreviewCard): glass-1 rounded-2xl p-4 sm:p-5, <h2> Rendered Application + StatusPill "Rendered from config" (no fake Live badge), renders HERO_DEMO_CONFIG through real <RenderNode /> components, explicit "Demo data · ComponentRegistry" footer
Viewport Fit: At 1440×900 both cards fully visible with >=96px clearance below and zero clipped rows
```

**Below-the-Fold Sections & Footer (`HowItWorks.tsx`, `WhatsInside.tsx`, `TemplatesStrip.tsx`, `Footer.tsx`)**
```text
Spacing: py-16 sm:py-20, max-w-[1200px] mx-auto px-4 sm:px-6, grid-cols-1 md:grid-cols-3 gap-6
Cards: rounded-2xl bg-card border border-border p-6 (WhatsInside sits on bg-surface-sunken border-y border-border)
Sections:
  1. HowItWorks: 3 steps (01 Describe -> 02 Config -> 03 Running app with database)
  2. WhatsInside: Schema-to-Postgres tables, Zod-validated AI with Groq->Gemini failover, Tenant isolation
  3. TemplatesStrip: 3 real starter templates linking to /templates + "Browse all templates" CTA
Footer: border-t border-border bg-background, token-aligned AppForge mark + tagline, links to /templates, /terms, /privacy
```

### Home Landing Overhaul Layout (Apple Liquid Glass Material System & Component Details)

**Glass Material Utilities (3 Levels)**
```text
glass-1 (Floating Frosted Top Bar Pill & Demo Panels):
  Light: linear-gradient(135deg, rgba(255,255,255,.94), rgba(255,255,255,.84)), blur(24px) saturate(180%), border: 1px solid rgba(255,255,255,.95), specular top: inset 0 1px 0 #FFFFFF, inset 0 -1px 0 rgba(255,255,255,.40), two-layer shadow: 0 4px 12px -2px rgba(35,25,90,.08) contact + 0 24px 64px -16px rgba(45,35,130,.22) ambient, ::before specular sheen
  Dark: rgba(20,20,26,.82), blur(28px) saturate(140%), border: 1px solid rgba(255,255,255,.09), specular: inset 0 1px 0 rgba(255,255,255,.08), two-layer shadow: 0 4px 16px -2px rgba(0,0,0,.60) + 0 32px 80px -20px rgba(0,0,0,.92)

glass-2 (Standalone Secondary Buttons, e.g. View Templates):
  Light: linear-gradient(135deg, rgba(255,255,255,.75), rgba(255,255,255,.40)), blur(16px) saturate(180%), border: 1px solid rgba(255,255,255,.80), inset 0 1px 0 rgba(255,255,255,.95), isolate, overflow:hidden
  Dark: linear-gradient(135deg, rgba(255,255,255,.10), rgba(255,255,255,.04)), blur(16px) saturate(180%), border: 1px solid rgba(255,255,255,.12), shadow: 0 8px 24px -6px rgba(0,0,0,.5)
```

**Hero Scripted Live Edit & Specular Cursor Sheen (`components/home/HeroScriptedEditContext.tsx`)**
```text
Loop timing: 12.0s loop cycle
  Phase 1 (1.8s-3.6s): Types ', "live": true' into line 6 with blinking cursor; line 6 gains soft highlight bg-indigo-500/12
  Phase 2 (3.6s-4.8s): Synchronous reactive updates:
    a) "Invoice Gen" status pill crossfades Idle -> Running
    b) Metric counts up 1,244 -> 1,251 with tabular-nums
    c) "Slack Alerts" row slides down into table
  Phase 3 (4.8s-10.2s): Live hold (~5.4s)
  Phase 4 (10.2s-11.8s): Smooth reset fade
Controls: Pauses when off-screen (IntersectionObserver), pauses on hover; prefers-reduced-motion shows static final state
Glass Specular Sheen: Radial gradient circle at pointer coords with 8% opacity: radial-gradient(350px circle at Xpx Ypx, rgba(255,255,255,.08), transparent 70%)
Scroll Parallax: Volumetric glass ribbon parallaxes subtly (0 -> 48px) along Y on scroll

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

### Phase 7j Apps Dashboard (Linear / Vercel Caliber Real Tool)

**Page Title Row & Inline Stat Chips (`components/dashboard/DashboardView.tsx`)**
```text
Title: text-[32px] font-semibold tracking-[-0.02em] leading-tight text-foreground
Stat Chips: inline-flex items-center gap-1.5 flex-wrap
  Total Chip: px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-slate-200/60 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 text-foreground
  Published Chip: px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 with 6px emerald dot
  Draft Chip: px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-slate-200/50 dark:bg-white/5 text-muted-foreground border border-slate-300/40 dark:border-white/10 with 6px neutral dot
New App Button: variant="primary" size="md" (+ New app), aligned directly to the h1 baseline
```

**Composer (`components/dashboard/PromptBox.tsx`)**
```text
Container: rounded-[20px] glass-1 border border-white/80 dark:border-white/10 shadow-lg overflow-hidden
Top Row: h-16 (64px) px-4 sm:px-5 flex items-center gap-3
Input: text-[15px] sm:text-[16px] text-foreground placeholder:text-muted-foreground outline-none
Generate Button: variant="primary" size="md" h-10 px-4 with inline ↵ kbd shortcut. Enabled-on-type (disabled/muted only when strictly empty)
Bottom Row: px-4 sm:px-5 py-2.5 border-t border-black/5 dark:border-white/5 bg-black/[0.015] dark:bg-white/[0.01] flex items-center justify-between
Example Pills: h-6 sm:h-7 px-2.5 sm:px-3 rounded-full text-[12px] font-medium bg-slate-200/50 hover:bg-slate-300/60 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-300/40 dark:border-white/10
Template Link: ml-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground
```

**App Card (`components/dashboard/AppCard.tsx`)**
```text
Container: group cursor-pointer rounded-2xl bg-card dark:bg-[#14141A] border border-border dark:border-white/10 hover:border-slate-400/50 dark:hover:border-white/20 overflow-hidden transition-all duration-200 flex flex-col relative select-none hover:-translate-y-0.5 hover:shadow-lg
Live Thumbnail: 0.75x cropped to top-left (w-[540px] origin-top-left scale-[0.75]) ensuring all text >= 9px effective; bottom gradient mask (black 50% -> transparent 100%); zero half-empty cards
Title Row: text-[16px] sm:text-[17px] font-semibold text-foreground truncate with StatusPill on the SAME row
Slug: font-mono text-[12px] text-muted-foreground/80 tracking-tight truncate select-all (/apps/{slug})
Hover Kebab: opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity (opacity-100 on touch/mobile)
Footer Row: flex items-center justify-between pt-3 border-t border-border/40 dark:border-white/5 text-[12px]
  Counts: font-mono text-[12px] text-muted-foreground ({pages} pages · {entities} entities)
  Edited By: 16px avatar circle (initial V) + relative time text
```

**Recently Updated Column (`components/dashboard/RecentActivity.tsx`)**
```text
Container: rounded-2xl bg-card dark:bg-[#14141A] border border-border dark:border-white/10 p-5 shadow-xs h-full flex flex-col
Grid Alignment: items-stretch matching the top and height of the main card grid
State Nodes: 20px icon circles (Globe for Published, FileEdit for Draft) along vertical 1px hairline border connector
Item Text: text-[13px] text-foreground leading-snug with status in BOLD (<strong>Published</strong> / <strong>Draft</strong>) and app name
Relative Times: text-[12px] text-muted-foreground block mt-0.5
Empty State: Authentic "No recently updated apps" state with clock icon and zero mock data
```

### Container-Aware Core Renderers (Tailwind v4 Container Queries)
*Responsive renderers query container width, preventing overflow in narrow preview frames.*
```text
Preview Frame Root: @container w-full max-w-full flex flex-col bg-card rounded-xl border border-border shadow-xs max-h-full overflow-hidden (hugs content height)
Grid Wrapper: @container w-full min-w-0
Adaptive Columns (resolveGridColsClass):
  4 items: grid-cols-1 @[420px]:grid-cols-2 @[860px]:grid-cols-4 (avoids 3+1 orphan cards; 4x1 when room, else 2x2)
  2 items: grid-cols-1 @[420px]:grid-cols-2
  3 items: grid-cols-1 @[600px]:grid-cols-3
  5 items: grid-cols-1 @[420px]:grid-cols-2 @[640px]:grid-cols-3 @[960px]:grid-cols-5 (5x1 wide, 3+2 medium avoiding 4+1 orphan, 2x3 compact)
  6 items: grid-cols-1 @[420px]:grid-cols-2 @[640px]:grid-cols-3 @[960px]:grid-cols-6
  7 items: grid-cols-1 @[420px]:grid-cols-2 @[640px]:grid-cols-3 @[860px]:grid-cols-4 (4+3 balanced split on wide with 0 lonely cards; @[1100px]:grid-cols-7 if configured 7)
Preview Spacing: Header -> Grid 24px (mb-6), Grid -> DataTable 20px (mb-5).
Card: @container h-full bg-card border border-border rounded-lg p-4 min-w-0
Card Hierarchy: Title is primary (text-[16px] font-semibold text-foreground), Subtitle is secondary (text-[13px] text-muted-foreground)
Card Divider Rule: Inside Card, content children use divide-y divide-border/60 with at most ONE bordered surface
Statistic (Standalone): @container bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm min-w-0
Statistic (Inside Card): @container bg-transparent border-0 rounded-none shadow-none p-2 min-w-0
Statistic Typography: font-sans tabular-nums font-bold text-foreground clamp(1.125rem, 5cqi + 0.5rem, 1.875rem)
Trend Arrow & Color: Arrow follows sign (+ up, - down). Color defaults to neutral (text-muted-foreground) unless explicit sentiment ("positive" -> text-success-text | "negative" -> text-error-text) is passed.
```

**Safe Invalid Node Fallback (`registry/components/InvalidNodeFallback.tsx`)**
```text
Container: w-full my-2 p-3.5 rounded-xl border border-warning/30 bg-warning/5 dark:bg-warning/10 text-foreground text-xs font-mono shadow-2xs
Header: flex items-center gap-2 text-warning font-semibold text-[13px] mb-1 (AlertTriangle icon + <type />)
Description: text-[12px] text-muted-foreground font-sans mb-2
Issues List: list-disc pl-4 space-y-1 text-muted-foreground text-[11px] with bold path
Inspect Raw: collapsible details summary 'Inspect raw payload' with select-all code pre (dev mode only)
```

### Builder Workspace & Corner-Anchored Copilot Pill
```text
Builder Top Bar: h-14 border-b border-border/80 dark:border-white/10 glass-1 shrink-0 flex items-center justify-between px-4 sm:px-6 z-20
  Breadcrumb: Sans text-[13px] font-medium with App Name and StatusPill variant="neutral"
  Center Indicator: glass-2-nested rounded-full px-3 py-1 font-mono text-[13px] text-muted-foreground (config.json)
  Controls: ThemeToggle (neutral glass circle), Copilot toggle (secondary frosted pill with ⌘K), Save Draft (secondary), Publish (primary)
Pane Headers: Consistent h-9 (36px) px-4 border-b border-border bg-card flex items-center justify-between select-none
  Config Header: FileCode 14px icon + text-[13px] font-medium + IconButton collapse to 40px rail
  Preview Header: Layout 14px icon + text-[13px] font-medium + rounded-full pill viewport switchers (desktop/tablet/mobile)
Monaco Editor Pane:
  Theme: appforge-light and appforge-dark (inherit: true)
  Tokens: string.key.json (#2B6CB0 / #8FA8FF), string.value.json (#8A7A1F / #D9C27A), number (#B45309 / #FCD34D), keyword.json (#059669 / #34D399), delimiter (#475569 / #94A3B8)
  Surfaces: editor.background (#FFFFFF / #14141A) matching surface token
  Line Numbers: 35% foreground opacity (#11111059 / #EDEDEA59), activeForeground at 70% (#111110B3 / #EDEDEAB3)
  Gutter & Guides: Bracket colorization OFF, guides.bracketPairs OFF, indent guides subtle 5%/12%, lineHighlightBackground #0000000A / #FFFFFF08
  Padding: { top: 16, bottom: 72 } so lines scroll smoothly above the floating pill
Copilot Floating Pill (components/builder/CopilotFloatingPill.tsx):
  Anchoring: absolute bottom-4 right-4 inside Monaco editor container (16px inset from bottom-right corner)
  Collapsed State: w-[220px] h-10 px-3.5 rounded-full flex items-center justify-between border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#121218]/95 backdrop-blur-xl shadow-lg
    Sparkles icon + 'Ask Copilot' + Kbd '⌘K'
  Expanded State: width: min(520px, pane width - 32px), height: min(560px, pane height - 32px), scales from bottom-right (originX: 1, originY: 1)
    Surface: bg-white/96 dark:bg-[#121218]/96 backdrop-blur-2xl (>=92% opaque smoked glass)
    Dismissal: Esc key, click outside, collapse chevron button, or ⌘K shortcut
```

### Background Candidates Suite (`/dev/backgrounds`)
```text
Candidate Frame:
  Dimensions: 1440x900 full desktop viewport with real HomeHero and DemoRow overlay
  Controls: Sticky header with light/dark toggle and quick anchor jump links
  Header: w-full max-w-[1440px] px-6 py-4 flex items-center justify-between border-b border-border bg-card/60 backdrop-blur-md rounded-t-2xl
  Underlay:
    Candidate A: @paper-design/shaders-react MeshGradient (distortion 0.65, swirl 0.4, 12s cycle, brand-200/400/#8FB4FF on light, brand-900/600/#2A3A8A on ink-950)
    Candidate B: 21st.dev Canvas Aurora (4 drifting multi-color blobs, 2D canvas blur 40px, adapted to AppForge tokens)
    Candidate C: ReactBits Iridescence (OGL micro-engine with simplex noise wave shader, DPR <= 1.5)
    Candidate D: Looping 3D Glass Ribbon Video (VP9 WebM 1.2MB + H.264 MP4 485KB under 2MB with still poster fallback)
  Telemetry Bar:
    Container: w-full max-w-[1440px] px-6 py-5 bg-card border-x border-b border-border rounded-b-2xl shadow-sm
    Metrics: Gzipped JS/asset size, Average FPS over 10s (measured via rAF timestamp delta), Main-thread ms/s (measured), and Hero text area contrast (> 4.5:1 AA check)
```
