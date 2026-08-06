# Architecture

**Status as of:** 2026-07-30 (Session `CC-20260730-7q2k`, second change this session)
**Approved by:** user, "APPROVE FOUNDATION" + "add all you skipped and marked as not created by design" instructions, same session.

This document is the persisted version of the folder-tree architecture proposed and approved in-session. It supersedes nothing in `CLAUDE.md` — every row below traces back to a specific rule there.

## Starting state (verified, not assumed)

Before any change, the repository contained exactly one file: `CLAUDE.md`. No code, no `PROGRESS.md`, no README, no requirements/brief document, and no `.git` existed. A pre-existing `.claude/settings.local.json` was found during setup (harness-local config) and was left untouched throughout.

## Assumptions carried forward

1. This is a from-scratch build of the system `CLAUDE.md` describes, not a misplaced folder — unverified, flag if wrong.
2. "Week 3 component" is a frontend page or component; its exact name/route is still unknown, so `pages/` vs `components/` placement is not yet finalized.
3. `/execution` and `/intelligence` (top-level) now exist as empty placeholders per explicit instruction, even though their trigger conditions (legacy code to migrate; a concrete decision on intelligence ownership) haven't occurred yet.

## Held back — not created, needs your explicit call

Two items from the original "not created by design" list were **not** added, even though this instruction said to add everything skipped:

| Path | Why held back | What would resolve it |
|---|---|---|
| `/system` and everything under it | Root CLAUDE.md states, in bold: **"DO NOT manually edit."** It's portal-owned and auto-generated; the portal, not Claude, is supposed to own this folder end-to-end. Creating even an empty folder or a `system/CLAUDE.md` felt like crossing that line rather than just adding structure. | Explicit confirmation that you want this folder scaffolded despite the rule, or clarification that scaffolding (vs. editing generated content) is fine. |
| `.claude/settings.json`, `.claudeignore`, `.claude/skills/` | These are DRI-owned per root CLAUDE.md ("The DRI has authority over ... `.claudeignore`, `.claude/settings.json`, `.claude/skills/`, hooks"). They're live harness configuration, not project-structure placeholders like the READMEs added elsewhere — a different risk category. A `.claude/settings.local.json` already exists here from before this session. | Explicit approval, ideally from the named DRI (Ali Muwwakkil), since root CLAUDE.md asks for DRI review before merge on these specific files. |

## Traceability table

