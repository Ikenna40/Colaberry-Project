# frontend/CLAUDE.md

Local conventions for this subtree. Read the root [`CLAUDE.md`](../CLAUDE.md) first — this file only adds frontend-specific rules; it does not repeat global ones (autonomy model, testing rules, idempotency, security).

## Stack

React + Create React App + TypeScript, per the root file's Folder Responsibilities section. Not yet scaffolded — see Status below.

## Placement rules

- `src/pages/` — top-level, routable components. One page = one URL.
- `src/components/` — reusable UI with no route of its own. If it's used by 2+ pages, or generic enough to be, it belongs here, not duplicated inside a page.
- `src/routes/` — route tree definitions (public / admin / portal) that wire pages to URLs. Add an entry here whenever a new page needs one.
- `src/services/` — the only layer allowed to call the backend API. Pages and components call services, never `fetch`/`axios` directly.
- `src/contexts/`, `src/styles/` — cross-cutting state and styling only, not page- or component-specific logic.

## Design system

Do not hand-roll colors, spacing, or component patterns here — invoke `/frontend-design`, `/baseline-ui`, `/fixing-accessibility`, `/fixing-motion-performance`, or `/ui-ux-design` per the root file's UI/UX Design section. Target audience: enterprise executives, 35-60 — Bloomberg meets Salesforce, not consumer SaaS.

## Status

Scaffold only as of 2026-07-30 (Session `CC-20260730-7q2k`). No `package.json`/`tsconfig.json` yet — adding them means declaring real dependencies, which needs an explicit, deliberate approval per the root file's Security Enforcement Layer.
