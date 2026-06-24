# Build Plan

## Core Principle

Full page UI built with mock data first — verified visually before any logic is written. Then functionality is built and wired to the UI step by step. Every feature must be visible and testable before moving to the next. No invisible backend phases. For AppForge, graceful degradation is tested actively at each rendering step.

---

## Phase 1 — Foundation

### 01 Homepage
Build the complete homepage UI.
**UI:**
- Navbar — logo, Dashboard, Builder, Templates links, Start for free button
- Hero section — headline about "Live Config-driven Apps"
- Code Editor vs Rendered App split screen graphic (hero image)
- Features section — Configuration vs Boilerplate details
- Footer

### 02 Auth
InsForge authentication — Google and GitHub OAuth.
**Logic:**
- Login page and OAuth handler via InsForge.
- Middleware protecting `/dashboard` and `/builder`. 
- Redirects to `/dashboard`.

### 03 Database Schema
All InsForge platform tables created before data writes.
**Logic:**
- Create `apps`, `validation_logs`, and `app_schemas` tables.
- RLS policies to restrict to `user_id`.

---

## Phase 2 — Dashboard

### 04 Dashboard Page — UI First
Build the complete dashboard UI with mock data.
**UI:**
- Four stat cards: Apps Created, Components Rendered, Validation Issues, Active Workflows.
- Recent activity section — last edits/publishes.
- Your Apps grid — cards showing app name, last updated, and "Open Builder" / "Run App" links.
- "Create New App" blank entry point card.

### 05 Dashboard Logic 
Wire the dashboard to InsForge DB data.
**Logic:**
- Fetch list of apps filtered by current user.
- Actions: Create a new empty app -> inserts to `apps`, redirects to `/builder/[newId]`.

---

## Phase 3 — App Builder

### 06 Builder Layout
**UI:**
- Three-panel split layout: JSON Editor (Left), Validation Panel (Bottom Left), Live Preview (Right).
- Toolbar covering Save, Publish, Validate buttons.

### 07 JSON Editor & Validation Layer
**UI & Logic:**
- Integrated code editor (Monaco or simple text area) for JSON.
- Non-blocking JSON config validator runs continuously.
- Prints errors/warnings in Validation Panel (e.g., missing label, unknown type).

### 08 Basic Saving Logic
**Logic:**
- Wire Save button to update `apps.config` in the DB via Server Actions.
- Record validation stats to `validation_logs`.
- Ensure save never blocks (user can save even with errors).

---

## Phase 4 — Component Registry & Runtime

### 09 Component Registry Foundation
**Logic:**
- Map `config.type` references to React renderer components.
- Implement Grid/Layout recursive renderer.
- Implement `UnknownComponentFallback` generic card.

### 10 Core Components Renderers
**UI:**
- Form renderer, Button renderer, Text renderer.
- Data Table renderer (using mock columns layout first).
- Chart renderer (bar/line empty states).
- Map all to Component Registry. Layout must gracefully collapse to valid rows.

### 11 Live Preview Wiring
**Logic:**
- Connect the JSON Editor input state directly into the Component Registry. Enable instant previewing.
- Add error boundaries to every registered component.

---

## Phase 5 — Dynamic Backend

### 12 Schema Extractor
**Logic:**
- Implement logic analyzing the `entities` block from configuration JSON.
- Sync `app_schemas` records when an App is published.
- Generate backing Postgres tables dynamically based on fields.

### 13 Dynamic APIs
**Logic:**
- Create `/api/db/proxy` capable of generic CRUD actions based on `appId` and `entity` parameter.
- Ensure API gracefully handles schema/config mismatches by dropping the invalid fields or reverting to text types.

### 14 Live App Runtime Route
**UI & Logic:**
- Generate `/apps/[appId]` and `/apps/[appId]/[pageId]` wrapper routes that pull `published_config` from the database.
- Wire generic API to fetch data into the runtime components.
- End-to-end user testing of a small full app without backend code.

---

## Feature Count

| Phase                     | Features |
| ------------------------- | -------- |
| Phase 1 — Foundation      | 3        |
| Phase 2 — Dashboard       | 2        |
| Phase 3 — App Builder     | 3        |
| Phase 4 — Core Runtime    | 3        |
| Phase 5 — Dynamic Backend | 3        |
| **Total**                 | **14**   |
