---
name: progress-log
description: Use immediately after finishing a code, config, or infra change in this repo, to append a properly formatted PROGRESS.md entry per CLAUDE.md's Definition-of-Done gate. Do NOT use for research-only turns, memory-file updates, dry runs, or anything that didn't change a tracked file — CLAUDE.md explicitly excludes those from PROGRESS.md.
allowed-tools: Read, Edit, Write, Bash
---

# Progress Log

## When to use this skill
Trigger right after an implementation change lands in this repo — a code edit, a config change, a new script, a directive update. Per CLAUDE.md, no change is "done" without a `PROGRESS.md` entry; this is that gate.

Do **not** trigger for:
- Research, exploration, or read-only turns that changed nothing
- Memory-file additions
- Dry runs or discovery output that never shipped
- Sending emails, creating Basecamp tickets, or other actions that aren't tracked file changes

## Procedure

1. **Confirm a Session ID exists.** If this is the first change of the session, mint one now: `CC-<YYYYMMDD>-<4 random alphanumerics>`, generated fresh — never reused from a prior entry in `PROGRESS.md`.
2. **Identify what actually changed.** Run `git status` and `git diff --stat` to get the real list of touched files rather than reconstructing it from memory.
3. **Re-read the tail of `PROGRESS.md`** immediately before writing — another session may have appended since it was last read. If the file doesn't exist yet, create it first.
4. **Append one entry** after the current last line, under the relevant task heading:

   ```markdown
   - [x] <task name>
     - Date: YYYY-MM-DD
     - Session: CC-<YYYYMMDD>-<id>
     - What changed: <one line>
     - Verification: <test name | deploy URL | "user confirmed" | "TypeScript passes">
     - Notes: <only if blocker, deviation, or non-obvious decision>
   ```

5. **Never mark `[x]` without real verification evidence** on the same line — intent is not evidence.
6. **Never edit or "clean up" another session's entries** — only ever touch lines carrying this session's own Session ID.

## Rules
- One entry per completed change, not one entry per file touched.
- If several files changed for one logical change, they're still a single entry with a combined "What changed" line.
- Stage and commit only the specific files this session touched — never `git add -A`.
