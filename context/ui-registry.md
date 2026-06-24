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

*(More components will be added dynamically by the `/imprint` skill)*
