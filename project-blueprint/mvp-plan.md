# MVP Plan — Client Health Signal Dashboard

## The Idea
An internal tool that pulls nightly engagement data from Basecamp, the learning platform, and the survey tool into one place so a Colaberry customer success manager can see every active client ranked by risk each morning.

## What Week 1 Proves
That combining real signals from Basecamp task activity, learning-platform completion, and survey satisfaction for actual clients produces a ranking that meaningfully differs from client to client — the hardest unknown behind Phase 1 (Data Foundation) — before any scheduling, AI layer, or dashboard UI is built.

## Week 1 Checklist

**Data**
- [ ] Create `clients` and `client_engagement` tables in **PostgreSQL** (`clients`: id, name, basecamp_project_id; `client_engagement`: client_id, last_task_activity_at, completion_pct, satisfaction_score, computed_risk_score, pulled_at).

**Backend**
- [ ] Write one **Node.js + TypeScript** script (run manually, not yet on `node-cron`) that calls the **Basecamp REST API v3** for 5–10 real active client projects and pulls task activity from the last 24 hours.
- [ ] Use **csv-parse** to read one real (or most-recently-available) course-completion export from the learning platform and one real satisfaction export from the survey tool, matched to the same 5–10 clients.
- [ ] Normalize all three sources into one `client_engagement` row per client and write it to **PostgreSQL** via a single manual script run — no scheduling, no AI yet, just correctness of one pass.
- [ ] Compute one simple rule-based risk score in **TypeScript** directly from each normalized row (e.g. days since last Basecamp activity + inverse completion % + inverse satisfaction score).

**Output**
- [ ] Write one script that queries `client_engagement` in **PostgreSQL** and prints a plain ranked table (console output or one unstyled HTML page) of the 5–10 clients from highest to lowest risk score.

## Explicitly Out of Scope for Week 1
- Health Dashboard UI (React + TypeScript) — a console/plain table is enough to prove the ranking is meaningful; the real screen is a Phase 2/4 concern once the underlying signal is proven.
- Dashboard API (Node.js + Express) — no HTTP layer needed yet; the Week 1 script talks to PostgreSQL directly.
- `node-cron` scheduling — this week's pull is a manual one-off run; automating it is a Phase 1 finishing detail, not this week's risky question.
- Risk Summarizer + Claude API — Phase 3 asks whether an AI summary beats the rule-based score; that comparison is meaningless until the rule-based score itself exists and differentiates clients.
- Login / internal auth reuse — a Phase 4 polish concern; no multi-user access is needed to answer this week's question.
- All ~30 active clients — 5–10 real clients is enough to prove the pipeline works end-to-end; scaling to the full roster is a Phase 1 finishing detail, not this week's risk.

## What "Done" Looks Like
Running one command produces a ranked table of at least 5 real active clients, each row showing a real Basecamp last-activity timestamp, a real completion percentage, and a real satisfaction score pulled from that week's actual API call and export files (not fabricated test data) — and the resulting risk scores are visibly different across clients, not all tied at the same number.
