# UI Rules

Concise rules for building AppForge UI. Keep it strict, developer-tool oriented, and visually clean (avoiding gradients or complex visual flair that distracts from functionality). 

---

## Font

Always import Inter via `next/font/google` in the root layout. Apply the font variable class `--font-sans` to the `<html>` tag. Never use system fonts as the primary font.

---

## Layout Structure

- Most panels (like the Builder) will consume the full width & height: `w-screen h-screen` minus the Navbar.
- The Dashboard uses a standard 1440px max-width centered constraint.
- Dashboard and standard page layouts should follow an Apple-style **Bento Grid** architecture, utilizing CSS Grid to tightly pack functionality into rounded glass cards.
- App Runtime (`/apps/*`) defines its own layout driven by the `apps.config`! Keep the frame entirely un-styled from AppForge's chrome.

---

## Navbar

- Height: 64px, full width.
- Always white background.
- Items: Dashboard, Builder, Templates.

---

## Panels and Editor (Builder)

- Use rigid Flexbox/CSS Grid layouts. 
- Panels should be demarcated by solid simple borders `border-r border-border`.
- Editor container gets no padding to ensure Monaco editor fits perfectly.
- Provide resizers if feasible between panels.

---

## Card Standard & Hover Interactions

Every standard card outside the builder uses a Glassmorphism aesthetic and responsive hover effects:

```css
background: var(--color-glass-surface)
backdrop-filter: blur(12px)
border: 1px solid var(--color-glass-border)
border-radius: 12px
padding: 24px
box-shadow: 0px 4px 6px rgba(0,0,0,0.05)
transition: all 300ms ease-out
```

**Hover Effects (for interactive cards):**
- Subtle translation: e.g., `-translate-y-1`
- Increased shadow and border glow depth.

Never use rigid, fully opaque colored card backgrounds unless completely necessary for contrast.

---

## Typography Hierarchy

**Section headings** (Panel Titles, Card Headers)
```css
font-size: 14px
font-weight: 600
color: #101828
text-transform: uppercase (optional for small headers)
```

**Body text**
```css
font-size: 14px
font-weight: 500
color: #101828
```

**Secondary / muted** (Validation logs, helper text)
```css
font-size: 12px
color: #99A1AF
```

---

## Validation Panel / Fallbacks

Graceful degradation is the key AppForge requirement.
- **Validation Errors:** Highlighted with red/orange background pills or left-borders. Do not use modals or popups.
- **UnknownComponentFallback Card:** Displays inline, clearly dashed border with an error icon and the string `Unknown Component Type: [type]`.

---

## Do Nots

- Never use Tailwind's built-in color classes (`bg-purple-500`) — use project tokens from globals.css only via `@theme`.
- Never define colors in `tailwind.config.ts`.
- Never show raw JS error traces to users — intercept with boundary and route to Validation Panel.
- Never use `position: fixed` for Editor UI tools; utilize flex layouts.
