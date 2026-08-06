# Data Quality Gate — Check Reference

Full definition, rationale, and scoring rule for each check the `data-quality-gate` skill runs. Read this before executing checks whenever a definition, default threshold, or scoring rule isn't already clear from the `SKILL.md` summary.

## Schema
**What it checks**: every column the quality contract (or the check itself) requires is present, with a plausible type (e.g., a "revenue" column actually holds numbers, not text).
**Why it matters**: every later check assumes its columns exist. A silently-renamed or missing column doesn't fail loudly — it just makes later checks meaningless or makes the pipeline silently skip data.
**Scoring**: FAIL if any contract-required column is missing or wrong-typed. PASS otherwise. Hard rule — never downgrade to WARN.

## Freshness
**What it checks**: the load/timestamp field(s) are within the contract's allowed age (default: 24 hours if unspecified).
**Why it matters**: stale rows blended into an otherwise-current dataset are invisible downstream — a report has no way to show "this number is 3 days old" unless it's flagged at validation time.
**Scoring**: FAIL if any row (or the dataset's most recent load overall, if the contract defines freshness dataset-wide rather than per-row) exceeds the threshold. Downgrade to WARN only if the contract explicitly marks freshness as advisory. Default assumption for anything feeding a report or dashboard: freshness is a hard rule.

## Expected volume
**What it checks**: row count meets the contract's stated minimum (or a reasonable stated default if unspecified).
**Why it matters**: a row count far below expectation is the most common signal of a broken or partial extract — every individual row present might look valid, so this is often the only signal that catches it.
**Scoring**: FAIL if row count is below the contract minimum. If the contract gives a range or expected count rather than a floor, treat a count meaningfully above the range as WARN (possible duplicate ingestion) rather than PASS.

## Key uniqueness
**What it checks**: the designated key column(s) (e.g., `order_id`) contain no duplicate values.
**Why it matters**: most downstream aggregation joins or sums by this key. A duplicate key means any rollup either double-counts or silently drops a row, with no way to tell which from the aggregate number alone.
**Scoring**: FAIL if any duplicate key value exists. Always a hard rule — never WARN — because the failure mode directly corrupts any numeric rollup downstream.

## Duplicates (full-row)
**What it checks**: no two rows are identical across every column.
**Why it matters**: distinct from key uniqueness. A full-row duplicate usually indicates an ingestion replay or retry that inserted the same record twice; a duplicate key with *differing* other fields usually indicates an ID collision or reuse bug upstream. Both matter, but point to different root causes and should be reported separately, not merged into one finding.
**Scoring**: FAIL if any exact duplicate row exists. Note in the evidence whether duplicate keys found above are also full-row duplicates or not — that distinction is diagnostic and worth keeping in the report.

## Required fields
**What it checks**: every field the contract marks required is non-null and non-empty on every row.
**Why it matters**: a required field is usually required because something downstream groups, filters, or joins on it (e.g., `region` for a regional rollup). A blank value either gets silently excluded from every view that uses it, or lumped into an "unknown" bucket with no way to reconcile it back to a real value.
**Scoring**: FAIL if any required field is null/empty on any row. Hard rule.

## Nulls (non-required fields)
**What it checks**: fields not explicitly marked required, but which would be surprising if null (e.g., `product_category` on an order row).
**Why it matters**: distinguishes "expected optional field, sometimes blank" from "field that's blank in a way nobody expected" — the latter often signals an upstream extraction bug rather than a legitimate business case.
**Scoring**: WARN by default. These are advisory unless the contract explicitly upgrades a specific field to a hard rule, in which case treat it under Required Fields instead.

## Numeric rules
**What it checks**: contract-specified numeric constraints — e.g., a value must be greater than zero, within a range, or of a given type (integer vs. decimal).
**Why it matters**: numeric-constraint violations (like negative revenue on an orders table) usually signal that a different kind of record — a refund, adjustment, or correction — got miscoded into the same feed as the primary record type. Left unflagged, it silently distorts any sum or average computed from that column.
**Scoring**: FAIL if any row violates a contract-specified numeric rule. Hard rule, since these directly corrupt aggregate numbers.

## Overall PASS / WARN / FAIL rollup
- **FAIL**: any hard-rule check (schema, freshness by default, key uniqueness, required fields, numeric rules, full-row duplicates) has at least one violation.
- **WARN**: only advisory checks (non-required nulls, or freshness/volume explicitly marked advisory by the contract) have violations, and all hard rules pass.
- **PASS**: every check clears with zero violations.

## PUBLISH / BLOCK mapping
- **FAIL → BLOCK**, always.
- **WARN → BLOCK** if the dataset feeds a decision-facing artifact (executive dashboard, financial report, anything acted on without re-checking); otherwise flag for review rather than auto-blocking, and say so explicitly in the recommendation.
- **PASS → PUBLISH**.
