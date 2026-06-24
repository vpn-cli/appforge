# Project Overview

## About the Project

AppForge is a metadata-driven application runtime. Instead of hand-coding a frontend, backend, and database for every new internal tool, an author writes a single JSON configuration describing the app's pages, data entities, and workflows — and AppForge's runtime parses that config and produces a working application: rendered UI, generated CRUD APIs, a generated database schema, and executable workflows, all live.

The defining requirement of the runtime is resilience: configs are written by hand, copied from templates, or edited mid-build, so they will routinely be incomplete, malformed, or reference component types that don't exist. AppForge must never let a broken config crash the app — it degrades gracefully, isolates the damage to the smallest possible piece of the UI, and tells the author exactly what's wrong.

---

## The Problem It Solves

Building even a simple internal tool — a form, a table, a small dashboard — usually means standing up a frontend, wiring API routes, designing a database table, and writing the glue between them, every single time. Most of that work is mechanical: the shape of the data dictates most of the UI and most of the API.

AppForge collapses that pipeline. The author describes the data and the screens once, in JSON, and the runtime does the rest — rendering, persistence, and the workflows that connect actions to effects. The author's job becomes shaping the config and fixing what the validator flags, not writing boilerplate.

---

## Pages

```
/                          → Marketing / landing page
/login                     → Auth page
/dashboard                 → List of the user's apps, create-new-app entry point
/builder/[appId]           → Config editor + live preview + validation panel
/apps/[appId]              → Rendered entry point of the generated app
/apps/[appId]/[pageId]     → Specific page/route inside the generated app
/apps/[appId]/settings     → Generated schema viewer, API endpoint list, workflow list
```

---

## Navigation

Top navbar for AppForge itself, full width, no sidebar:

```
Dashboard    Builder    Templates
```

Once a generated app is open at `/apps/[appId]`, navigation switches to whatever nav structure *that app's own config* defines — kept visually distinct from AppForge's own chrome so it's clear which "app" you're standing inside.

---

## Core User Flow

### Homepage

- Hero section, how-it-works, example config gallery
- Logged in users → redirect to dashboard
- Logged out users → redirect to login

### Onboarding

- User signs up / logs in
- On login → redirect to /dashboard
- Empty dashboard state: "Create your first app"

### Creating an App

- User starts a new app: pastes/uploads a JSON config, or starts from a template
- Runtime parses the config into three layers: **pages/components** (UI), **entities/fields** (data shape), **workflows** (trigger → condition → action)
- Live preview renders as the config is edited
- Validation panel lists every error and warning found in the config — **non-blocking**: the author can always save and preview, even with errors present
- Unknown or misspelled component `type` values render as a visible "Unknown Component" placeholder card (showing the offending key) instead of failing — the rest of the page renders normally
- Missing optional fields fall back to sane defaults (e.g. missing `label` → field key is used as the label; missing/invalid `type` → falls back to a generic text field renderer)
- Saving persists a new version of the config tied to that `appId`

### Frontend Rendering Engine

- A component registry maps config `type` strings (`form`, `table`, `dashboard`, `chart`, `button`, `text`, `grid/layout`, etc.) to renderer components
- Any `type` not in the registry resolves to a registered **Fallback/UnknownComponent** renderer — it never throws
- Every renderer is wrapped in its own error boundary, so one broken component cannot take down the rest of the page
- Each data-bound component has its own **loading state** (skeleton) while its API call resolves, independent of siblings
- Each data-bound component has its own **error state** (inline message + retry) if its API call fails, independent of siblings
- Layout/grid metadata from config drives a responsive CSS grid; if layout metadata is missing or malformed, components fall back to a single-column stacked layout rather than breaking

### API & Database Generation

- Entities and fields declared in config map to generated database tables and columns
- CRUD REST endpoints are generated automatically per entity
- Unsupported or mismatched field types fall back to a generic text/JSON column rather than failing schema creation
- Workflow definitions (`trigger → condition → action`) compile into executable handlers; unrecognized action types are logged and skipped rather than halting the whole workflow run

### Running a Generated App

- `/apps/[appId]` renders the live app from the latest saved (or published) config version
- End users interacting with the rendered app call the generated APIs directly, which read/write the generated database tables

### Dashboard (AppForge's own)

- Stats bar — 4 cards: Apps Created, Components Rendered, Validation Issues Caught, Active Workflows
- Recent activity — last 5–10 edits/publishes across the user's apps
- Analytics section:
  - Config edits over time — line chart
  - Validation error rate by app — bar chart
  - Most-used component types — bar chart

---

## Data Architecture

### App Config

- Lives in `apps.config` (jsonb), versioned on every save
- Edited only through the builder — never mutated by the runtime or by workflow execution

### Generated Schema

- Stored in `app_schemas`, derived from the config's entity definitions
- Regenerated non-destructively whenever the config's schema section changes

### Generated Data

- Each app's own runtime data lives in tables scoped to that `appId`, kept separate from AppForge's own platform tables

### Validation Log

- Stored in `validation_logs` — one row per parse, recording every error/warning/unknown-type encountered, without blocking the save

---

## Features In Scope

- Component registry and dynamic frontend renderer (forms, tables, dashboards, charts, layout/grid)
- Per-component error boundaries with "Unknown Component" fallback rendering
- Per-component loading and error states, isolated from page-level failures
- Responsive layout engine driven by config, with single-column fallback
- Non-blocking JSON config validator (errors + warnings surfaced, never blocks save/preview)
- Dynamic CRUD API generation from entity definitions
- Dynamic database schema generation from entity/field definitions, with type-mismatch fallback
- Workflow engine (trigger → condition → action) with skip-and-log behavior for unknown actions
- Config versioning (save / publish)
- Builder UI: JSON editor + live preview + validation panel, side by side
- Template gallery of starter configs
- Dashboard with stats, recent activity, and analytics charts

---

## Features Out of Scope

- Visual drag-and-drop builder (config is authored as JSON, not via canvas)
- Natural-language / prompt-to-config generation
- Multi-user real-time collaborative editing
- Config version rollback / diff UI
- Custom scripting or arbitrary code execution inside workflows
- Payment or subscription system
- Mobile native apps
- Public app marketplace or sharing between users
- Role-based permissions within a single generated app
- Offline mode

---

## Platform Events

```typescript
app_created;            // { userId, appId }
config_validated;       // { userId, appId, errorCount, warningCount }
component_render_error; // { appId, pageId, componentType, reason }
api_generated;          // { appId, entity, endpointCount }
workflow_executed;      // { appId, workflowId, status }
```

---

## Target User

A developer, ops engineer, or product builder who needs to stand up small internal tools (forms, trackers, lightweight dashboards) quickly from a config file rather than custom code, and who needs the platform to stay usable and informative even when that config is incomplete, hand-edited, or just plain wrong.

---

## Success Criteria

- A valid config with pages, entities, and a handful of component types renders into a fully working app — UI, CRUD APIs, and database — end to end
- A config with missing fields, unknown component types, or malformed layout still renders correctly everywhere except the broken part, which shows a clear, non-fatal placeholder
- The validation panel surfaces every error/warning in a config without ever blocking save or preview
- Newly defined entities are immediately backed by real CRUD endpoints and database tables
- Workflow actions with unsupported types are skipped and logged, never crash the run
- Builder live preview updates within ~1 second of a config edit
- Dashboard accurately reflects counts of apps, components, and validation issues caught