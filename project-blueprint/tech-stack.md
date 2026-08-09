# Tech Stack — Client Health Signal Dashboard

Recommended technology stack for the architecture in [`architecture.md`](architecture.md), explained simply. A fuller, browsable, searchable version of this same document lives in [`stack/index.html`](stack/index.html).

## Fit-Rating Key

| Icon | Label | What it means |
|---|---|---|
| 🟢 | **great fit** | Matches this project's size and needs — pick it, move on. |
| 🟡 | **good fit** | Works, but there is a real caveat you should read first. |
| 🔴 | **consider carefully** | Where this plan is most likely to hurt you. |

Ratings are judged against *this* project's actual scale — roughly 30 active clients, one nightly batch run, one Claude call per client per night, no client-facing users — never against what's generally popular.

## Where This Stack Is Most Likely to Break

This stack's biggest risk isn't a technology choice at all — it's that two of the ten rows (the Learning Platform export and the Survey Tool) are still guesses, because nobody has confirmed either system exposes a real API instead of a manual export. Everything else here is a proven, low-risk match for a roughly-30-client internal tool, but if either of those two turns out to be a dead end, the ingestion layer needs a design change before Phase 1 can honestly close. The two rows below rated 🔴 are exactly this risk, named directly.

## Recommendations, Grouped

### 🖥️ Things a person touches

| Component | Technology | Fit | Why |
|---|---|---|---|
| Health Dashboard UI | **React + TypeScript** (Create React App) | 🟢 great fit | Matches the frontend Colaberry already runs elsewhere, so the existing login just works and a dashboard checked each morning by a handful of managers doesn't need anything fancier. |

### ⌨️ Things you write

| Component | Technology | Fit | Why |
|---|---|---|---|
| Dashboard API | **Node.js + Express + TypeScript** | 🟢 great fit | Matches Colaberry's existing backend stack, and it's far more horsepower than serving one internal dashboard to a small team actually needs. |
| Nightly Ingestion Job | **node-cron** inside the existing backend service | 🟡 good fit | Simplest way to run one 2am job with zero new infrastructure — but if the backend restarts right at 2am, the run silently skips with no retry. |
| Risk Summarizer (AI layer) | **Anthropic TypeScript SDK** (`@anthropic-ai/sdk`) | 🟢 great fit | The official, current way to call Claude from Node — at ~30 summaries a night, nothing more elaborate is needed than one function that builds a prompt and calls the API. |

### 🗄️ Things you store

| Component | Technology | Fit | Why |
|---|---|---|---|
| Client Health Database | **PostgreSQL 16** | 🟢 great fit | The data is naturally table-shaped (clients, engagement records, risk scores), and Postgres handles far more than 30 rows updated once a night without breaking a sweat. |

### 🔌 Things you depend on

| Component | Technology | Fit | Why |
|---|---|---|---|
| Claude API (LLM provider) | **Claude Sonnet 5** via the Messages API | 🟢 great fit | One clear risk paragraph and action per client is well within a mid-tier model's strength — the cost gap to a pricier top-tier model isn't worth paying for at ~30 calls a night. |
| Basecamp API | **Basecamp REST API v3**, API-key auth, polled nightly per project | 🟡 good fit | Built exactly for pulling per-project activity like this — but it's rate-limited, so pulling ~30 projects at 2am needs simple pacing, not 30 calls fired at once. |
| Learning Platform Completion Export | **csv-parse** reading a scheduled export, live-API path added later if one exists | 🔴 consider carefully | Nobody's confirmed whether this platform has a real API or only a manual export — the single biggest open risk to Phase 1. Settle this with the vendor first. |
| Survey Tool | **csv-parse** / scheduled export pull, pending confirmation of the actual tool | 🔴 consider carefully | The tool itself and whether it exposes a real API aren't pinned down yet — naming a specific integration technology here would be guessing, not recommending. |

### 🧭 Things the data flow needs *(not named in the original component list)*

| Component | Technology | Fit | Why |
|---|---|---|---|
| Hosting / Deployment | **Docker Compose** on the existing Colaberry production VPS | 🟢 great fit | The flow needs somewhere for the API, the nightly job, and the built UI to actually run — reusing the existing VPS means zero new infrastructure to buy, secure, or learn. |

## Fit-Rating Breakdown

- 🟢 great fit: **6**
- 🟡 good fit: **2**
- 🔴 consider carefully: **2**

Least confident about: the two 🔴 rows (Learning Platform, Survey Tool) — both are placeholders standing in for an unconfirmed integration shape, not a real technology evaluation. Second-least confident: the Nightly Ingestion Job's 🟡 rating — `node-cron`'s silent-skip-on-restart failure mode is easy to miss until it costs a night of data.

## Copy-Ready Learn-More Prompts

| Component | Prompt |
|---|---|
| Health Dashboard UI | "Explain React and TypeScript to me like I'm new to frontend development, using my Client Health Signal Dashboard project as the example." |
| Dashboard API | "Explain Node.js and Express to me like I'm new to backend development, using my Client Health Signal Dashboard project as the example." |
| Nightly Ingestion Job | "Explain node-cron to me like I'm new to scheduled jobs, using my Client Health Signal Dashboard project as the example, and tell me what I'd need to add for it to retry safely." |
| Risk Summarizer | "Explain the Anthropic TypeScript SDK to me like I'm new to calling LLM (AI language model) APIs from code, using my Client Health Signal Dashboard project as the example." |
| Claude API | "Explain what 'model tiers' mean for the Claude API and why Sonnet fits a summarization task like mine, using my Client Health Signal Dashboard project as the example." |
| Client Health Database | "Explain PostgreSQL to me like I'm new to databases, using my Client Health Signal Dashboard project as the example. What tables would I actually have?" |
| Basecamp API | "Explain the Basecamp API and rate limiting to me like I'm new to working with external APIs, using my Client Health Signal Dashboard project as the example." |
| Learning Platform Export | "I don't yet know if my learning platform has a live API or only a CSV export — walk me through how to find out, and how my Client Health Signal Dashboard's ingestion job should be built to handle either case." |
| Survey Tool | "Help me figure out what integration technology fits my survey tool once I know which product it is, using my Client Health Signal Dashboard project as the example." |
| Hosting / Deployment | "Explain Docker Compose to me like I'm new to deployment, using my Client Health Signal Dashboard project as the example — what would my docker-compose.yml actually contain?" |

