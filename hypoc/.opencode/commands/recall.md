---
description: Recall past decisions from the memory brain (automatic warm-start is the primary surface; this is the manual escape hatch)
---

# Recall Command

Retrieve distilled decision artifacts relevant to: $ARGUMENTS

## Task

1. Run the recall CLI with the query:

```
bun hypoc/memory/bin/recall.js "$ARGUMENTS"
```

2. Present the results exactly as returned: each line is a decision artifact with its `source-session` link.
3. If no query was given, use "help me remember what we decided recently".

## Rules

- This is a **thin wrapper** over the recall contract — do not re-rank, summarize, or filter the results.
- Count is already Miller-bounded by the brain (default 5, hard ceiling 9). Do not raise it.
- The automatic warm-start surface is the primary recall path; this command is only a manual escape hatch.

## Output Format

```
# Recalled N result(s) for "<query>"
- <score> | <artifact path> | source-session: <session id> | <title>
```
