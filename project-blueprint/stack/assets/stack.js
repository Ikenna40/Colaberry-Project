/* Single source of truth for the tech-stack knowledge base. Every page renders from this object.
   Top-level `const` here is NOT a property of `window` in a classic (non-module) script —
   other scripts on the same page reference the bare identifier `STACK`, never `window.STACK`. */
const STACK = {
  meta: {
    title: "Client Health Signal Dashboard",
    subtitle: "Recommended technology stack, explained simply",
    generated: "2026-08-06"
  },

  ratingLegend: [
    { icon: "🟢", key: "green", label: "great fit", meaning: "Matches this project's size and needs — pick it, move on." },
    { icon: "🟡", key: "yellow", label: "good fit", meaning: "Works, but there is a real caveat worth reading first." },
    { icon: "🔴", key: "red", label: "consider carefully", meaning: "Where this plan is most likely to hurt you." }
  ],

  headline: "This stack's biggest risk isn't a technology choice at all — it's that two of the ten rows (the Learning Platform export and the Survey Tool) are still guesses, because nobody has confirmed either system exposes a real API instead of a manual export. Everything else here is a proven, low-risk match for a roughly-30-client internal tool, but if either of those two turns out to be a dead end, the ingestion layer needs a design change before Phase 1 can honestly close.",

  groupOrder: [
    { key: "touch", label: "Things a person touches", icon: "🖥️" },
    { key: "write", label: "Things you write", icon: "⌨️" },
    { key: "store", label: "Things you store", icon: "🗄️" },
    { key: "depend", label: "Things you depend on", icon: "🔌" },
    { key: "flow", label: "Things the data flow needs", icon: "🧭" }
  ],

  recommendations: [
    { id: "ui", component: "Health Dashboard UI", short: "React + TS", group: "touch", categoryIcon: "🖥️", fromFlow: false,
      technology: "React + TypeScript (Create React App)", fit: "green",
      why: "Matches the frontend Colaberry already runs elsewhere, so the existing login just works and a dashboard checked each morning by a handful of managers doesn't need anything fancier.",
      caveat: "",
      prompt: "Explain React and TypeScript to me like I'm new to frontend development, using my Client Health Signal Dashboard project as the example." },

    { id: "api", component: "Dashboard API", short: "Node + Express", group: "write", categoryIcon: "⚙️", fromFlow: false,
      technology: "Node.js + Express + TypeScript", fit: "green",
      why: "Matches Colaberry's existing backend stack, and it's far more horsepower than serving one internal dashboard to a small team actually needs.",
      caveat: "",
      prompt: "Explain Node.js and Express to me like I'm new to backend development, using my Client Health Signal Dashboard project as the example." },

    { id: "job", component: "Nightly Ingestion Job", short: "node-cron", group: "write", categoryIcon: "⏰", fromFlow: false,
      technology: "node-cron (a library that runs code on a schedule, e.g. \"every day at 2am\") inside the existing backend service", fit: "yellow",
      why: "It's the simplest way to run one 2am job with zero new infrastructure.",
      caveat: "If the backend happens to be restarting right at 2am, the run just silently skips with no retry — add a \"did last night's run finish?\" check before the team relies on it daily.",
      prompt: "Explain node-cron to me like I'm new to scheduled jobs, using my Client Health Signal Dashboard project as the example, and tell me what I'd need to add for it to retry safely." },

    { id: "agent", component: "Risk Summarizer (AI layer)", short: "Anthropic SDK", group: "write", categoryIcon: "🤖", fromFlow: false,
      technology: "Anthropic TypeScript SDK (@anthropic-ai/sdk)", fit: "green",
      why: "It's the official, current way to call Claude from Node, and at roughly 30 summaries a night there's no need for anything more elaborate than one function that builds a prompt and calls the API.",
      caveat: "",
      prompt: "Explain the Anthropic TypeScript SDK to me like I'm new to calling LLM (AI language model) APIs from code, using my Client Health Signal Dashboard project as the example." },

    { id: "claude", component: "Claude API (LLM provider)", short: "Claude Sonnet 5", group: "depend", categoryIcon: "🔌", fromFlow: false,
      technology: "Claude Sonnet 5 via the Messages API (the endpoint you send a prompt to and get Claude's reply from)", fit: "green",
      why: "Writing one clear risk paragraph and a recommended action per client is well within a mid-tier model's strength, and at ~30 calls a night the cost gap to a pricier top-tier model isn't worth paying for.",
      caveat: "",
      prompt: "Explain what 'model tiers' mean for the Claude API and why Sonnet fits a summarization task like mine, using my Client Health Signal Dashboard project as the example." },

    { id: "db", component: "Client Health Database", short: "PostgreSQL 16", group: "store", categoryIcon: "🗄️", fromFlow: false,
      technology: "PostgreSQL 16", fit: "green",
      why: "The data is naturally table-shaped (clients, engagement records, risk scores), and Postgres handles far more than 30 rows updated once a night without breaking a sweat.",
      caveat: "",
      prompt: "Explain PostgreSQL to me like I'm new to databases, using my Client Health Signal Dashboard project as the example. What tables would I actually have?" },

    { id: "basecamp", component: "Basecamp API", short: "Basecamp API v3", group: "depend", categoryIcon: "🔌", fromFlow: false,
      technology: "Basecamp REST API v3 (a standard way for two systems to exchange data over the web), API-key auth, polled nightly per client project", fit: "yellow",
      why: "Basecamp's API is built exactly for pulling per-project activity like this.",
      caveat: "It's rate-limited (only allows so many requests per minute before it starts blocking you), so pulling ~30 projects back-to-back at 2am needs simple pacing, not 30 calls fired at once.",
      prompt: "Explain the Basecamp API and rate limiting to me like I'm new to working with external APIs, using my Client Health Signal Dashboard project as the example." },

    { id: "lms", component: "Learning Platform Completion Export", short: "csv-parse (LMS)", group: "depend", categoryIcon: "🔌", fromFlow: false,
      technology: "csv-parse (a Node.js library for reading spreadsheet-style export files) reading a scheduled export, with a live-API path added later if one turns out to exist", fit: "red",
      why: "The architecture doc itself flags that nobody's confirmed whether this learning platform has a real API or only a manual export — that's the single biggest open risk to Phase 1.",
      caveat: "Settle this with the vendor before any ingestion code is written against an assumption.",
      prompt: "I don't yet know if my learning platform has a live API or only a CSV export — walk me through how to find out, and how my Client Health Signal Dashboard's ingestion job should be built to handle either case." },

    { id: "survey", component: "Survey Tool", short: "csv-parse (Survey)", group: "depend", categoryIcon: "🔌", fromFlow: false,
      technology: "csv-parse / scheduled export pull, same reasoning as the learning platform, pending confirmation of the actual tool in use", fit: "red",
      why: "The specific survey tool and whether it exposes a real API aren't pinned down in the architecture yet, so naming a specific integration technology here would be guessing rather than recommending.",
      caveat: "Confirm the tool first.",
      prompt: "Help me figure out what integration technology fits my survey tool once I know which product it is, using my Client Health Signal Dashboard project as the example." },

    { id: "hosting", component: "Hosting / Deployment", short: "Docker Compose", group: "flow", categoryIcon: "🧭", fromFlow: true,
      technology: "Docker Compose on the existing Colaberry production VPS", fit: "green",
      why: "The data flow needs somewhere for the API, the nightly job, and the built UI to actually run, and reusing the VPS that already runs the rest of Colaberry's stack means zero new infrastructure to buy, secure, or learn.",
      caveat: "",
      prompt: "Explain Docker Compose to me like I'm new to deployment, using my Client Health Signal Dashboard project as the example — what would my docker-compose.yml actually contain?" }
  ],

  learningOrder: [
    { rank: 1, id: "db", reason: "Everything else reads from or writes to this — understand the data shape before writing code against it." },
    { rank: 2, id: "api", reason: "This is the shared skeleton both the ingestion job and the AI layer run inside." },
    { rank: 3, id: "basecamp", reason: "The most concretely knowable of the three external integrations — a real, documented API you can start against today." },
    { rank: 4, id: "lms", reason: "Technically simple, but resolve the open \"does it even have an API\" question early — it's the biggest risk in the whole plan, not the hardest skill." },
    { rank: 5, id: "survey", reason: "Same open question as the Learning Platform — settle both integrations' real shape before Phase 1 closes." },
    { rank: 6, id: "job", reason: "Once you know what each source actually returns, wiring the nightly schedule around them is quick." },
    { rank: 7, id: "agent", reason: "Only needed once real engagement data exists to summarize — no point learning it before Phase 1 has data flowing." },
    { rank: 8, id: "claude", reason: "Learn this alongside the SDK above — they're the same integration in practice." },
    { rank: 9, id: "ui", reason: "The dashboard is the last thing a manager sees; build it once the API already returns real, ranked data." },
    { rank: 10, id: "hosting", reason: "Learn this last, right before the first real deploy — no need to think about hosting until there's something worth deploying." }
  ],

  alternatives: [
    { id: "ui", alternative: "Next.js", whyNot: "Next.js's server-rendering and routing power solve problems (SEO, complex multi-page navigation) this single internal dashboard doesn't have; it adds a build/runtime model to learn for no benefit here." },
    { id: "api", alternative: "Fastify", whyNot: "Fastify is faster under high request volume, but this API serves a handful of managers checking one dashboard each morning — Express's simplicity and Colaberry's existing familiarity with it matter more than raw throughput." },
    { id: "job", alternative: "BullMQ (a Redis-backed job queue)", whyNot: "A job queue earns its keep with many jobs competing for workers or retries across a fleet of machines; one job running once a night doesn't need new infrastructure (Redis) just to get a timer." },
    { id: "agent", alternative: "Calling the Messages API directly with fetch, no SDK", whyNot: "Skipping the SDK saves one small dependency but means hand-rolling retries, typed responses, and error handling the SDK already provides — not worth it for 30 calls a night." },
    { id: "claude", alternative: "Claude Opus 5", whyNot: "Opus is the strongest model in the family, but writing one clear risk paragraph and action per client doesn't need top-tier reasoning — Sonnet is meaningfully cheaper and fast enough for a nightly batch job." },
    { id: "db", alternative: "MongoDB", whyNot: "The data here is clients, engagement records, and scores — naturally table-shaped with clear relationships, exactly what a relational database is built for; a flexible schema-less store would just add ambiguity." },
    { id: "basecamp", alternative: "A no-code automation tool like Zapier", whyNot: "That introduces a new paid third-party service and its own point of failure, for an integration simple enough to poll directly from the ingestion job that already exists." },
    { id: "lms", alternative: "Building against a live Learning Platform API", whyNot: "This is actually the preferred long-term answer — but nobody has confirmed the platform has one yet, so it can't be recommended as the Phase 1 technology until that's verified." },
    { id: "survey", alternative: "Building against a live Survey Tool API", whyNot: "Same reasoning as the Learning Platform — the tool and its API surface, if any, aren't identified yet, so this is a placeholder until that's resolved." },
    { id: "hosting", alternative: "A new managed cloud service (e.g. a fresh AWS or Render deployment)", whyNot: "That means standing up, securing, and paying for a second piece of infrastructure just for a ~30-client internal tool, when the existing VPS already runs the rest of the stack with room for one more service." }
  ],

  reversibility: [
    { id: "ui", difficulty: "medium", reason: "Swapping frontend frameworks means rewriting every screen, but it doesn't touch data or the API contract underneath it." },
    { id: "api", difficulty: "medium", reason: "A backend framework swap means rewriting route handlers, but the database and frontend don't need to change." },
    { id: "job", difficulty: "easy", reason: "The scheduler is one small, isolated piece — swapping it is a localized change to how one function gets triggered." },
    { id: "agent", difficulty: "easy", reason: "It's a thin wrapper around one API call — swapping providers mostly means rewriting a single prompt-building function." },
    { id: "claude", difficulty: "easy", reason: "Changing which Claude model you call is a one-line configuration change against the same API." },
    { id: "db", difficulty: "hard", reason: "Once real client data accumulates, migrating a relational schema to a different database is a significant, risky project — this is the decision to get right early." },
    { id: "basecamp", difficulty: "medium", reason: "The integration code is isolated to one ingestion module; swapping means re-mapping fields, not redesigning the system." },
    { id: "lms", difficulty: "medium", reason: "Cheap to change while it's just reading a CSV export, but if later code assumes that shape, moving to a live API means re-normalizing the ingestion step." },
    { id: "survey", difficulty: "medium", reason: "Same as the Learning Platform: cheap to change now, more work once other code has been built around the CSV shape." },
    { id: "hosting", difficulty: "medium", reason: "Moving off the shared VPS to a different host is a real infrastructure migration, but nothing here is proprietary — no vendor lock-in makes the move mechanically straightforward." }
  ],

  notTold: [
    "The exact PostgreSQL table design — this names the database engine, not the schema of clients, engagement records, and risk scores you'd actually create.",
    "Whether the Learning Platform or Survey Tool actually has a live API — that's still an open question from the architecture doc, not settled by picking csv-parse as a placeholder.",
    "How the existing Colaberry login actually gets reused by this dashboard — the architecture assumes it; this document doesn't design that integration.",
    "What any of this actually costs — no Claude API pricing, VPS resource sizing, or budget estimate is included here.",
    "How code gets tested and deployed beyond \"docker compose up --build\" — no CI/CD pipeline design.",
    "How to handle a client spanning more than one Basecamp project or learning cohort — the architecture doc flags this as an open assumption this stack choice doesn't resolve."
  ],

  topology: [
    { id: "ui", location: "local", note: "Built and served from Colaberry's own infrastructure." },
    { id: "api", location: "local", note: "Runs on the Colaberry VPS, inside the existing backend service." },
    { id: "job", location: "local", note: "Runs on the same VPS, on a schedule, inside the backend service." },
    { id: "db", location: "local", note: "PostgreSQL runs on Colaberry's own infrastructure — client data never leaves it at rest." },
    { id: "hosting", location: "local", note: "The Docker host itself — the VPS Colaberry already operates." },
    { id: "agent", location: "local", note: "The summarizing code runs on the Colaberry VPS; only the prompt text leaves the building." },
    { id: "claude", location: "hosted", note: "Runs on Anthropic's servers — client signal data is sent there in the prompt each night." },
    { id: "basecamp", location: "hosted", note: "Runs on Basecamp's (37signals') servers — task activity is pulled from them nightly." },
    { id: "lms", location: "hosted", note: "Runs on the learning platform vendor's servers — completion data is exported from them." },
    { id: "survey", location: "hosted", note: "Runs on the survey tool vendor's servers — satisfaction scores are exported from them." }
  ]
};
