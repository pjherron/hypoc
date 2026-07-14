# ADR 0002 — Custom Model Router; No LiteLLM

## Status
Accepted

## Context
The platform requires four-tier model routing (Local → Self-hosted → GitHub Copilot → Premium hosted) with cost tracking. LiteLLM is the obvious off-the-shelf solution for multi-provider routing in Python. However, LiteLLM's proxy server and enterprise features require a commercial license, making it a vendor dependency the team cannot take on.

## Decision
Build a **custom model router** in `hypoc-face-router` (FastAPI) using direct provider SDKs:

- **OpenAI Python SDK** — covers Ollama (OpenAI-compatible endpoint), GitHub Copilot (OpenAI-compatible), and any self-hosted model exposed via an OpenAI-compatible API.
- **Anthropic Python SDK** — covers Claude (premium tier or any Anthropic-hosted model).

The router implements:
1. Tier selection by task complexity / cost policy (cheapest capable model first).
2. Fallback logic (if local unavailable, escalate to next tier).
3. Per-session token/cost accounting surfaced to the browser UI.
4. Extensible provider registry — adding the fourth (premium) tier when the provider is known requires only a new SDK entry and a routing rule, not a redesign.

## Consequences
- No commercial license dependency in the routing layer.
- More build work upfront than dropping in LiteLLM proxy.
- Routing logic is ours to own, debug, and extend.
- OpenAI SDK compatibility requirement is a soft constraint on self-hosted model choice (must expose OpenAI-compatible API — Ollama, vLLM, llama.cpp server all do).
- Cost tracking schema must be designed from scratch (LiteLLM would have provided this).
