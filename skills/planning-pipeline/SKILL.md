---
name: planning-pipeline
description: The full feature planning chain — grill, model, spec, tickets. Use when starting a new feature or fix to understand the correct sequence of planning skills and when to skip steps.
---

# Planning Pipeline

The standard sequence for turning a raw idea into agent-ready tickets.

```
idea → grill-with-docs → domain-modeling → to-spec → to-tickets → implement
```

## When to use each step

### `/grill-with-docs`
Run when the idea is vague, the requirements are fuzzy, or the domain is contested. Asks one question at a time, waits for answers, creates ADRs and updates `CONTEXT.md` as decisions land. Skip if the plan is already fully specified.

### `/domain-modeling`
Run continuously alongside grilling and spec writing — not as a separate phase. Challenges terminology, stress-tests edge cases, maintains `CONTEXT.md` as the canonical glossary. Never put implementation detail in `CONTEXT.md`.

### `/to-spec`
Run once grilling is done. Synthesizes the conversation into a PRD — no more interviewing. Publishes to the issue tracker with `ready-for-agent`. Skip if a spec already exists.

### `/to-tickets`
Run after the spec exists. Breaks the plan into tracer-bullet vertical slices, each demoable on its own, each declaring what blocks it. Present to the user, iterate, then publish to the tracker.

### `/implement`
Not part of this pipeline — but it's what consumes the tickets. Work the frontier: any ticket whose blockers are all done.

## Decision tree

```
Is the idea vague or domain fuzzy?
  YES → grill-with-docs → domain-modeling → to-spec → to-tickets
  NO  → Does a spec exist?
          YES → to-tickets
          NO  → to-spec → to-tickets

Is this a bug?
  → triage → verify → to-spec (if needs brief) → to-tickets
```

## Key rules

- **One question at a time** during grilling — never a list
- **CONTEXT.md is a glossary only** — no specs, no scratch-pad, no file paths
- **ADRs sparingly** — only when hard to reverse, surprising without context, and a real trade-off
- **Vertical slices** — each ticket cuts through every layer, not a horizontal slice of one layer
- **Wide refactors** are the exception — use expand → migrate → contract sequencing
- **Frontier first** — always work the ticket with no remaining blockers

## Complementary skills

- `grill-me` — lighter version of grilling, no docs
- `triage` — for incoming issues and PRs rather than new features
- `to-spec` — spec writing step
- `to-tickets` — ticket breakdown step
- `domain-modeling` — glossary and ADR discipline
