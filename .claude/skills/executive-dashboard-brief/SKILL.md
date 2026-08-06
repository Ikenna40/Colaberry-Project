---
name: executive-dashboard-brief
description: Use when the user asks to turn a data-quality result, failed refresh, pipeline incident, KPI variance, or technical investigation into an executive dashboard update. Produces a concise leadership brief containing status, business impact, verified evidence, decision needed, owner, and next update time.
---

# Executive Dashboard Brief

## When to use this skill
Trigger when the user asks to convert a technical result — a data-quality report, a failed refresh, a pipeline incident, a KPI variance, or any technical investigation — into an update suitable for leadership/executive consumption.

## Required inputs
- **The underlying report(s)** — required. Use supplied quality and/or triage reports (e.g., a `data-quality-gate` or `etl-failure-triage` output) as the source of truth. Do not proceed from a bare verbal description if a written report exists — read it first.

## Procedure
1. Read every supplied report in full before drafting anything.
2. Separate **verified facts** (stated directly in the source report(s), with evidence) from **unresolved questions** (things the source reports don't answer). Both get a place in the brief — verified facts under "What We Know," unresolved items under "What We Do Not Know" — never blend the two.
3. Never invent financial impact, cause, owner, or timing that isn't in the source material. If a source report doesn't state a dollar impact, a confirmed root cause, an assigned owner, or a next-update time, say so explicitly ("Not yet quantified," "Owner not yet assigned," "Not yet scheduled") — do not estimate, guess, or default to a plausible-sounding value.
4. Strip raw logs, stack traces, table dumps, and other technical detail a leadership audience doesn't need to act on. Translate technical findings into their business consequence instead (e.g., not "KeyError in region_code_mapper" but "the pipeline feeding regional revenue figures did not complete").
5. State explicitly whether the dashboard (or affected artifact) should remain blocked, based on the source report's own PASS/WARN/FAIL or PUBLISH/BLOCK conclusion. If the source recommends BLOCK, reports a FAIL, or documents an unresolved incident, the brief must say the dashboard remains blocked — do not soften or reverse that recommendation.
6. Populate `template.md`'s structure exactly — do not add sections, remove sections, or reorder them.
7. Return the completed brief using the seven sections defined in `template.md`, in order: **Status, Business Impact, What We Know, What We Do Not Know, Decision or Action Needed, Owner, Next Update.**

## Rules
- Source of truth is the supplied report(s) — not raw logs, not assumptions, not general knowledge about how such incidents "usually" resolve.
- If a required field (owner, next update time, financial impact, confirmed cause) has no source, write it as unknown/not yet determined — never fabricate a placeholder that reads as fact.
- No raw logs, stack traces, or line-level technical detail in the output.
- The blocked/unblocked status must match what the source report(s) actually concluded — this skill translates, it does not re-decide.
