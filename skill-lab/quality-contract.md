# Quality Contract — Orders Dataset

**Dataset**: `skill-lab/orders.csv`
**Purpose**: Source data for the executive revenue dashboard.

## Rules

| Field | Rule |
|---|---|
| `order_id` | Must be unique across all rows — no duplicates. |
| `region` | Required — must not be null or empty on any row. |
| `revenue` | Must be greater than 0 on every row. |
| `load_timestamp` | Must be less than 24 hours old at validation time. |
| *(dataset)* | Expected row count: at least 10 rows. |

## Notes
- Violations of `order_id` uniqueness, `region` presence, or `revenue > 0` are hard failures.
- A stale `load_timestamp` (24 hours old or more) is treated as blocking, not merely advisory — this dataset feeds an executive dashboard, so freshness is not optional.
- A row count below 10 is a hard failure — it indicates a likely incomplete extract.
