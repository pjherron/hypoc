# ADR 0001 — Implicit Skill Invocation with Consent Prompt

## Status
Accepted

## Context
The platform has a library of 40+ skills. Users cannot be expected to know skill names before using them — requiring explicit slash commands as the only entry point creates a bootstrapping problem that defeats adoption. At the same time, silently invoking a skill without the user's awareness removes transparency and trust.

## Decision
Skill invocation is **implicit by default, explicit always available**.

The system detects developer intent from natural language context and recruits relevant skills automatically via `skill-recruitment`. Before a skill fires, the user receives a consent prompt:

> Skill detected: **[skill name]** — [one-line description]
> `[Accept]` `[Review skill]` `[Revise skill]` `[Decline]`

- **Accept** — invoke the skill as-is.
- **Review skill** — show the full SKILL.md before deciding.
- **Revise skill** — open the skill for inline editing before this invocation.
- **Decline** — skip the skill, continue without it.

Explicit slash commands (e.g. `/to-spec`) remain available and bypass the prompt for users who know what they want.

## Consequences
- Zero skill-name knowledge required at first use.
- User retains full control — nothing fires without consent.
- Skill descriptions become load-bearing: they must be precise enough to inform a consent decision in one line.
- `skill-recruitment` must run early in every session, before the user's first substantive request.
- Explicit invocation path must remain stable — power users depend on it.
