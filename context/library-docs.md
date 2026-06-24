# Library Docs

Project-specific usage patterns for every third party library. This file only covers usage specific to AppForge.

---

## Before Using Any Library

1. **Check AGENTS.md** at the project root for skill instructions and MCP servers.
2. **Read this file** for project-specific patterns.

Order of authority:
`MCP server -> Skills via AGENTS.md -> This file -> General training knowledge`

---

## InsForge

### Client vs Server

Two separate instances — never mix them:

```typescript
// lib/insforge-client.ts — browser context only
import { createBrowserClient } from "@insforge/ssr";

export const insforge = createBrowserClient(
  process.env.NEXT_PUBLIC_INSFORGE_URL!,
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
);
```

```typescript
// lib/insforge-server.ts — server context only
import { createServerClient } from "@insforge/ssr";
import { cookies } from "next/headers";

export const createInsforgeServer = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_INSFORGE_URL!,
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    },
  );
};
```

**Rules:**
- Browser client: Client Components, realtime subscriptions.
- Server client: Server Components, API routes, Server Actions.
- Never cross context usage.

### Generic Component Data Fetching (App Runtime)
Because AppForge generates routes from JSON configuration, fetching data requires a proxy pattern so UI components can fetch dynamic definitions. Ensure that component renderers make safe authenticated proxy calls via Server Actions or dedicated API routes instead of hardcoding queries, except for internal structural models (like `apps`, `validation_logs`).

---

## JSON Validation

AppForge requires non-blocking schema validation. Whenever `config` is modified, we run it against `zod` schemas.

```typescript
import { z } from "zod";

const AppConfigSchema = z.object({
  pages: z.array(z.any()), // Extended locally
  entities: z.array(z.any()),
  workflows: z.array(z.any()).optional(),
});
```

- Do not throw errors immediately. Aggregate them.
- Catch all structural errors and render them to the `ValidationPanel` while allowing the config to still attempt processing (graceful fallback).

---
*(Note: OpenAI, Adzuna, Browserbase, and PDF generation libraries were removed for the AppForge runtime platform. Use standard Next.js logic for data handling and UI rendering).*
