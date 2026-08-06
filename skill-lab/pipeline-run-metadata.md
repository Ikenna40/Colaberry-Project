# Pipeline Run Metadata — orders_ingest_daily

**Run ID**: run-20260803-0300
**Pipeline**: orders_ingest_daily
**Source**: `skill-lab/orders.csv`
**Target**: `orders_fact` (staging: `orders_staging`)
**Scheduled start**: 2026-08-03 03:10:00 UTC
**Actual start**: 2026-08-03 03:10:02 UTC
**Final status**: FAILED
**Final end time**: 2026-08-03 03:13:38 UTC
**Total duration**: ~3m 36s, including 3 retry attempts

## Attempt history

| Attempt | Start | Outcome | Failing step | Rows processed before failure |
|---|---|---|---|---|
| 1 (initial) | 03:10:02 | FAILED | `transform.region_code_mapper` | 4 / 12 |
| 2 (retry 1/3) | 03:10:34 | FAILED | `transform.region_code_mapper` | 4 / 12 |
| 3 (retry 2/3) | 03:11:35 | FAILED | `transform.region_code_mapper` | 4 / 12 |
| 4 (retry 3/3) | 03:13:36 | FAILED | `transform.region_code_mapper` | 4 / 12 |

## Row counts

- Extracted: 12
- Passed schema validation (with warnings): 12
- Successfully transformed: 0
- Loaded to `orders_fact`: 0

## Known upstream context

- `skill-lab/orders.csv` contains one row (`order_id=ORD-1005`) with a blank `region` value — independently flagged by the `data-quality-gate` skill's validation report (`skill-lab/data-quality-report.md`) as a required-field violation.
- The `region_lookup` mapping table used by `transform.region_code_mapper` has no entry for null/empty region values and no configured default fallback.

## Retry policy

- max_attempts: 3
- backoff: fixed 30s (attempt 1), increasing thereafter (60s, 120s observed)
- Retry scope: full pipeline restart from `extract`, not a step-level resume

## On-call

- Alert dispatched to `#data-eng-oncall`, severity HIGH, at 2026-08-03 03:13:38 UTC.
