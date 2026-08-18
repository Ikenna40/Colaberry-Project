---
name: session-changelog
description: Use once a session's PROGRESS.md entries are finalized (typically right after progress-log, or when the user asks for a session changelog/report) to regenerate that session's branded HTML change report per CLAUDE.md's "Per-session change report" rule. Do NOT use mid-change, before PROGRESS.md has been updated, or to write PROGRESS.md entries themselves — that is progress-log's job.
allowed-tools: Read, Bash
---

# Session Changelog

## When to use this skill
Trigger after `PROGRESS.md` has at least one entry tagged with the current Session ID — normally right after the `progress-log` skill runs, or whenever the user explicitly asks to see "today's changes" or "a session report." This fulfills CLAUDE.md's "Per-session change report (HTML)" requirement: one HTML file per session, regenerated after every logged change.

Do **not** trigger:
- Before any `PROGRESS.md` entry exists for this session — there would be nothing to render
- To decide *whether* something belongs in `PROGRESS.md` — that judgment call belongs to `progress-log`
- To hand-write the HTML report yourself — this skill exists specifically so that never happens (see Rules)

## Required inputs
- The current session's **Session ID** (e.g. `CC-20260809-9f2k`) — read it from the most recent entry this session wrote to `PROGRESS.md`. Don't guess it.

## Procedure
1. Confirm `PROGRESS.md` contains at least one entry tagged with this session's ID (a quick read is enough — the script itself will also fail loudly if none exist).
2. Run the deterministic generator, passing the Session ID:
   ```
   node scripts/generateSessionChangelog.js <SessionID>
   ```
3. Report back the output path the script prints (`docs/sessions/SESSION_<SessionID>.html`) and how many entries it rendered.
4. If the user asked for a silent regeneration (no browser pop-up), add the `--no-open` flag instead:
   ```
   node scripts/generateSessionChangelog.js <SessionID> --no-open
   ```

## Rules
- **Never write the changelog HTML by hand.** The only reason this skill needs no `Write` or `Edit` access is that every report is forced through the same deterministic script — so the same session's data always produces the same report, not a slightly different one depending on how carefully it was hand-written that time.
- If the script exits with an error (e.g. no entries found for that Session ID), report the exact error back rather than papering over it by inventing content.
- One report file per session — re-running this skill for a session overwrites only that session's own file, never another session's.
- Styling changes belong in `.claude/skills/session-changelog/template.html`, not in the generation logic.
