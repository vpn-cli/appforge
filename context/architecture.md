# Architecture

## Stack

| Layer                          | Tool                     | Purpose                                          |
| ------------------------------ | ------------------------ | ------------------------------------------------ |
| Framework                      | Next.js 16 (App Router)  | Full stack framework                             |
| Auth + DB + Storage + Realtime | InsForge                 | Entire backend + DB schemas                      |
| Styling                        | Tailwind CSS + shadcn/ui | UI components and styling                        |
| Styling Syntax                 | Tailwind v4              | CSS `@theme` variables                           |
| Language                       | TypeScript strict        | Throughout                                       |

---

## Folder Structure

```
/
├── AGENTS.md
├── context/
│   ├── project-overview.md
│   ├── architecture.md
│   ├── ui-tokens.md
│   ├── ui-rules.md
│   ├── ui-registry.md
│   ├── code-standards.md
│   ├── library-docs.md
│   ├── build-plan.md
│   ├── progress-tracker.md
│   └── templates/                       → Starter JSON configs for Apps
├── app/
│   ├── layout.tsx                       → Root layout
│   ├── page.tsx                         → Homepage (Marketing)
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx                 → Login page
│   │   └── callback/
│   │       └── page.tsx                 → OAuth callback handler
│   ├── dashboard/
│   │   └── page.tsx                     → Creator dashboard, stats
│   ├── builder/
│   │   └── [appId]/
│   │       └── page.tsx                 → Config editor + live preview + validation panel
│   ├── apps/
│   │   └── [appId]/
│   │       ├── layout.tsx               → App-specific layout wrapper
│   │       ├── page.tsx                 → Entry point of the rendered app
│   │       ├── [pageId]/
│   │       │   └── page.tsx             → Specific page/route in the app
│   │       └── settings/
│   │           └── page.tsx             → Schema viewer, API endpoints
│   └── api/
│       ├── apps/
│       │   ├── route.ts                 → CRUD for apps
│       │   └── validate/route.ts        → Validate config schema manually
│       └── db/
│           └── proxy/route.ts           → Generic dynamic API proxy
├── components/
│   ├── ui/                              → shadcn/ui generic primitives
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── dashboard/
│   │   ├── StatsBar.tsx
│   │   ├── RecentActivity.tsx
│   │   └── AnalyticsCharts.tsx
│   ├── builder/
│   │   ├── ConfigEditor.tsx             → JSON editor
│   │   ├── LivePreview.tsx              → Live canvas rendering components
│   │   └── ValidationPanel.tsx          → Errors & Warnings list
│   └── renderers/
│       ├── ComponentRegistry.tsx        → Maps JSON `type` to React components
│       ├── UnknownComponentFallback.tsx → Graceful degradation for unknown types
│       ├── FormRenderer.tsx
│       ├── TableRenderer.tsx
│       ├── ChartRenderer.tsx
│       └── DashboardRenderer.tsx
├── lib/
│   ├── insforge-client.ts               → browser client
│   ├── insforge-server.ts               → server client
│   ├── validation.ts                    → Non-blocking validator functions
│   └── utils.ts                         → Shared utility functions
├── actions/
│   ├── apps.ts                          → Mutate / save configs
│   ├── schema.ts                        → Sync DB schemas
│   └── workflows.ts                     → Dispatch workflow triggers
└── types/
    └── index.ts                         → Global TypeScript types (App structure, etc)
```

---

## System Boundaries

| Folder              | Owns                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `app/`              | Pages and route structures.                                                                       |
| `actions/`          | Server Actions for mutations (saving config, setting schemas). No arbitrary logic execution here. |
| `components/`       | UI only. Pure presentation.                                                                       |
| `components/renderers/`| Dynamic component implementations for parsing JSON config into actual DOM elements.              |
| `lib/`              | Third party initializations and shared utility functions.                                         |

---

## Data Flow

### Editing and Saving (Builder)

```
User types in ConfigEditor
        ↓
Live Preview updates via state
        ↓
User clicks Save
        ↓
Server Action (actions/apps.ts)
        ↓
InsForge writes to `apps.config` (jsonb)
        ↓
InsForge triggers schema sync (if changed)
        ↓
Revalidate UI components
```

### Dynamic App Execution (Runtime)

```
User visits /apps/[appId]/[pageId]
        ↓
Server Component reads config from `apps.config`
        ↓
Passes config section for [pageId] to ComponentRegistry
        ↓
ComponentRegistry resolves component types
        ↓
Components invoke /api/db/proxy/route.ts to fetch app-scoped data
        ↓
InsForge queries dynamic tables for [appId] -> returns to UI
```

---

## InsForge Database Schema

### `apps`

| Column              | Type        | Notes                                        |
| ------------------- | ----------- | -------------------------------------------- |
| id                  | uuid        | Primary key                                  |
| user_id             | uuid        | Owner (References auth.users)                |
| name                | text        | App name displayed on Dashboard              |
| config              | jsonb       | Latest full JSON config (pages, entities)    |
| published_config    | jsonb       | Config snapshotted for runtime use           |
| created_at          | timestamptz |                                              |
| updated_at          | timestamptz |                                              |

### `validation_logs`

| Column              | Type        | Notes                                        |
| ------------------- | ----------- | -------------------------------------------- |
| id                  | uuid        |                                              |
| app_id              | uuid        | References apps                              |
| error_count         | integer     | Number of errors caught during save pass     |
| warning_count       | integer     | Number of warnings                           |
| details             | jsonb       | Array of specific schema errors encountered  |
| created_at          | timestamptz | Log timestamp                                |

### `app_schemas`

| Column              | Type        | Notes                                        |
| ------------------- | ----------- | -------------------------------------------- |
| id                  | uuid        |                                              |
| app_id              | uuid        | References apps                              |
| table_name          | text        | Generated underlying Postgres table name     |
| schema_definition   | jsonb       | Extracted fields and type definitions        |

*(Note: Actual user app data is written dynamically to generated tables mapped by `app_schemas`)*

---

## Authentication

- Provider: InsForge Auth
- Methods: Google OAuth, GitHub OAuth
- Protected routes: `/dashboard`, `/builder/*`, `/apps/*`
- Public routes: `/`, `/login`
- Middleware in `middleware.ts` checks sessions
- On login → redirect to `/dashboard`

---

## Invariants

- Broken JSON configs must NEVER crash the layout. `ValidationPanel` displays errors, `UnknownComponentFallback` replaces broken components inline.
- The backend config acts as the absolute Source of Truth.
- Frontend renderer operates exclusively through `ComponentRegistry`. Never hardcode an app-specific view logic into `app/`.
- All `InsForge` queries in `/dashboard` and `/builder` are strictly scoped to the `user_id`. Queries in `/apps` route are scoped by `app_id`.
- Dynamic SQL / schema mutations driven by `apps.config` changes must strictly sandbox themselves under `app_schemas` bounds to prevent SQL injection vulnerabilities.
