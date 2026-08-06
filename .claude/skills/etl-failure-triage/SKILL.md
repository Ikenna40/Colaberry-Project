---
name: etl-failure-triage
description: Use when the user asks why an ETL or ELT pipeline, scheduled load, SQL job, data refresh, or ingestion process failed or produced suspicious output. Reviews logs and run metadata, ranks likely causes, cites evidence, and recommends the next safe diagnostic steps.
---

# ETL Failure Triage

## When to use this skill
Trigger whenever a user asks why a pipeline, scheduled load, SQL job, data refresh, or ingestion process failed, errored, or produced suspicious/unexpected output, and wants help diagnosing it.

## Required inputs
- **A log, run output, or failure description** — required. If none is supplied, stop and ask for one. Do not invent a failure or its cause.
- **Run metadata** — read it when supplied (run ID, timing, row counts, source/target, retry history, etc.); it's often what turns a hypothesis into an evidenced cause.

## Procedure
1. Read the supplied log/output and run metadata in full before forming any conclusion.
2. Separate **facts** (what the log/metadata actually states) from **hypotheses** (what might explain those facts) — never blend the two without labeling which is which.
3. For every likely cause, cite the specific evidence (log line, timestamp, row count, error message) that supports it. A cause with no cited evidence does not belong in Ranked Causes — note it as an open question instead.
4. Rank the likely causes most-to-least probable, based on how directly the evidence points to each.
5. For each ranked cause, give the next safe diagnostic step — something that gathers more evidence, not something that changes state.
6. See `references/common-failures.md` for symptom-to-cause patterns covering common ETL/ELT failure modes (schema mismatches, mapping/conversion failures, retry loops, connectivity, volume anomalies, etc.) — read it before ranking causes if the failure signature isn't already a clear match to something already diagnosed.
7. Return exactly these sections, in order: **Incident Summary**, **Evidence**, **Ranked Causes**, **Next Tests**, **Escalation Recommendation**.

## Rules
- Do not change pipeline code.
- Do not rerun jobs.
- Do not claim a root cause without evidence — a ranked cause without a citation is not allowed.
- Diagnosis only. Fixing, rerunning, and code changes are separate work, explicitly out of scope for this skill.
