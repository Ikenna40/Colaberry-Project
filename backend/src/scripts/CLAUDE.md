# backend/src/scripts/CLAUDE.md

Local conventions for this subtree. Read the root [`CLAUDE.md`](../../../CLAUDE.md) first.

## Rules

- One script, one clear responsibility. A script that "also does X" should be split.
- Naming: `sendXxx.js`, `basecampXxx.js`, `fixXxx.js` — the prefix states the verb, the suffix states the target.
- Disposable but auditable — every script must be understandable in isolation, without needing the rest of the codebase loaded.
- Must be idempotent — re-running a script must never double-send, double-create, or double-write. See root CLAUDE.md's Idempotency & Replayability section.
- Never imported by `../services/` or `../routes/` — if logic needs to be reused by the running app, it belongs in `services/`, not here.

## Status

Structure only as of 2026-07-30 (Session `CC-20260730-7q2k`). Empty — no scripts written yet.
