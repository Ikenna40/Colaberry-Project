# ETL Failure Triage — Common Failure Reference

Symptom-to-cause patterns for common ETL/ELT failure modes. Consult this when a failure's signature doesn't already clearly match something diagnosed before.

## Schema mismatch
**Typical symptoms**: schema validation step errors or warnings; "unexpected type," "value not in expected enum/lookup," or "NOT NULL constraint violated" messages; failure surfaces before row-level transformation runs.
**Common causes**: source system changed a field's format or values without notice; a column expected to match a fixed enum/lookup table receives free-text or unmapped values; a nullable source field flows into a column defined as required downstream.
**Next diagnostic step**: compare the source column's actual distinct values (and null rate) against the expected schema/enum definition; identify exactly which value(s) triggered the mismatch.

## Mapping / conversion failure
**Typical symptoms**: an error inside a named transformation/mapping step, often a "key not found," "lookup miss," or type-coercion exception; occurs after schema validation passes (or only warns) but before load.
**Common causes**: a lookup/mapping table is missing an entry for a value present in the source data — including null/blank, which many mapping tables don't define a fallback for; a type conversion assumes a format the source no longer guarantees (date format drift, locale-specific number formatting).
**Next diagnostic step**: identify the specific input value that failed to map or convert, and check whether the mapping/lookup table has — or should have — an entry or default for it.

## Retry that doesn't resolve
**Typical symptoms**: the same step fails identically across multiple retry attempts — same error message, same row, same stack trace, every time.
**Common causes**: the failure is deterministic (bad data, a missing mapping entry, a schema violation) rather than transient (network blip, lock contention, rate limit) — retries only help transient failures. Retrying a deterministic failure just delays detection and burns the retry budget.
**Next diagnostic step**: compare the error across retry attempts. If the message, row, and stack trace are identical every time, treat it as deterministic — stop retrying and escalate for a data or mapping fix instead.

## Connectivity / timeout
**Typical symptoms**: connection reset, timeout, DNS resolution failure, or "could not connect to host" errors; often clusters around a specific time of day or a specific piece of infrastructure.
**Common causes**: source or target system was briefly unavailable, a network partition, credential/token expiry, or a firewall/allowlist change.
**Next diagnostic step**: check whether the failure correlates with a known maintenance window or infrastructure incident; check credential/token expiry timestamps against the run time.

## Volume anomaly
**Typical symptoms**: row count extracted or loaded is far below (or above) the expected/historical range, with no explicit error raised.
**Common causes**: an upstream filter or WHERE clause changed; a partial extract caused by an earlier silent failure; a duplicate run that re-loaded the same batch.
**Next diagnostic step**: compare this run's row count against the trailing N runs' history; check the extract query/filter logic for recent changes.

## Duplicate / idempotency failure
**Typical symptoms**: a unique-constraint violation on load, or downstream row counts higher than expected with no corresponding source increase.
**Common causes**: a retry or manual re-run reprocessed a batch that had already loaded successfully, with no idempotency key to prevent the duplicate.
**Next diagnostic step**: check the target table for an idempotency/dedup key definition, and check run metadata for evidence of more than one run against the same source batch.

## Credential / permission failure
**Typical symptoms**: "access denied," "401/403," or "insufficient privilege" errors, typically at the very start of a run (connect or extract step).
**Common causes**: expired or rotated credentials, a revoked service-account permission, or a source-system access-policy change.
**Next diagnostic step**: check credential expiry/rotation logs against the run's start time; confirm the service account's current permissions against what the step requires.
