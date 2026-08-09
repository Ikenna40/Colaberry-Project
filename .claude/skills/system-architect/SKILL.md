---
name: system-architect
description: Use when the user has a project idea and wants a system architecture, a technical design, or a diagram of how it would work.
---

# System Architect

## When to use this skill
Trigger when the user describes a project idea and asks for a system architecture, a technical design, or a diagram of how it would work — e.g. "design the architecture for this idea," "what would the system/tech stack look like," "draw a diagram of how this would work."

## Required inputs
- **A project idea** — required, at least one paragraph describing what it does and who it's for. If the user gives only a name or a single vague sentence with no real detail, stop and ask a clarifying question before designing — never invent functionality the idea didn't describe.

## Procedure
1. Read the project idea in full. Identify what it actually does: who uses it, what data it handles, what actions it performs, and whether it involves real-time interaction, scheduled/background processing, external integrations, or AI/agent behavior.
2. From that reading, identify only the components this specific idea needs. Never default to a generic template (frontend + backend + database) unless the idea genuinely only needs those. Consider each of the following and include it only if the idea actually warrants it:
   - Frontend / client (web, mobile, CLI, etc.)
   - Backend / API layer
   - Database(s) — and what kind (relational, document, vector, cache) if the idea implies one
   - External services / third-party APIs (payments, auth, maps, email, etc.)
   - An AI/agent layer (LLM calls, agents, retrieval, embeddings) — only if the idea actually involves AI behavior
   - Background jobs / queues / schedulers — only if the idea implies asynchronous or recurring work
3. For each identified component, write one plain-English sentence explaining what it does and why this idea needs it — written so a non-technical person could follow it, no unexplained jargon.
4. Produce a genuine Mermaid flowchart (a ```mermaid flowchart``` block) specific to this idea's components and connections — never a stock/placeholder diagram. Show the real data flow direction between components (e.g., user → frontend → API → database, or API → external service → API → database), and label edges with what actually flows across them (e.g., "search query," "order confirmation") wherever that clarifies the flow.
5. Assemble one document containing: the project idea restated in a line, the component list with its plain-English explanations, and the Mermaid diagram.
6. Save the result to `project-blueprint/architecture.md`, creating the `project-blueprint/` directory if it doesn't already exist.
7. Report back: the exact file path, the final description used, and the list of components identified.

## Rules
- Never reuse a generic architecture template that ignores what the specific idea described — every listed component must trace back to something the idea actually implies.
- Never fabricate integrations, data stores, or an AI layer the idea didn't call for.
- The Mermaid diagram must be genuine and specific to this idea, not a placeholder shape.
- Plain-English explanations must be understandable without technical background.
- If the idea is too vague to identify real components, stop and ask for more detail rather than guessing.
