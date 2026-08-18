# ADR 0005 — Distribution Boundary: Overlay on Vanilla opencode

**Status**: Accepted (provisional — see Consequences)
**Date**: 2026-08-12

## Context

New users must install, invoke, and understand what hypoc puts on their machines. Before any onboarding surface can be designed, the product boundary must be settled: is hypoc a *standalone product* that bundles opencode, or an *overlay* on top of a user-installed opencode?

The repo presented three conflicting answers: QUICKSTART.md treated hypoc as a plain opencode workspace; `bin/hypoc` + `bin/install` treated it as a launcher command; README.md described a self-contained platform package.

## Decision

Hypoc is a **distribution layered on top of vanilla opencode**:

- The user installs opencode separately (prerequisite).
- Hypoc adds the package: workspace config (`.opencode/opencode.json`, kept in sync with `.hypoc.json`), skills, agents, plugins (model router, memory, superpowers, ecc-universal).
- The `hypoc` launcher is the single canonical entry point; it wraps opencode with the hypoc workspace configuration.

The decision is marked "today's boundary": a standalone product bundling opencode itself remains a possible future direction and is not ruled out.

## Consequences

- Onboarding can be scoped precisely: install = clone package + symlink launcher + register Ollama models.
- Disclosure of machine-level changes must enumerate exactly what the distribution adds beyond vanilla opencode (global config writes, PATH entries, plugins, auto-committed memory artifacts).
- The launcher/invocation contract (`hypoc` everywhere) becomes a documentation invariant.
- If hypoc later becomes a standalone bundled product, this ADR must be superseded and the onboarding surface redesigned.
