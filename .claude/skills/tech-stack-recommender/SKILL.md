---
name: tech-stack-recommender
description: Use when the user has a system architecture and wants a recommended tech stack, explained simply.
---

# Tech Stack Recommender

## When to use this skill
Trigger when the user already has a system architecture and asks what technology to actually build it with — e.g. "what tech stack should I use," "recommend the stack for this," "what should each piece be built with."

## Required inputs
- **`project-blueprint/architecture.md`** — required. If it doesn't exist, stop and tell the user to run `/system-architect` first rather than inventing components from scratch.

## Procedure
1. Read `project-blueprint/architecture.md` in full. Pull out the component list AND the idea's real scale signals — user counts, frequency (nightly? real-time?), data volume, team size, budget hints, anything in the Assumptions or Build Order sections that implies how big or small this actually is. These numbers are what fit ratings must be judged against, not general best practice.
2. For each component in the architecture's component list, recommend exactly **one** real, currently-maintained technology — a specific named product, library, or service (e.g. "PostgreSQL," "Vercel," "Anthropic Messages API"), never a category ("a relational database") and never a menu of options.
3. Assign a fit rating to every recommendation, judged against THIS idea's actual scale and needs from step 1 — never a generic default rating:
   - 🟢 **great fit** — matches this idea's real scale and needs with no meaningful downside
   - 🟡 **good fit** — works, but carries a tradeoff worth knowing (overkill for the scale, a gap it'll hit later, added ops burden)
   - 🔴 **consider carefully** — a real mismatch or risk for this specific idea (wrong tool for the scale, lock-in, cost risk, a limitation that lands squarely on something the idea depends on)
   A row is not done until the rating is justified by a specific number or fact from `architecture.md`, not a vibe.
4. Write the "why" as one plain-English sentence with no unexplained jargon. If a technical term is needed, define it inline in parentheses the first time it appears in the document (e.g., "ORM (lets code talk to the database without writing raw SQL)") — don't redefine it on every row.
5. Give each row a short category icon matching the component type (e.g. 🖥️ frontend, ⚙️ backend/API, 🗄️ database, ⏰ background job, 🔌 external service, 🤖 AI/LLM layer) plus the fit-rating icon. Keep every cell short — this is a scan, not an essay. No paragraphs.
6. End every row with a copy-ready prompt the user could paste into a new conversation to learn more about that specific technology, personalized with their project name/idea (e.g., "Explain PostgreSQL to me like I'm new to databases, using my Client Health Signal Dashboard project as the example.").
7. Assemble one document: the project name restated in a line, then a table with columns `Component | Technology | Fit | Why | Learn More Prompt`, one row per component from the architecture.
8. Save the result to `project-blueprint/tech-stack.md`.
9. Report back: the exact file path, and the fit-rating breakdown (count of 🟢 / 🟡 / 🔴).

## Rules
- Never default to a generic "popular stack" — every technology choice and every fit rating must trace back to something specific in `architecture.md` (the scale, the frequency, the team, the constraints), not what's trendy or what's always recommended.
- Fit ratings must not cluster at 🟢 by default — if nothing in the architecture creates real risk or tradeoff anywhere, that itself is worth double-checking before finalizing.
- One technology per component — no "or" lists, no hedged multi-option rows.
- Every recommended technology must be real and currently maintained — no deprecated, EOL, or fabricated tools.
- No jargon without an inline one-line definition on first use.
- No walls of text — table rows only, short cells, icons doing the scanning work.
- Every row ends with a personalized, copy-ready "learn more" prompt — never a generic one that could apply to any project.
- If `project-blueprint/architecture.md` is missing, stop and ask the user to generate it first instead of guessing at components.
