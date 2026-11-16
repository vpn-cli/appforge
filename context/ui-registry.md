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
