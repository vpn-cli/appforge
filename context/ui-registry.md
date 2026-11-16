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

## Component Layouts — Imprinted Phase 1

### Layout Structural Blocks
*Navbar, Footer, Hero Containers*
```text
Container class: max-w-7xl mx-auto px-4 w-full
Flex Row Layout class: flex flex-row items-center gap-X
Flex Stack Layout class: flex flex-col gap-X
Responsive Grid class: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-X gap-X
```

### Standard Base Components

**Card Containers**
```text
bg-surface p-6 rounded-lg border border-border shadow-sm
```

**Primary Buttons**
```text
bg-brand hover:bg-brand-dark text-text-inverse px-4 py-2 rounded-md font-medium transition-colors
```

**Secondary / Outline Buttons**
```text
bg-surface hover:bg-surface-secondary border border-border text-text-primary px-4 py-2 rounded-md font-medium transition-colors
```

**Badges / Pills**
```text
inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-light text-success border border-success/20
```

---

## Base Architecture Components

### ValidationPanelItem
*Displays a validation warning or error from config evaluation.*
```text
Container: rounded-md p-3 border-l-4
Background (Error): bg-error-light
Border (Error): border-error-border
Text (Error): text-error-text
```

### UnknownFallbackCard
*Renders when the component registry cannot resolve a `type` string.*
```text
Container: rounded-md p-4 border border-dashed
Background: bg-error-light
Border: border-error-border
Text: text-text-primary text-sm
```

### AppCard & Live Thumbnail
*Main dashboard application card displaying a scaled-down 16:10 live registry preview and metadata.*
```text
Container: bg-card border border-border rounded-lg overflow-hidden transition-colors hover:border-foreground/30
Thumbnail Frame: aspect-[16/10] w-full overflow-hidden bg-background/80 border-b border-border/60 select-none pointer-events-none
Card Body: p-3.5 sm:p-4 flex flex-col justify-between flex-1 gap-2
Title: text-sm font-semibold text-foreground truncate
Status Badge: inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium shrink-0 whitespace-nowrap
```

### PromptBox (Command Bar & AI Cockpit)
*Top-level prompt input with example chips and template link.*
```text
Linear Command Bar: bg-card border border-border rounded-lg p-3 sm:p-4
Vercel Cockpit: bg-card border border-border rounded-xl p-5 shadow-xs
Example Pill: text-[11px] font-medium text-muted-foreground hover:text-foreground bg-muted/40 border border-border/50 px-2 py-0.5 rounded
```

*(More components will be added dynamically by the `/imprint` skill)*
