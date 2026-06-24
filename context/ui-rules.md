# UI Rules

Concise rules for building AppForge UI. Keep it strict, developer-tool oriented, and visually clean (avoiding gradients or complex visual flair that distracts from functionality). 

---

## Font

Always import Inter via `next/font/google` in the root layout. Apply the font variable class `--font-sans` to the `<html>` tag. Never use system fonts as the primary font.

---

## Layout Structure

- Most panels (like the Builder) will consume the full width & height: `w-screen h-screen` minus the Navbar.
- The Dashboard uses a standard 1440px max-width centered constraint.
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

## Card Standard

Every standard card outside the builder uses:

```css
background: #FFFFFF
border: 1px solid #E7EAF3
border-radius: 8px
padding: 24px
box-shadow: 0px 1px 2px rgba(0,0,0,0.05)
```

Never use colored card backgrounds — always white.

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
