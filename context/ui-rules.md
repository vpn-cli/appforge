# UI Rules

These rules bind every component in `components/`, and especially every renderer in `components/renderers/`, since those render *arbitrary, sometimes-broken, config-driven UI* at runtime. A rule here is only useful if `ComponentRegistry` can enforce it without knowing what a specific app's config contains — so rules are written as defaults, fallbacks, and hard constraints rather than one-off visual choices.

Reference: `ui-tokens.md` for the actual token values (colors, type scale, spacing scale). This file governs *how those tokens must be applied*, not what they are.

---

## 1. Accessibility (WCAG 2.2 AA — non-negotiable floor)
### 1.1 Color & contrast
- Text vs. background ≥ 4.5:1
- Large text (≥24px) ≥ 3:1
- Dark mode parity checked independently over light-mode

### 1.2 Keyboard & focus
- Reacheable via Tab targeting, 2px outline natively attached.

## 2. Spacing System
A single 8px base grid, used everywhere.
- 4px is the smallest legal gap.
- Vertical rhythm between sibling blocks default to 32px
- Optical mathematically alignments via Tailwind constraints.

## 5. Component States (mandatory)
Every data-bound renderer must implement **all five** states below:
1. **Loading** — skeleton matching the loaded layout's approximate shape and dimensions.
2. **Loaded / default** — the normal state.
3. **Empty** — a distinct, designed empty state.
4. **Error** — inline, scoped to the component. Never a full-page crash, never a blank space.
5. **Unknown/degraded** — `UnknownComponentFallback` natively flags missing `type` identifiers softly.

## 10. Enforcement
- Any new component in `components/renderers/` must satisfy §5 (all five states) and §1 (keyboard + contrast) before it can be registered in `ComponentRegistry`.
