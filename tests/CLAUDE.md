# tests/CLAUDE.md

Local conventions for this subtree. Read the root [`CLAUDE.md`](../CLAUDE.md) first.

## Rules

- Browser automation (Playwright) lives in `systemV2/`.
- Must NEVER touch production — integration and E2E tests run against dev sandboxes or staging only.
- Target distribution across the whole suite (not just this folder): ~70% unit (co-located with the code under test, not here), ~20% integration, ~10% E2E. A suite with more E2E than unit is a process violation.
- Every feature needs, at minimum: happy path, failure path, boundary cases, and an idempotency check.

## Status

Structure only as of 2026-07-30 (Session `CC-20260730-7q2k`). Empty — no tests written yet.
