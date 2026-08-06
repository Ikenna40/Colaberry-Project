# backend/CLAUDE.md

Local conventions for this subtree. Read the root [`CLAUDE.md`](../CLAUDE.md) first — this file only adds backend-specific rules; it does not repeat global ones (autonomy model, testing rules, idempotency, security, observability).

## Stack

Node.js + Express + TypeScript, per the root file's Folder Responsibilities section. Not yet scaffolded — no `package.json` exists (see root `ARCHITECTURE.md`).

## Subfolder responsibilities

- `src/services/` — business logic (alumni, briefings, outreach agents, content generation, etc.). No HTTP routing here — that's `src/routes/`.
- `src/services/agents/` — agent orchestration (openclaw, intelligence, marketing subtrees).
- `src/intelligence/` — planning, prompt generation, decision engines.
- `src/scripts/` — one-off operational scripts. See `src/scripts/CLAUDE.md`. Disposable, single-responsibility, never imported by the running app.
- `src/seeds/` — seed data and migration scripts.
- `src/routes/` — Express route definitions (admin, portal, public). Validate inputs with Zod before business logic ever sees them.
- `src/models/` — Sequelize models. The contract for database access; raw SQL only when no model exists, typed at the call site.
- `src/config/`, `src/middleware/` — infra wiring only, no business logic.

## Contracts

`tsc --noEmit` must pass before merge. No `any` without a written justification comment. Every external call needs an explicit timeout and a documented retry policy — see root CLAUDE.md's Failure-First Design and Security Enforcement Layer sections.

## Status

Structure only as of 2026-07-30 (Session `CC-20260730-7q2k`). No `package.json`, no dependencies, no business logic yet — creating those requires separate explicit approval.
