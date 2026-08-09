---
name: mvp-scoper
description: Use when the user wants to know what to build first, see what their idea could look like, and get a short pitch for it.
allowed-tools: Read, Write, Bash
---

# MVP Scoper

## When to use this skill
Trigger when the user has an architected idea and wants to know what to build first, wants to see what it could look like, or wants a short pitch for it — e.g. "what should I build in week one," "show me what this would look like," "give me a one-pager for this," "what's the MVP here."

## Required inputs
- **`project-blueprint/architecture.md`** — required. If it doesn't exist, stop and tell the user to run `/system-architect` first rather than inventing components from scratch.
- **`project-blueprint/tech-stack.md`** — required. If it doesn't exist, stop and tell the user to run `/tech-stack-recommender` first rather than guessing technologies.

## Procedure

1. Read `project-blueprint/architecture.md` and `project-blueprint/tech-stack.md` in full before writing anything.

### 1. `project-blueprint/mvp-plan.md`
2. Identify the smallest real vertical slice that proves the idea's core value end-to-end — the one flow that touches only the components truly necessary to prove it works, not a slice that ignores what the idea actually needs. If `architecture.md` has a Build Order table, Week 1 must be a tighter cut of its first phase, never a different or unrelated plan.
3. Fill in `template.md`'s structure exactly — do not add, remove, or reorder its sections. Every checklist item must name the actual technology from `tech-stack.md` doing the work (e.g. "create `clients` table in PostgreSQL," not "set up a database"), and must be realistically buildable inside one week.
4. Save the result to `project-blueprint/mvp-plan.md`.

### 2. `project-blueprint/mockup.html`
5. Identify the idea's one main screen — the landing page or the core app view a user would actually see first. Build a real, self-contained, visually appealing static HTML+CSS mockup of it:
   - Real, idea-specific sample content (actual names, numbers, dates, copy in this idea's voice) — never lorem ipsum, never generic "Item 1 / Item 2" placeholders.
   - Actual visual design: a real color palette, spacing, typography, and icons (inline SVG or Unicode/emoji) — not a wireframe of gray boxes.
   - All CSS inline in a `<style>` tag, no external stylesheets, fonts, scripts, or images. It must open correctly by double-clicking the file — no build step, no server.
6. Save the result to `project-blueprint/mockup.html`.

### 3. `project-blueprint/one-pager.pdf`
7. Write short marketing copy for the idea: what it does (1-2 lines, plain language), who needs it (a specific role, not "businesses"), one sentence on why it matters, and 3-5 punchy benefit lines with icons. This is marketing language aimed at a reader deciding whether to care, not a technical description — no component names, no tech stack, no architecture jargon.
8. Lay that copy out as a single print-ready HTML page (`@page` size and margins, one-page-worth of content, real visual styling) and write it to a **temporary** location outside `project-blueprint/` (the session's scratch/temp directory) — it is an intermediate artifact, not one of the three deliverables.
9. Convert that HTML to a real PDF with exactly **one** Bash command, choosing the first option that's actually available on the machine:
   - **Preferred — headless Chrome or Edge print-to-PDF** (no new dependency to install): locate an existing browser binary and run
     ```
     "<chrome-or-edge-path>" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="<absolute-path>/project-blueprint/one-pager.pdf" "file:///<absolute-path-to-temp-html>"
     ```
     Common Windows paths to check: `C:\Program Files\Google\Chrome\Application\chrome.exe`, `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.
   - **Fallback — an already-installed** Python PDF library (e.g. `reportlab`, `weasyprint`) or Node library (e.g. `puppeteer`): use it only if it is already present in the environment.
   - If neither a browser binary nor an already-installed library is found, stop and tell the user what's missing. Installing a new dependency to unblock this is a deliberate-add decision per this repo's dependency policy — not something to do silently inside a skill run.
10. Confirm `project-blueprint/one-pager.pdf` was written and is a real PDF (non-trivial file size). Never save the one-pager as a renamed `.md` or `.html` file.

11. Report back: the exact path of all three files, one line on what each contains, and which tool/command actually generated the PDF.

## Rules
- `architecture.md` and `tech-stack.md` are the source of truth for every checklist item, screen, and technology mentioned — never invent a component or technology they don't already establish.
- If either required input is missing, stop and name the skill to run first instead of guessing at an architecture.
- `mvp-plan.md` must follow `template.md` exactly, and its checklist must be a real Week 1, not a generic scaffold — mark anything deferred as explicitly out of scope rather than letting the list quietly grow.
- `mockup.html` must be fully self-contained (inline CSS, no external requests) and must use real, idea-specific content — no lorem ipsum, no placeholder boxes.
- `one-pager.pdf` must be produced by an actual PDF-generating tool or command — never a `.md`/`.html` file renamed with a `.pdf` extension.
- Bash is used for exactly one purpose in this skill: running the single command that converts the one-pager HTML into a real PDF. Do not use it to install packages, explore the filesystem, or run anything else.
- The one-pager's language is marketing language — benefits and audience, not architecture or implementation detail.
