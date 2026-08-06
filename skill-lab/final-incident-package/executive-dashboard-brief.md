# Executive Dashboard Brief — Orders Revenue Dashboard

## Status
Blocked

## Business Impact
The executive orders/revenue dashboard scheduled to publish today did not receive a data refresh. The source dataset failed data-quality validation, and the pipeline that loads it (`orders_ingest_daily`) failed on its initial run and all 3 automatic retries, with 0 of 12 extracted rows reaching the `orders_fact` table. Publishing now would mean the dashboard shows stale or incomplete figures rather than a validated refresh. Not yet quantified — no dollar or revenue impact figure is stated in the source reports.

## What We Know
- Data-quality validation of the orders dataset returned **FAIL**, citing 4 hard-rule violations: a record roughly 3 days old (exceeding the 24-hour freshness limit), a duplicate order ID, a missing required region value on one order, and a negative revenue value on one order.
- The data-quality check's recommendation is **BLOCK** — the dataset should not be published to the executive revenue dashboard as-is.
- Separately, the `orders_ingest_daily` pipeline run failed on its initial attempt and all 3 automatic retries, each time at the same record and with an identical error.
- 0 of 12 extracted rows were loaded; the load step was never reached in any attempt.
- The pipeline failure's most probable cause is a mapping-table gap: the region-mapping step has no entry for a blank/missing region value, and that same blank region value was independently flagged by the data-quality check — two separate checks converging on the same underlying data gap.
- The failure is consistent and repeatable, not a one-off glitch — all 4 attempts (1 initial + 3 retries) failed identically, so retrying again without a fix is not expected to succeed.
- An alert was already sent to the data engineering on-call channel (severity HIGH) at the time of the pipeline failure.

## What We Do Not Know
- Whether other non-standard region-name values would cause additional pipeline failures once the missing-value issue is resolved — not yet tested, since the pipeline never processed past the first failing record.
- Whether allowing the region mismatch to pass validation as a warning (rather than blocking it earlier) was an intentional design choice or a gap — not yet reviewed.
- Financial or business impact of the delayed dashboard refresh — not yet quantified.
- Full confirmation of the mapping-table root cause pending direct inspection of the mapping table's contents — the evidence strongly supports it, but it has not yet been independently verified against the table itself.

## Decision or Action Needed
Leadership sign-off to keep the orders revenue dashboard **blocked from publishing** until: (1) the data-quality violations are resolved at the source and the dataset re-validated, and (2) the pipeline's mapping-table gap is fixed and a subsequent pipeline run completes successfully. No publish exception should be granted on the current data.

## Owner
Not yet assigned.

## Next Update
Not yet scheduled.
