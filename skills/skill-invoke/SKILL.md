---
name: skill-invoke
description: Consent wrapper for skill invocation. Presents Accept / Review / Revise / Decline before any skill fires. Use this instead of invoking skills directly.
disable-model-invocation: true
origin: Platform
---

# Skill Invoke

The consent layer between intent detection and skill execution.

## Prompt Format

```
I can help with [plain-language description — not the skill name].

[Accept]   Run it now.
[Review]   Show me the full skill definition first.
[Revise]   Let me adjust it before running.
[Decline]  Skip this.
```

## Rules

- The description must say what will happen for the user, not what the skill is internally called.
- **Review** → show SKILL.md content, re-present the prompt.
- **Revise** → open SKILL.md for inline edit, apply to a temporary copy, re-present, run the revision. Only save permanently if the user explicitly asks.
- **Decline** → note the declination; do not re-suggest the same skill for the same intent this session.
- Explicit slash commands bypass this prompt entirely.