## What to Learn First, in Order

1. **PostgreSQL** — everything else reads from or writes to this; understand the data shape before writing code against it.
2. **Node.js + Express + TypeScript** — the shared skeleton both the ingestion job and the AI layer run inside.
3. **Basecamp REST API v3** — the most concretely knowable of the three external integrations; a real, documented API you can start against today.
4. **Learning Platform export/API** — technically simple, but resolve the "does it even have an API" question early; it's the biggest risk in the whole plan, not the hardest skill.
5. **Survey Tool export/API** — same open question as the Learning Platform; settle both before Phase 1 closes.
6. **node-cron** — once you know what each source actually returns, wiring the nightly schedule around them is quick.
7. **Anthropic TypeScript SDK** — only needed once real engagement data exists to summarize.
8. **Claude Sonnet 5 / Messages API** — learn this alongside the SDK; they're the same integration in practice.
9. **React + TypeScript** — the dashboard is the last thing a manager sees; build it once the API already returns real, ranked data.
10. **Docker Compose** — learn this last, right before the first real deploy.

## Alternatives Considered

| Component | Chosen | Alternative | Why not |
|---|---|---|---|
| Health Dashboard UI | React + TypeScript | Next.js | Solves SEO/complex routing problems this single internal dashboard doesn't have. |
| Dashboard API | Node + Express | Fastify | Faster under high volume, but this API serves a handful of managers once a morning — Express's simplicity and existing familiarity matter more. |
| Nightly Ingestion Job | node-cron | BullMQ (Redis-backed job queue) | A queue earns its keep with many competing jobs; one job once a night doesn't need new infrastructure (Redis) just for a timer. |
| Risk Summarizer | Anthropic SDK | Raw `fetch` to the Messages API | Saves one small dependency but means hand-rolling retries and typed responses the SDK already provides. |
| Claude API | Claude Sonnet 5 | Claude Opus 5 | Opus is stronger, but one clear paragraph per client doesn't need top-tier reasoning; Sonnet is cheaper and fast enough. |
| Client Health Database | PostgreSQL | MongoDB | The data is naturally relational (clients, engagement, scores); a schema-less store adds ambiguity, not value. |
| Basecamp API | Basecamp REST API v3 | A no-code tool like Zapier | Adds a new paid third-party service and its own point of failure for an integration simple enough to poll directly. |
| Learning Platform Export | csv-parse (placeholder) | Building against a live Learning Platform API | The actually-preferred answer — but unconfirmed the platform has one, so it can't be recommended yet. |
| Survey Tool | csv-parse (placeholder) | Building against a live Survey Tool API | Same reasoning — the tool and its API surface aren't identified yet. |
| Hosting / Deployment | Docker Compose on existing VPS | A new managed cloud service | Standing up a second piece of infrastructure for a ~30-client internal tool, when the existing VPS already has room. |

## How Hard Each Decision Is to Undo

| Component | Difficulty to undo | Why |
|---|---|---|
| Client Health Database (PostgreSQL) | 🔴 Hard | Once real client data accumulates, migrating a relational schema to a different database is a significant, risky project — get this one right early. |
| Health Dashboard UI (React + TS) | 🟡 Medium | Rewriting every screen, but doesn't touch data or the API contract underneath it. |
| Dashboard API (Node + Express) | 🟡 Medium | Rewriting route handlers, but the database and frontend don't need to change. |
| Basecamp API integration | 🟡 Medium | Isolated to one ingestion module; swapping means re-mapping fields, not redesigning the system. |
| Learning Platform export | 🟡 Medium | Cheap to change now while it's just CSV parsing; more work once other code assumes that shape. |
| Survey Tool export | 🟡 Medium | Same as the Learning Platform. |
| Hosting (Docker Compose) | 🟡 Medium | A real infra migration, but nothing proprietary means no vendor lock-in. |
| Nightly Ingestion Job (node-cron) | 🟢 Easy | One small, isolated piece — a localized change to how one function gets triggered. |
| Risk Summarizer (Anthropic SDK) | 🟢 Easy | A thin wrapper around one API call — swapping providers mostly means rewriting one prompt-building function. |
| Claude API model choice | 🟢 Easy | Changing which model you call is a one-line configuration change against the same API. |

## What This Document Does NOT Tell You

- The exact PostgreSQL table design — this names the database engine, not the schema of clients, engagement records, and risk scores you'd actually create.
- Whether the Learning Platform or Survey Tool actually has a live API — still an open question from the architecture doc, not settled by picking csv-parse as a placeholder.
- How the existing Colaberry login actually gets reused by this dashboard — the architecture assumes it; this document doesn't design that integration.
- What any of this actually costs — no Claude API pricing, VPS resource sizing, or budget estimate is included here.
- How code gets tested and deployed beyond `docker compose up --build` — no CI/CD pipeline design.
- How to handle a client spanning more than one Basecamp project or learning cohort — the architecture doc flags this as an open assumption this stack choice doesn't resolve.
