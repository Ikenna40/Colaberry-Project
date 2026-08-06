# Data Quality Report — Orders Dataset

**Dataset**: `skill-lab/orders.csv`
**Quality Contract**: `skill-lab/quality-contract.md`
**Validated**: 2026-08-03
**Validation method**: Automated execution of the `data-quality-gate` Agent Skill. Source data was read only; `orders.csv` was not modified.

## Results

| Check | Evidence | Status | Recommended Action |
|---|---|---|---|
| Schema | Contract-required columns (`order_id`, `region`, `revenue`, `load_timestamp`) all present in the header row | PASS | None |
| Freshness | 11/12 rows loaded 2026-08-03 (fresh); `ORD-1009` has `load_timestamp` = 2026-07-31T10:00:00Z — approximately 3 days old, exceeding the contract's 24-hour limit | **FAIL** | Re-extract/re-load the source batch behind `ORD-1009` before publishing |
| Expected volume | 12 rows present; contract minimum is 10 | PASS | None |
| Key uniqueness (`order_id`) | `ORD-1004` appears twice: row 4 (`order_date` 2026-08-02, `load_timestamp` 08:25:00Z) and row 9 (`order_date` 2026-08-03, `load_timestamp` 08:45:00Z) — identical product/quantity/revenue, different dates | **FAIL** | Investigate the source system for ID collision or reuse; resolve to a single canonical row |
| Full-row duplicates | The two `ORD-1004` rows differ in `order_date` and `load_timestamp`, so they are not identical rows | PASS | None — distinct finding from the `order_id` uniqueness failure above |
| Required fields (`region`) | `ORD-1005` has an empty `region` value | **FAIL** | Backfill `region` from the source system or exclude the row before publishing |
| Nulls (other fields) | No unexpected blanks found in `order_id`, `order_date`, `product_category`, `quantity`, `revenue`, or `load_timestamp` beyond the `region` gap already noted | PASS | None |
| Numeric rules (`revenue > 0`) | `ORD-1007` has `revenue = -49.99` | **FAIL** | Likely a refund/return miscoded as a new order — correct or exclude before publishing |

## Summary

- Rows evaluated: 12
- Hard-rule violations: 4 — freshness, key uniqueness, required field, numeric rule

## Final Result: FAIL

## Recommendation: BLOCK

Do not publish this dataset to the executive revenue dashboard. Four hard-rule violations were found; resolve each at the source and re-validate before publication.
