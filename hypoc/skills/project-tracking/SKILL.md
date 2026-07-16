---
name: project-tracking
description: Mandatory task tracking for all multi-step work. Use TodoWrite for any work with 3 or more steps.
---

# Project Tracking

Track all multi-step work with the TodoWrite tool. This is mandatory, not optional.

## Rules

1. **Any work with 3+ steps requires a todo list.** Create it before starting, not after.
2. **Mark tasks completed immediately** when done — never batch updates at the end.
3. **Exactly one task `in_progress` at a time.** Finish or park the current task before starting the next.
4. **Break vague requests into concrete steps.** "Fix the build" becomes: reproduce failure, identify cause, apply fix, verify.
5. **Surface blockers as tasks.** If something blocks progress, add it to the list rather than silently working around it.

## Why

- The user sees live progress without asking for status.
- Interrupted sessions resume cleanly — the todo list is the handoff document.
- Skipped steps become visible instead of silently dropped.

## Session end

Before ending a session, ensure no task is left `in_progress`. Either complete it or note in the task description exactly where work stopped and what remains.
