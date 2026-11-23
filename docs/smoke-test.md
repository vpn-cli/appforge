# Production Smoke Test Checklist

Post-deployment verification protocol for AppForge production releases. Execute this checklist in a browser immediately following code deployment and table repair, and **strictly before** applying contract migrations (Migration B).

Published App Smoke-Test URLs (Live Published Apps):
- **fisrt**: `/apps/6b0e3994-e4c4-4c0a-a8c5-5b705e0885aa`
- **Analytics CRM**: `/apps/df557309-95e1-4b71-be92-759bf3ff33fc`

---

## Pre-Flight Environment & Interface Verification

- [ ] **Landing Page Render (Light Theme)**: Navigate to `/` in a clean browser session with Light theme active. Verify page renders with zero console errors, navbar and buttons render with high contrast, and animations execute smoothly.
- [ ] **Landing Page Render (Dark Theme)**: Toggle to Dark theme. Verify background ribbons, demo cards, and text maintain full legibility with zero console errors.
- [ ] **Builder Smoke Test (Light Theme)**: Navigate to `/builder/demo` with Light theme active. Verify Monaco editor, preview canvas, and floating Copilot pill initialize without hydration errors or console exceptions.
- [ ] **Builder Smoke Test (Dark Theme)**: Toggle to Dark theme in `/builder/demo`. Verify Monaco editor syntax tokens switch to dark palette with legible line numbers and clear cursor visibility.

---

## Existing Published Apps Verification

- [ ] **Existing Published Apps Render (fisrt & Analytics CRM)**:
  - In an Incognito / Private browsing window (signed out), navigate to each of the two pre-existing live published applications:
    - [ ] **fisrt**: `/apps/6b0e3994-e4c4-4c0a-a8c5-5b705e0885aa`
    - [ ] **Analytics CRM**: `/apps/df557309-95e1-4b71-be92-759bf3ff33fc`
  - Expected after repair: both render logged-out with **EMPTY tables and no error boxes** (verified Nov 21 fact: LIVE had 0 per-app data tables before; `repair-missing-tables` provisioned the empty physical tables so proxy returns 200 with `[]` rather than throwing 503 error boxes).

---

## Core Application & Database Integration Checklist (New App Lifecycle)

Follow these steps directly in the production web interface (do NOT run direct database queries):

- [ ] **1. Create an App from a Template**:
  - Log in to your production account.
  - Navigate to `/templates` and select a starter template (e.g., *Employee Directory* or *Incident Tracker*).
  - Click **Use Template** and confirm the builder opens with the template configuration loaded.

- [ ] **2. Add a Field & Save Draft**:
  - In the builder, add a new field to an existing data entity in the JSON configuration.
  - Click **Save Draft**.
  - Verify that the notification displays `Draft Saved` successfully without errors.

- [ ] **3. Insert Record via Preview**:
  - In the live preview panel, insert a new record into the updated entity, including a value for the newly added field.
  - Confirm the record saves successfully and appears in the table/card renderer.

- [ ] **4. Publish Application**:
  - Click the **Publish** button in the builder header.
  - Confirm that the status badge updates to `Published` and a public link is generated.

- [ ] **5. View Published App in Signed-Out Session**:
  - Copy the published app URL (`/apps/<appId>`).
  - Open a new Incognito / Private browsing window (ensuring you are completely signed out).
  - Navigate to the published app URL.
  - Verify the application renders cleanly in the standalone `AppShell` with zero 401, 404, or 500 errors.
  - Verify that the **logged-out view shows DATA rows** (persisted record inserted in Step 3 is rendered; this requirement to show populated data rows applies to the NEW app created, filled, and published during this smoke test).

---

## Production Security & Route Guard Checklist

- [ ] **Protected Route Redirect**: In the signed-out window, attempt to navigate to `/apps`. Confirm you are immediately redirected to `/sign-in`.
- [ ] **Dashboard Canonicalization**: In the signed-out window, navigate to `/dashboard`. Confirm it cleanly redirects to `/apps` (and subsequently to `/sign-in`).
- [ ] **Test Route Lockdown**: In the browser, navigate to each of the following test endpoints and verify that all return a 404 Not Found error in production:
  - [ ] `/api/sentry-test` → Returns 404
  - [ ] `/dev/renderers` → Returns 404
  - [ ] `/test-renderers` → Returns 404
- [ ] **Anonymous PostgREST Lockdown**: Execute anon curl probe against `/rest/v1/apps`:
  ```bash
  curl -s -i -H "apikey: $NEXT_PUBLIC_INSFORGE_ANON_KEY" -H "Authorization: Bearer $NEXT_PUBLIC_INSFORGE_ANON_KEY" "$NEXT_PUBLIC_INSFORGE_URL/rest/v1/apps"
  ```
  Confirm request returns permission error (401 / 403 / 42501).

---

## Rollback Procedure (If Smoke Test Fails)

- [ ] **Rollback Rule**: If any check in this smoke test fails:
  1. **STOP IMMEDIATELY before applying Migration B**.
  2. Execute **Vercel Instant Rollback** in the Vercel dashboard to revert to the previous working deployment.
  3. *(Note: The repaired empty tables in Postgres are completely harmless to the old code).*
  4. Do NOT apply Migration B until issues are resolved.

---

## Clean-Up

- [ ] **Delete Smoke Test App**: Once all checks pass, delete the temporary test app from the user dashboard.
