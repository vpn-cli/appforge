# Code Standards

Implementation rules and conventions for the entire project. The AI agent must follow these in every session without exception. These rules prevent pattern drift across sessions.

---

## Engineering Mindset & Agent Skills

The AI agent on this project operates as a senior engineer. This means STRICT adherence to `.agents/skills`.

- **`/architect`** — Think before implementing. Understand what is being built and why before writing a single line. Read `context/architecture.md` and `context/project-overview.md` first. Never assume. Scope is sacred.
- **`/imprint`** — Run after building any UI component. UI consistency does not happen by accident. Extract visual patterns and save them to `ui-registry.md`. Every component built after this must match what came before.
- **`/review`** — After building a feature, verify it matches the plan, respects the system architecture, and is production-ready.
- **`/recover`** — When something goes wrong, diagnose if it's a specific bug, a polluted session, or a fundamentally wrong approach *first*. Never relentlessly prompt without thinking. Hard reset if the session is polluted.
- **`/remember`** — Save what matters at the end of a session (`/remember save`) and restore context at the beginning (`/remember restore`) so nothing is lost.

---

## TypeScript

- Strict mode enabled in tsconfig.json — no exceptions.
- Never use `any` — use `unknown` and narrow the type.
- Never use type assertions (`as SomeType`) unless absolutely necessary and commented why.
- All function parameters and return types must be explicitly typed.
- Use `type` for object shapes and unions — use `interface` only for extendable component props.
- All async functions must have proper error handling.

---

## Next.js 16 Conventions

- App Router only — no Pages Router.
- React 19 APIs throughout.
- All components are Server Components by default.
- Only add `"use client"` when requiring `useState`, `useEffect`, Browser APIs, event listeners.
- Data fetching happens in Server Components — never fetch in Client Components directly.
- Route handlers live in `app/api/`. No business logic explicitly inside route handlers.
- Server Actions live in `actions/` — never defined inline in components.
- Caching is uncached by default — dynamic by default.

---

## File and Folder Naming

- Folders: kebab-case (`app-builder`, `ui-registry`)
- Component files: PascalCase (`StatsBar.tsx`, `ConfigEditor.tsx`)
- Utility files: camelCase (`insforge-client.ts`, `validation.ts`)
- Type files: camelCase (`index.ts`)
- API route files: always `route.ts`
- Server Action files: camelCase (`apps.ts`, `schema.ts`)
- One component per file.

---

## Component Structure

Every component follows this exact order:

```typescript
"use client"; // only if needed

// 1. External imports
import { useState } from "react";

// 2. Internal imports
import { ValidationPanel } from "@/components/builder/ValidationPanel";

// 3. Type definitions
type Props = {
  appId: string;
};

// 4. Component
export function ComponentName({ appId }: Props) {
  // state
  // handlers
  // return JSX
}
```

- Never use default exports for components — always named exports.
- Props type defined directly above the component.
- No inline styles. Only Tailwind classes utilizing UI Tokens from globals.css.

---

## Server Actions Example

```typescript
// actions/apps.ts
"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeServer } from "@/lib/insforge-server";

export async function saveAppConfig(appId: string, config: any) {
  try {
    const insforge = await createInsforgeServer();
    // update app 
    revalidatePath(`/builder/${appId}`);
    return { success: true };
  } catch (error) {
    console.error("[actions/apps]", error);
    return { success: false, error: "Failed to save config" };
  }
}
```

- Every Server Action has a try/catch and returns `{ success: boolean, error?: string }`.

---

## Environment Variables

All environment variables defined in `.env.local`. Never hardcode keys.

| Variable                        | Used In                |
| ------------------------------- | ---------------------- |
| `NEXT_PUBLIC_INSFORGE_URL`      | lib/insforge-client.ts |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | lib/insforge-client.ts |

`NEXT_PUBLIC_` prefix means browser-accessible. Never add it to secret keys.

---

## Dependencies

Never install a new package without a clear reason. 
Approved dependencies for AppForge framework:
- `@insforge/ssr`
- `zod`
- `lucide-react`
- `tailwindcss`
- `shadcn/ui` components
