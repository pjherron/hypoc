---
name: bootstrap
description: Zero-knowledge entry point. Fires at the start of every session — loads prior context, recruits relevant skills, and surfaces capabilities without requiring the user to know any skill names.
disable-model-invocation: false
origin: Platform
---

# Bootstrap

The platform's first action in every session. No user input required to trigger it.

## What It Does

1. **Recruit skills** — run `skill-recruitment` to find skills relevant to this project and the user's recent work patterns.
2. **Load prior session** — run `session-recruitment` to surface what was worked on previously and any open threads.
3. **Orient the user** — present a brief, plain-language summary of what the platform can help with today. Describe capabilities, never skill names.
4. **Stand by** — wait for the user's first request. Detect intent, then present the skill consent prompt before invoking anything.

## Skill Consent Prompt

Before invoking any skill, always present:

> I can help with **[plain-language description of what will happen]**.
> `[Accept]` `[Review]` `[Revise]` `[Decline]`

- **Accept** — invoke the skill as-is.
- **Review** — show the full skill definition, then re-present the prompt.
- **Revise** — open the skill for inline adjustment; run the revised version. Do not permanently save the revision unless the user asks.
- **Decline** — skip; do not re-suggest the same skill for the same intent this session.

## Rules

- Never name a skill to the user unless they ask.
- `skill-recruitment` and `session-recruitment` are infrastructure — they run silently without a consent prompt.
- If nothing relevant is recruited, say so plainly and ask what the user wants to work on.
- Explicit slash commands (e.g. `/to-spec`) bypass the consent prompt — the user already knows what they want.
