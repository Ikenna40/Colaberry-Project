---
name: data-quality-gate
description: Use when the user asks to validate a dataset, CSV, or ETL output against a quality contract, or asks whether data is ready to publish or trust downstream (e.g. "validate this before it feeds the dashboard," "check this ETL output for issues," "is this dataset ready to publish," "PASS or FAIL this data"). Returns PASS/WARN/FAIL with evidence and a PUBLISH/BLOCK recommendation. Do NOT use for writing or debugging SQL, calculating or defining a metric, or designing/building a dashboard — those are separate tasks even when they reference a query, a dataset, or a dashboard.
---

# Data Quality Gate

## When to use this skill

**Trigger** — dataset/CSV/ETL-output validation, data-quality checks, or dashboard/report publish-readiness questions: "validate this data," "check this ETL output for issues," "is this ready to publish," "run the quality gate on this."

**Do not trigger** — an ordinary request to write or debug SQL, calculate or define a metric, or design/build a dashboard is not sufficient on its own, even if it mentions a query, a dataset, or a dashboard by name. Only invoke when the user is explicitly asking to validate, check, or gate data, or asking a publish-readiness question — not when they're asking you to build or compute something.

## Required inputs
- **Dataset path** — required. If not supplied, stop and ask. Do not guess or fabricate a dataset or its contents.
- **Quality contract** — optional but preferred. If supplied, its rules are the source of truth. If none is supplied, fall back to default checks and state clearly which thresholds are assumed rather than contract-specified.

## Procedure
1. Read the dataset at the supplied path. Never modify it — this skill is read-only with respect to source data.
2. If a quality contract is supplied, read it and extract its rules.
3. Run the standard checks (schema, freshness, expected volume, key uniqueness, duplicates, required fields, nulls, numeric rules), using contract thresholds where available. **Read `references/quality-checks.md` first** if this is the first run this session, or whenever a check's exact definition, scoring rule, or default threshold isn't already clear — it holds the full definition, rationale, and PASS/WARN/FAIL scoring logic for each check.
4. For every check, record what was checked, the evidence (specific counts/rows/values — not a general impression), the status, and the recommended action if it failed.
5. Present results as a table: **Check | Evidence | Status | Recommended Action**.
6. Conclude with exactly one overall result: **PASS**, **WARN**, or **FAIL**.
7. Conclude with exactly one recommendation: **PUBLISH** or **BLOCK**.

## Rules
- Never modify, reformat, or "clean" the source dataset. This skill validates; it does not fix.
- If the dataset path is missing, stop and ask — never fabricate data or results.
- Every status must cite the specific evidence that produced it.
- If a request is really about writing SQL, computing a metric, or designing a dashboard, do that task directly — do not route it through this skill.