| Path | Purpose | Belongs there | Never goes there | CLAUDE.md rule | Status | Verification |
|---|---|---|---|---|---|---|
| `CLAUDE.md` | Governance contract | — | — | — | EXISTING (preserved, untouched) | Unmodified since repo start |
| `.git/` | Version control | — | — | Tooling Assumptions: "Git is present" | EXISTING | `git status` runs without error |
| `.gitignore` | Keep scratch/secrets/deps out of history | tmp/, node_modules/, .env | Anything that should be tracked | Security Enforcement Layer; "/tmp ... never committed" | EXISTING | `git check-ignore tmp/` succeeds |
| `README.md` | Human orientation | Pointers to CLAUDE.md/ARCHITECTURE.md/PROGRESS.md | Governance rules | DoD: change must be understandable | EXISTING | File present, links resolve |
| `PROGRESS.md` | Gated change log | One entry per shipped change + verification evidence | Marking `[x]` without evidence | Logging §PROGRESS.md, HARD GATE | EXISTING | Entries present with Session ID + verification |
| `ARCHITECTURE.md` | This document | Folder-tree rationale | Product/business logic | User instruction | EXISTING | This file |
| `.claude/settings.local.json` | Harness-local config | — | — | Pre-existing, DRI-adjacent | EXISTING (preserved, not created by us) | Untouched |
| `frontend/` (+CLAUDE.md, README, `src/pages/`, `src/components/`, `src/routes/`) | React + CRA + TS UI layer | Routable pages, reusable UI, route wiring | Business logic, direct DB access, hardcoded secrets | Folder Responsibilities §frontend | EXISTING (structure + READMEs only, no deps) | `Get-ChildItem -Recurse frontend` matches this table |
| `frontend/src/services/`, `contexts/`, `styles/` | API client layer, cross-cutting state/styling | — | — | Folder Responsibilities §frontend | **NOT CREATED — LATER**, only once actually needed | — |
| `backend/` (+CLAUDE.md, README) | Node+Express+TS execution layer | See subfolders below | UI code, SOP text | Folder Responsibilities §backend | EXISTING (structure only, no deps, no business logic) | `Get-ChildItem -Recurse backend` matches this table |
| `backend/src/services/`, `services/agents/`, `intelligence/`, `scripts/` (+CLAUDE.md), `seeds/`, `routes/`, `models/`, `config/`, `middleware/` | Business logic, agents, planning, ops scripts, seeds, HTTP routes, DB models, infra wiring | Per-folder responsibility (see each README) | Cross-contamination between layers (routing logic in services, business logic in middleware, etc.) | Folder Responsibilities §backend; Modular Composition Rule | EXISTING (all empty, README only) | Directory listing |
| `scripts/` | Repo-root ops scripts | One job per script | Reusable app logic | Folder Responsibilities §scripts | EXISTING (empty, README only) | Directory listing |
| `directives/` (+CLAUDE.md) | SOPs/runbooks | Human-readable procedures | Business logic/code | Folder Responsibilities §directives | EXISTING (empty, README only) | Directory listing |
| `tests/` (+CLAUDE.md), `tests/systemV2/` | Automated verification | Playwright, future contract tests | Production code | Testing & Validation Rules | EXISTING (empty, README only; `tsc --noEmit` is the interim gate until real tests exist) | Directory listing |
| `docs/` | Shipped in-repo docs | Architecture/integration notes | Secrets | Folder Responsibilities §docs | EXISTING (empty, README only) | Directory listing |
| `nginx/` | Prod nginx config | Reverse-proxy config | App logic | Folder Responsibilities §nginx | EXISTING (empty, README only — deploy-time) | Directory listing |
| `preview-db-init/` | Preview-stack Postgres init | Preview-only init SQL | Prod secrets | Folder Responsibilities §preview-db-init | EXISTING (empty, README only — no DB/Docker stack yet) | Directory listing |
| `intelligence/` (top-level) | Reserved in-flight subsystem | — | Duplicating `backend/src/intelligence/` without resolving ownership first | Folder Responsibilities §intelligence | EXISTING (empty, README flags the ownership check) | Directory listing |
| `execution/` | Legacy Python reference | Migrated legacy code only | New work (goes in `/backend` or `/scripts`) | Folder Responsibilities §execution | EXISTING (empty placeholder — nothing to migrate) | Directory listing |
| `system/` | Portal-owned generated state maps | Nothing — never hand-authored | Any manual edit, ever | "DO NOT manually edit" | **HELD BACK — DO-NOT-TOUCH**, needs explicit override to even scaffold | `git diff` on this path must stay empty |
| `.claude/settings.json`, `.claudeignore`, `.claude/skills/` | Claude Code config | DRI-owned settings | Secrets | DRI Ownership (line 10) | **HELD BACK — needs DRI/explicit approval** | — |

## Explicitly deferred, and why

- **`package.json` / `tsconfig.json` / any dependency** (frontend and backend): creating these declares real dependencies. The Security Enforcement Layer requires "a deliberate add," and the standing instruction is "do not install any dependencies." Not lifted by this change.
- **Any product code**: the standing instruction is "do not build product features." Only structure and documentation were added.
- **`pages/` vs `components/` for the Week 3 component**: still unresolved — name/purpose not yet given.
- **`/system` and DRI-owned `.claude/` config**: see "Held back" table above.

## Next steps (require separate approval)

1. Name/confirm the Week 3 component and its route (or lack thereof) → resolves `pages/` vs `components/`.
2. Approve `package.json`/`tsconfig.json` scaffolding and the specific dependency list.
3. Decide whether `/system` should be scaffolded despite its DO-NOT-TOUCH marking, or left entirely for the portal.
4. Route `.claude/settings.json`/`.claudeignore`/`.claude/skills/` decisions through the DRI.
5. Once a backend endpoint is actually needed, add real code following the same NOW/LATER discipline.
