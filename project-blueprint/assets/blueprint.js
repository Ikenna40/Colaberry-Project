/* Single source of truth for the whole knowledge base. Every page renders from this object.
   Top-level `const` here is NOT a property of `window` in a classic (non-module) script —
   other scripts on the same page reference the bare identifier `BLUEPRINT`, never `window.BLUEPRINT`. */
const BLUEPRINT = {
  meta: {
    title: "Client Health Signal Dashboard",
    subtitle: "Architecture blueprint for Colaberry's customer success team",
    generated: "2026-08-06"
  },

  idea: {
    paragraph: "Colaberry runs a cohort-based Enterprise AI Leadership Accelerator for corporate clients, and today client health is tracked by memory and scattered spreadsheets pulled from Basecamp tasks, course-completion exports, and post-session surveys. This project is a Client Health Signal Dashboard for Colaberry's customer success team: every night it pulls engagement data from the Basecamp API (task activity), the learning platform's completion export (course progress), and the survey tool (satisfaction scores) into one place, an AI layer reads each client's combined signal and writes a one-paragraph risk summary plus a recommended next action, and a customer success manager logs in each morning to see every active client ranked by urgency.",
    mustDoWell: "Within a single login, correctly surface which of the roughly 30 active enterprise clients need a check-in this week, and why. Everything else can be rough at first."
  },

  components: [
    { id: "ui", name: "Health Dashboard UI", layer: "Frontend", type: "frontend",
      description: "The screen a customer success manager opens each morning to see every client ranked by how urgently they need attention.",
      why: "“a customer success manager logs in each morning to see every active client ranked by urgency”" },
    { id: "api", name: "Dashboard API", layer: "Backend", type: "backend",
      description: "The traffic controller that gathers everything the dashboard needs — rankings, summaries, recommended actions — and hands it to the screen.",
      why: "Implied by “logs in… to see” — a human interface needs something serving it assembled data" },
    { id: "job", name: "Nightly Ingestion Job", layer: "Backend", type: "backend",
      description: "The overnight worker that goes out, collects the latest activity from all three outside systems, and tidies it into one record per client before anyone logs in.",
      why: "“every night it pulls engagement data… into one place”" },
    { id: "agent", name: "Risk Summarizer", layer: "AI", type: "ai",
      description: "Reads a client's combined activity, coursework, and satisfaction signals and writes, in plain language, how worried the team should be and what to do about it.",
      why: "“an AI layer reads each client's combined signal and writes a one-paragraph risk summary plus a recommended next action”" },
    { id: "claude", name: "Claude API", layer: "AI", type: "external",
      description: "The external AI model the Risk Summarizer calls to actually turn raw signals into that plain-language summary.",
      why: "Implementation of “an AI layer… writes a one-paragraph risk summary” — the layer needs a model behind it" },
    { id: "db", name: "Client Health Database", layer: "Data & Sources", type: "data",
      description: "The filing cabinet that remembers every client's engagement history and latest risk summary between visits, so the picture doesn't reset each login.",
      why: "“every night it pulls… into one place” and “ranked by urgency” — the ranking has to still be there next morning" },
    { id: "basecamp", name: "Basecamp API", layer: "Data & Sources", type: "external",
      description: "Reports how active a client's team has been on their shared task list.",
      why: "“Basecamp API (task activity)”" },
    { id: "lms", name: "Learning Platform Export", layer: "Data & Sources", type: "external",
      description: "Reports how much of the accelerator coursework a client has actually completed.",
      why: "“the learning platform's completion export (course progress)”" },
    { id: "survey", name: "Survey Tool", layer: "Data & Sources", type: "external",
      description: "Reports how satisfied a client says they are, from post-session surveys.",
      why: "“the survey tool (satisfaction scores)”" }
  ],

  layerOrder: ["Frontend", "Backend", "AI", "Data & Sources"],

  edges: [
    ["basecamp", "job"], ["lms", "job"], ["survey", "job"], ["job", "db"],
    ["api", "db"], ["api", "agent"], ["agent", "claude"], ["claude", "agent"],
    ["agent", "db"], ["db", "api"], ["api", "ui"], ["ui", "csm"], ["csm", "ui"]
  ],

  diagrams: {
    flowchart: "flowchart TD\n" +
      "    csm([\"Customer Success Manager\"])\n" +
      "    ui[\"Health Dashboard UI\"]\n" +
      "    api[\"Dashboard API\"]\n" +
      "    db[(\"Client Health Database\")]\n" +
      "    job[\"Nightly Ingestion Job\"]\n" +
      "    basecamp{{\"Basecamp API\"}}\n" +
      "    lms{{\"Learning Platform Completion Export\"}}\n" +
      "    survey{{\"Survey Tool\"}}\n" +
      "    agent[\"Risk Summarizer (AI layer)\"]\n" +
      "    claude{{\"Claude API\"}}\n" +
      "\n" +
      "    basecamp -- \"task activity\" --> job\n" +
      "    lms -- \"course completion records\" --> job\n" +
      "    survey -- \"satisfaction scores\" --> job\n" +
      "    job -- \"normalized engagement record per client\" --> db\n" +
      "    api -- \"reads client & engagement rows\" --> db\n" +
      "    api -- \"per-client signal bundle\" --> agent\n" +
      "    agent -- \"signals for one client\" --> claude\n" +
      "    claude -- \"risk summary + recommended action\" --> agent\n" +
      "    agent -- \"risk score, summary, action\" --> db\n" +
      "    db -- \"ranked client list + summaries\" --> api\n" +
      "    api -- \"JSON response\" --> ui\n" +
      "    ui -- \"renders ranked, explained list\" --> csm\n" +
      "    csm -- \"opens dashboard each morning\" --> ui\n",

    sequence: "sequenceDiagram\n" +
      "    participant Job as Nightly Ingestion Job\n" +
      "    participant Basecamp as Basecamp API\n" +
      "    participant LMS as Learning Platform\n" +
      "    participant Survey as Survey Tool\n" +
      "    participant DB as Client Health Database\n" +
      "    participant API as Dashboard API\n" +
      "    participant Agent as Risk Summarizer\n" +
      "    participant Claude as Claude API\n" +
      "    participant CSM as Customer Success Manager\n" +
      "    participant UI as Health Dashboard UI\n" +
      "\n" +
      "    Job->>Basecamp: request task activity (last 24h)\n" +
      "    Basecamp-->>Job: task activity per client\n" +
      "    Job->>LMS: request course completion export\n" +
      "    LMS-->>Job: completion records\n" +
      "    Job->>Survey: request new satisfaction scores\n" +
      "    Survey-->>Job: survey responses\n" +
      "    Job->>DB: write normalized engagement records\n" +
      "    API->>DB: read latest engagement bundle per client\n" +
      "    API->>Agent: send signal bundle for client\n" +
      "    Agent->>Claude: prompt with client signals\n" +
      "    Claude-->>Agent: risk summary + recommended action\n" +
      "    Agent->>DB: write risk score, summary, action\n" +
      "    CSM->>UI: open dashboard\n" +
      "    UI->>API: request ranked client list\n" +
      "    API-->>UI: ranked clients + summaries\n" +
      "    UI-->>CSM: render ranked, explained list\n",

    gantt: "gantt\n" +
      "    dateFormat  YYYY-MM-DD\n" +
      "    title Build Order\n" +
      "    section Phase 1 - Data Foundation\n" +
      "    Ingestion job + normalized schema      :p1, 2026-08-10, 10d\n" +
      "    section Phase 2 - Manual Dashboard\n" +
      "    Ranked list with rule-based scoring    :p2, after p1, 5d\n" +
      "    section Phase 3 - AI Risk Layer\n" +
      "    Claude-generated summaries + actions   :p3, after p2, 5d\n" +
      "    section Phase 4 - Polish & Access\n" +
      "    Auth reuse and daily-use hardening     :p4, after p3, 5d\n"
  },

  dataFlowSteps: [
    { n: 1, text: "At 2:00am, the Nightly Ingestion Job wakes up and calls the Basecamp API for each active client's project, pulling task activity from the last 24 hours.", aiTouch: false },
    { n: 2, text: "It also pulls the latest course-completion export from the Learning Platform and any new satisfaction scores from the Survey Tool.", aiTouch: false },
    { n: 3, text: "The job normalizes all three sources into one engagement record per client and writes them to the Client Health Database.", aiTouch: false },
    { n: 4, text: "Once ingestion finishes, the Dashboard API reads each client's latest engagement bundle from the database.", aiTouch: false },
    { n: 5, text: "For each client, the Dashboard API sends that signal bundle to the Risk Summarizer, which calls the Claude API with the client's data in the prompt.", aiTouch: true },
    { n: 6, text: "Claude returns a one-paragraph risk summary and a recommended next action, which the Risk Summarizer writes back to the database against that client.", aiTouch: true },
    { n: 7, text: "When a Customer Success Manager logs into the Health Dashboard UI in the morning, the frontend calls the Dashboard API.", aiTouch: false },
    { n: 8, text: "The Dashboard API returns every active client, ranked by risk, along with its summary and recommended action, and the manager can drill into any client to see the raw signals behind the score.", aiTouch: false }
  ],

  phases: [
    { id: "p1", name: "Data Foundation", weeks: 2, startWeek: 0,
      proves: "The three outside systems can actually be pulled from and normalized into one schema — proves the hardest unknown (integration access) before anything user-facing exists.",
      introduces: ["job", "basecamp", "lms", "survey", "db"] },
    { id: "p2", name: "Manual Dashboard", weeks: 1, startWeek: 2, makeOrBreak: true,
      proves: "A ranked list is useful even with a simple rule-based score (e.g., days since last activity) instead of AI — proves the day-one requirement works before adding AI complexity.",
      introduces: ["api", "ui"] },
    { id: "p3", name: "AI Risk Layer", weeks: 1, startWeek: 3,
      proves: "Claude-generated summaries and recommended actions are more useful than the rule-based score alone — proves the AI layer earns its place.",
      introduces: ["agent", "claude"] },
    { id: "p4", name: "Polish & Access", weeks: 1, startWeek: 4,
      proves: "The tool is safe and pleasant enough for the whole customer success team to rely on daily (login reuse, error states, refresh visibility).",
      introduces: [] }
  ],

  assumptions: [
    { text: "Basecamp, the learning platform, and the survey tool all expose a queryable API or a reliable export/feed.",
      impact: "If any one is manual/CSV-only, Phase 1 shrinks to a manual-upload step for that source instead of live ingestion." },
    { text: "Each enterprise client maps 1:1 to one Basecamp project and one cohort in the learning platform.",
      impact: "If a client spans multiple projects or cohorts, the ingestion job needs a client-mapping table, adding a design layer before Phase 1 can close." },
    { text: "Roughly 30 active clients is the near-term ceiling.",
      impact: "At that volume, one Claude call per client per night is cheap and fast enough to run serially; at 10x the volume, the Risk Summarizer would need batching or parallel calls." },
    { text: "Customer success managers are the only users on day one — no client-facing login.",
      impact: "Keeps access control simple (reuse existing internal login); if clients ever get their own view, access control becomes a much bigger design piece with per-tenant isolation." }
  ],

  notCovered: [
    "Authentication/authorization detail — assumes an existing Colaberry internal login is reused; does not design a new auth system.",
    "Human review of the AI summary — no designed step for a manager to flag or correct a wrong risk summary before it's shown.",
    "Historical trending — shows a client's risk as of last night's run only; does not track or chart how risk has changed over time.",
    "Notifications or alerting — a manager only sees risk changes by opening the dashboard; no Slack/email ping on threshold crossing."
  ],

  openQuestion: {
    text: "Should the AI's risk summary be shown as a recommendation to double-check, or trusted directly as the ranking itself?",
    branchA: {
      label: "Treated as a recommendation to double-check",
      detail: "Phase 2's rule-based score stays on permanently as a visible, independent sanity check next to the AI's — the manager sees both and can spot when they disagree."
    },
    branchB: {
      label: "Trusted directly as the ranking",
      detail: "Phase 2's rule-based score is retired once Phase 3 ships — simpler UI, but a wrong or misleading AI summary has nothing next to it to catch the disagreement."
    }
  }
};
