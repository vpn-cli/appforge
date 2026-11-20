# Production Smoke Test Checklist

Post-deployment verification protocol for AppForge production releases. Execute this checklist in a browser immediately following code deployment and before applying contract migrations.

Published App Smoke-Test URL: [TODO]

---

## Pre-Flight Environment & Interface Verification

- [ ] **Landing Page Render (Light Theme)**: Navigate to `/` in a clean browser session with Light theme active. Verify page renders with zero console errors, navbar and buttons render with high contrast, and animations execute smoothly.
- [ ] **Landing Page Render (Dark Theme)**: Toggle to Dark theme. Verify background ribbons, demo cards, and text maintain full legibility with zero console errors.
- [ ] **Builder Smoke Test (Light Theme)**: Navigate to `/builder/demo` with Light theme active. Verify Monaco editor, preview canvas, and floating Copilot pill initialize without hydration errors or console exceptions.
- [ ] **Builder Smoke Test (Dark Theme)**: Toggle to Dark theme in `/builder/demo`. Verify Monaco editor syntax tokens switch to dark palette with legible line numbers and clear cursor visibility.

---

## Core Application & Database Integration Checklist

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
  - Verify that the persisted record inserted in Step 3 is rendered in the public view.

---

## Production Security & Route Guard Checklist

- [ ] **Protected Route Redirect**: In the signed-out window, attempt to navigate to `/apps`. Confirm you are immediately redirected to `/sign-in`.
- [ ] **Dashboard Canonicalization**: In the signed-out window, navigate to `/dashboard`. Confirm it cleanly redirects to `/apps` (and subsequently to `/sign-in`).
- [ ] **Test Route Lockdown**: In the browser, navigate to each of the following test endpoints and verify that all return a 404 Not Found error in production:
  - [ ] `/api/sentry-test` → Returns 404
  - [ ] `/dev/renderers` → Returns 404
  - [ ] `/test-renderers` → Returns 404

---

## Clean-Up

- [ ] **Delete Smoke Test App**: Once all checks pass, delete the temporary test app from the user dashboard.
