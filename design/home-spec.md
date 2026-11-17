# AppForge Home Design Specification
**Source of Truth:** `design/reference-home.png`
**Applied Refinements:** Per project requirements (logo mark preserved, no promo card, factual eyebrow, restrained ribbons, 8/12/16px radius scale, no dead links).

---

## 1. Color Palette

### 1.1 Canvas & Surfaces (Light Theme)
- **Global Canvas Background:** `#EEF0FA` to `#F4F5FD` (soft lavender-white with subtle periwinkle gradient tint)
- **Sidebar Surface:** `rgba(242, 242, 250, 0.85)` / `#F0EFFD` with 1px right border `rgba(147, 144, 200, 0.20)`
- **Glass Cards (Outer):** `rgba(255, 255, 255, 0.82)` with `backdrop-blur-xl`, inner border `1px solid rgba(255, 255, 255, 0.75)`
- **Top Bar:** `rgba(238, 240, 250, 0.70)` with hairline bottom border `rgba(147, 144, 200, 0.20)` and `backdrop-blur-md`
- **Segmented Nav Container:** `rgba(255, 255, 255, 0.60)` with border `rgba(200, 205, 230, 0.40)`
- **Segmented Nav Active Tab:** `#FFFFFF` with shadow `0 2px 6px rgba(15, 23, 42, 0.08)` and text `#0F172A`
- **Segmented Nav Inactive Tab:** text `#64748B`, hover `#1E293B`

### 1.2 Dark Surfaces (Embedded Panels)
- **Code Card Inner Editor:** `#161622` (deep ink slate) with 1px inner border `rgba(255, 255, 255, 0.06)`
- **Code Card Footer:** `#13131D` with border-top `rgba(255, 255, 255, 0.06)`
- **Preview Card Stat Panel:** `#1E2030` (dark indigo-slate) with wave layer `rgba(129, 140, 248, 0.25)` and text `#FFFFFF`
- **Preview Card Table Wrapper:** `#1A1B29` with border `rgba(255, 255, 255, 0.08)`
- **Preview Card Table Header:** text `#94A3B8`, background `#161724`
- **Preview Card Table Rows:** `#1A1B29` with row borders `rgba(255, 255, 255, 0.05)`

### 1.3 Accents & Text
- **Headline Primary:** `#09090B` (solid near-black)
- **Headline Gradient:** `linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #2563EB 100%)` (violet-to-blue)
- **Hero Subtitle:** `#475569` (dark slate gray, line-height 1.55)
- **Primary CTA Button:** `#09090B` background, `#FFFFFF` text, hover `#18181B`
- **Secondary CTA Button:** `rgba(255, 255, 255, 0.90)` background, `#0F172A` text, 1px border `rgba(226, 232, 240, 0.80)`
- **Eyebrow Pill:** background `rgba(99, 102, 241, 0.10)`, text `#4F46E5`, border `rgba(99, 102, 241, 0.20)`

### 1.4 Status & Syntax Highlighting
- **Status Running:** green text `#22C55E`, dot `#22C55E`, background `rgba(34, 197, 94, 0.12)`, border `rgba(34, 197, 94, 0.25)`
- **Status Idle:** violet text `#818CF8`, dot `#818CF8`, background `rgba(129, 140, 248, 0.12)`, border `rgba(129, 140, 248, 0.25)`
- **Syntax Keys:** `#60A5FA` (soft sky blue)
- **Syntax Types / Literals:** `#4ADE80` (soft emerald green)
- **Syntax Strings:** `#FB923C` (soft orange)
- **Syntax Punctuation:** `#94A3B8` (slate gray)
- **Syntax Numbers:** `#FBBF24` (amber)
- **Window Controls:** Red `#EF4444`, Amber `#F59E0B`, Green `#10B981` (muted)

---

## 2. Geometry & Spacing System

### 2.1 Radius Scale
- **8px (`rounded-lg`):** Buttons (48px tall), input fields, small badges, action pills
- **12px (`rounded-xl`):** Navigation items (44px tall), inner editor panel, inner stat panel, table container
- **16px (`rounded-2xl`):** Outer glass cards (Code card, Preview card)
- **Full (`rounded-full`):** Segmented top navigation, status badges (`Live`, `Running`, `Idle`), theme toggle button

### 2.2 Shadows
- **Card Soft Shadow:** `0 20px 48px -12px rgba(30, 27, 75, 0.08), 0 1px 3px rgba(30, 27, 75, 0.04)`
- **Raised Control Shadow:** `0 2px 8px -1px rgba(30, 27, 75, 0.06), 0 1px 2px rgba(30, 27, 75, 0.04)`

### 2.3 Component Dimensions & Layout
- **Sidebar Width:** 220px fixed on desktop (â‰¥1280px), collapsible/hidden on mobile.
- **Top Bar Height:** 72px (`h-[72px]`), full width with hairline bottom border.
- **Hero Spacing:**
  - Eyebrow margin-bottom: 16px
  - Headline margin-bottom: 20px, font-size ~60px, tracking `tight` (`-0.03em`), line-height 1.15
  - Subtitle margin-bottom: 32px, font-size ~19px, max-width 800px, line-height 1.55
  - CTAs gap: 16px, height 48px, radius 8px
- **Demo Row:**
  - Margin top: 48px
  - Width: max-w-[1240px]
  - Grid: 2 columns, left card flex-1.15 (~53%), right card flex-1 (~47%), gap: 24px

---

## 3. Dark Theme Counterpart

- **Canvas Background:** `#0B0C14` to `#0E101D` (deep navy ink)
- **Sidebar Surface:** `rgba(15, 17, 28, 0.90)`
- **Glass Cards (Outer):** `rgba(255, 255, 255, 0.04)` with `backdrop-blur-xl`, border `1px solid rgba(255, 255, 255, 0.08)`
- **Top Bar:** `rgba(11, 12, 20, 0.85)` with border `rgba(255, 255, 255, 0.06)`
- **Headlines:** `#F8FAFC` solid, gradient `linear-gradient(135deg, #818CF8 0%, #6366F1 50%, #3B82F6 100%)`
- **Subtitle:** `#94A3B8`
- **Primary CTA Button:** `#FFFFFF` background, `#09090B` text
- **Secondary CTA Button:** `rgba(255, 255, 255, 0.08)` background, `#F1F5F9` text, border `rgba(255, 255, 255, 0.12)`
- **All text and interactive contrast pairs satisfy WCAG 2.2 AA (>= 4.5:1 text, >= 3:1 large text & non-text).**

