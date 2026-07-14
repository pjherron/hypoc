# ADR 0004 — Dual Operating Modes: Suggestion and Execution

## Status
Accepted

## Context
The team has uneven AI adoption maturity. The AI/data science expert is comfortable with autonomous agent execution. The data science quick-study and PM/engineer are capable but not fully committed to autonomy. A platform that only offers one mode forces a choice between alienating cautious users and under-serving confident ones.

## Decision
The platform supports two modes that coexist without friction:

**Suggestion mode** — the AI proposes, the developer decides. Implemented via skills: triggered, constrained, single-task. The developer remains in the driver's seat at every step.

**Execution mode** — the AI executes, the developer reviews after. Implemented via agents: multi-step, autonomous, runs to completion before handing back. The developer reviews the result, not each step.

The consent prompt in ADR 0001 is the transition mechanism: `[Accept]` runs suggestion mode, but agents invoked through the same prompt run in execution mode. The user picks the mode by what they invoke, not by a settings toggle.

There is a natural graduation path: a developer who repeatedly accepts the same skill's suggestions gains confidence and eventually switches to the agent form of that workflow. The platform does not push this transition — it makes it available.

## Consequences
- Every major workflow should have both a skill form (suggestion) and an agent form (execution) where practical.
- The planning pipeline already follows this: individual skills (`to-spec`, `to-tickets`) are suggestion mode; `feature-planner` agent is execution mode.
- Skills and agents share the same library and discovery mechanism — no separate systems.
- Shadow profiles track which mode each user gravitates toward per task type, enabling smarter recruitment over time.
