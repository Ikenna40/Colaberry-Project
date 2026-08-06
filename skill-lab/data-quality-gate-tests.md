# Data Quality Gate — Trigger Tests

Manual test prompts for verifying the `data-quality-gate` skill fires on genuine validation/publish-readiness requests, and stays silent on SQL-writing, metric-calculation, and dashboard-design requests that merely mention data.

## Should trigger

1. "Before this feeds the executive revenue dashboard, validate skill-lab/orders.csv against skill-lab/quality-contract.md and tell me PUBLISH or BLOCK."
2. "Check this ETL output for data quality issues before we trust it downstream: data/etl_run_20260803.csv."
3. "Is this dataset ready to publish? Run it against our quality rules and give me a PASS or FAIL."

## Should NOT trigger

1. "Write a SQL query to calculate total revenue by region from the orders table."
2. "Help me design a dashboard layout for showing weekly sales trends."
3. "How do I calculate month-over-month growth rate for this metric?"

## Expected output requirements

**When triggered**, the response must include:
- A dataset path identified (or explicitly requested if missing) — never fabricated
- A quality contract used if supplied, or default thresholds stated explicitly if not
- A results table with exactly these columns: Check, Evidence, Status, Recommended Action
- Evidence that cites specific values, counts, or row identifiers — not general impressions
- Exactly one final result: PASS, WARN, or FAIL
- Exactly one final recommendation: PUBLISH or BLOCK
- Confirmation that the source dataset was not modified

**When NOT triggered**, the response must:
- Handle the SQL / metric / dashboard-design request directly and normally
- Not produce a Check/Evidence/Status/Recommended Action table
- Not produce a PASS/WARN/FAIL or PUBLISH/BLOCK verdict
- Not read or reference a quality contract file unless the user's request independently asked for one
