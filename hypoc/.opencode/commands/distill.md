---
description: Distill a named closed session into a committed decision artifact now (explicit write-path control)
---

# Distill Command

Distill the named session into a committed decision artifact: $ARGUMENTS

## Task

1. Determine the session id. The argument is a session id (e.g. `ses_...`). If a full session id is not given, ask the user or list recent sessions first.
2. Run the distill CLI:

```
bun hypoc/memory/bin/distill-session.js "<session-id>"
```

3. Report the outcome exactly as returned: `DISTILLED <artifact path> (source-session <id>)` or `NO_DECISION <reason>`.

## Rules

- This is a **thin wrapper** over the distill contract — no extra analysis, no re-prompting the model.
- The session must be closed. If the sweep has already distilled it, say so (the artifact already exists under `memory/decisions/`).
- `NO_DECISION` is a valid outcome: a session without a decision is recorded as processed, not retried forever.

## Output Format

```
DISTILLED memory/decisions/<date>-<slug>.md (source-session <session id>)
# or
NO_DECISION <reason>
```
