# TODO

Updated 2026-07-16.

## Remaining in this repo

- [ ] **enterprise-toolkit refresh** — package.json still references `ecc-universal >=1.10.0` peer dep and placeholder author/org fields
- [ ] **Decide hypoc-face disposition** — development stopped (opencode web is built in); code remains in-tree. Archive and remove, or leave as reference.

## Out of scope (decided)

- **hypoc-face** — not being developed. opencode's built-in `opencode web` replaced the browser UI; the backend services (core, router, rag, agent, workspace) are not being pursued in this repo.
- **Cloud model tiers** (Anthropic/Google credentials, 4-tier routing) — separate project.
- **TDD baseline / SAS migration overlay** — separate projects.

## Done

- [x] Provider-agnostic: all Bedrock references removed
- [x] hypoc self-contained: skills (69), agents (73), scripts vendored in; all 18 config paths verified
- [x] Root-level skills/agents dedup (hypoc/ is canonical)
- [x] Ollama model registration + sync script (tool-incompatible models excluded, sizes shown)
- [x] docker-compose and pydantic-settings fixes
- [x] History scrubbed of AI attribution trailers
