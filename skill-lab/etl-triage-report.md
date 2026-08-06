# ETL Failure Triage Report — orders_ingest_daily

**Investigated using**: `skill-lab/orders-pipeline-failure.log`, `skill-lab/pipeline-run-metadata.md`
**Run**: run-20260803-0300 (initial attempt + 3 retries, all FAILED)
**Method**: Manual execution of the `etl-failure-triage` procedure (`.claude/skills/etl-failure-triage/SKILL.md`). The skill was **not** available for automatic invocation this session — created after the session started; a direct invocation attempt returned `Unknown skill: etl-failure-triage`. Restarting Claude Code is required for it to auto-trigger going forward.
**Constraints honored**: no pipeline code changed, no job rerun, no root cause claimed without cited evidence.

## Incident Summary
`orders_ingest_daily` failed at the `transform.region_code_mapper` step on its initial run and all 3 automatic retries, always at the same row (`order_id=ORD-1005`, `row_index=5`), always with an identical error. 12 rows were extracted on every attempt; 0 rows ever reached the load step, and 0 rows were loaded to `orders_fact`. An alert was already dispatched to `#data-eng-oncall` (severity HIGH) at run end.

## Evidence
- `schema_validate` logged 2 warnings, 0 errors, and proceeded: a null `region` at `order_id=ORD-1005`, and raw `region` values (`West`, `East`, `South`, `North`) outside the canonical `REGION_CODE` enum (log lines 5–6).
- `transform.region_code_mapper` threw `KeyError: region value '' (empty/null) not found in region_lookup table. Failed at order_id=ORD-1005, row_index=5` — identically on the initial attempt and all 3 retries (log lines 9, 18, 24, 30).
- Every attempt processed exactly 4/12 rows before aborting (run metadata attempt-history table) — consistent, not degrading or improving across retries.
- Run metadata states directly: the `region_lookup` mapping table "has no entry for null/empty region values and no configured default fallback."
- `skill-lab/data-quality-report.md`, produced independently by the `data-quality-gate` skill from a data-quality check (not a pipeline run), had already flagged the same `ORD-1005` row for a blank `region` — two unrelated checks converging on the same fact.
- Retry scope is a full pipeline restart from `extract` (run metadata), which is why `extract`/`schema_validate` repeat identically each attempt rather than resuming from the failed step.

## Ranked Causes

1. **(Highest confidence) Missing `region_lookup` entry for null/empty region — deterministic mapping failure.** Directly evidenced by the identical `KeyError` across all 4 attempts and the run metadata's explicit statement that no null/default entry exists in `region_lookup`, corroborated independently by the data-quality report.
2. **(Contributing factor) Schema validation logged the mismatch as a warning and let it proceed rather than blocking it.** Evidenced by the `schema_validate` WARN-not-ERROR outcome in log lines 5–7, which is why the bad row reached the mapper instead of being rejected earlier with a clearer message.
3. **(Hypothesis — not confirmed) Non-canonical region strings (`West`/`East`/`South`/`North`) may also fail to map once the null-row blocker is cleared.** `schema_validate` flags them as outside the canonical enum, but the mapper never processed past `row_index=5` in any attempt, so no log evidence confirms or refutes this. Listed as an open question, not a ranked cause with confirmed evidence.
4. **(Ruled out) Transient or infrastructure failure.** All 4 attempts show byte-identical error, row, and step, with no connectivity/timeout/credential errors anywhere in the log — the signature of a deterministic data problem, not a transient one.

## Next Tests (diagnostic only — no code changes, no reruns)
1. Inspect the `region_lookup` table's actual contents to confirm it has no key, and no default/fallback branch, for null or empty-string region values.
2. Review `schema_validate`'s configuration to determine whether treating this enum/null mismatch as WARN rather than ERROR is intentional or an oversight.
3. In a non-production context, check `region_lookup`'s full key list against `West`/`East`/`South`/`North` to determine whether those values would map successfully or fail next — without touching the live pipeline or rerunning this job.

## Escalation Recommendation
Escalate to the team owning `region_lookup` / `region_code_mapper`: this is a data/config gap that further retries cannot resolve. Recommend adding explicit null-handling (a default value, or reject-and-quarantine the offending row) instead of hard-failing the entire batch on one bad row. This report supports the escalation already triggered in the log (`#data-eng-oncall`, severity HIGH) rather than raising a new one.
